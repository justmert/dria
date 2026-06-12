// validate every file in /data against the schema and check the cross-refs.
// run: npx tsx scripts/validate-data.ts
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FeedSchema,
  ProtocolSchema,
  CoverageFileSchema,
  GovernanceSchema,
  AuditsFileSchema,
  IncidentsFileSchema,
  TvlFileSchema,
} from "../src/lib/schema";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

let errors = 0;
let checked = 0;
const fail = (file: string, msg: string) => {
  errors++;
  console.error(`  ✗ ${file}\n      ${msg.replace(/\n/g, "\n      ")}`);
};

function readDir(sub: string): { name: string; json: unknown }[] {
  const dir = join(DATA, sub);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ name: `data/${sub}/${f}`, json: JSON.parse(readFileSync(join(dir, f), "utf8")) }));
}

/* load registries first, needed for cross-checks */
const feeds = readDir("feeds");
const protocols = readDir("protocols");
const feedKeys = new Set(feeds.map((f) => (f.json as { key: string }).key));
const protoKeys = new Set(protocols.map((p) => (p.json as { key: string }).key));

/* feeds */
for (const { name, json } of feeds) {
  checked++;
  const r = FeedSchema.safeParse(json);
  if (!r.success) fail(name, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
}

/* protocols */
for (const { name, json } of protocols) {
  checked++;
  const r = ProtocolSchema.safeParse(json);
  if (!r.success) fail(name, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
}

/* coverage */
for (const { name, json } of readDir("coverage")) {
  checked++;
  const r = CoverageFileSchema.safeParse(json);
  if (!r.success) {
    fail(name, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
    continue;
  }
  const file = r.data;
  if (!feedKeys.has(file.feed)) fail(name, `unknown feed key "${file.feed}"`);
  for (const pk of Object.keys(file.cells)) {
    if (!protoKeys.has(pk)) fail(name, `cell references unknown protocol "${pk}"`);
    const cell = file.cells[pk];
    if ((cell.status === "covered" || cell.status === "partial") && !cell.source) {
      fail(name, `cell "${pk}" is ${cell.status} but has no source link (a populated cell must be source-tagged)`);
    }
  }
}

/* governance */
for (const { name, json } of readDir("governance")) {
  checked++;
  const r = GovernanceSchema.safeParse(json);
  if (!r.success) fail(name, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
  const pk = (json as { protocol?: string }).protocol;
  if (!pk || !protoKeys.has(pk)) fail(name, `missing/unknown "protocol" key ("${pk}")`);
}

/* audits */
for (const { name, json } of readDir("audits")) {
  checked++;
  const r = AuditsFileSchema.safeParse(json);
  if (!r.success) fail(name, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
  else if (!protoKeys.has(r.data.protocol)) fail(name, `unknown protocol "${r.data.protocol}"`);
}

/* incidents */
for (const { name, json } of readDir("incidents")) {
  checked++;
  const r = IncidentsFileSchema.safeParse(json);
  if (!r.success) fail(name, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
  else if (!protoKeys.has(r.data.protocol)) fail(name, `unknown protocol "${r.data.protocol}"`);
}

/* tvl */
const tvlPath = join(DATA, "tvl", "latest.json");
if (existsSync(tvlPath)) {
  checked++;
  const r = TvlFileSchema.safeParse(JSON.parse(readFileSync(tvlPath, "utf8")));
  if (!r.success) fail("data/tvl/latest.json", r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
  else for (const pk of Object.keys(r.data.protocols)) if (!protoKeys.has(pk)) fail("data/tvl/latest.json", `unknown protocol "${pk}"`);
}

console.log(`\nValidated ${checked} files · ${feedKeys.size} feeds · ${protoKeys.size} protocols`);
if (errors) {
  console.error(`\n${errors} validation error(s).`);
  process.exit(1);
}
console.log("All data valid. ✓");
