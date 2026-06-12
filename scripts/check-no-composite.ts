// check no coverage cell has a field that looks like a score/rank/aggregate of
// our own. providers' values only live in `rating`. denylisted keys fail ci.
// same denylist the zod schema uses, just spelled out here.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPOSITE_DENYLIST } from "../src/lib/schema";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COVERAGE = join(ROOT, "data", "coverage");
const ALLOWED_CELL_KEYS = new Set(["status", "rating", "kind", "note", "source", "asOf"]);
const deny = new Set((COMPOSITE_DENYLIST as readonly string[]).map((s) => s.toLowerCase()));

let violations = 0;
const flag = (file: string, msg: string) => {
  violations++;
  console.error(`  ✗ ${file}: ${msg}`);
};

if (existsSync(COVERAGE)) {
  for (const f of readdirSync(COVERAGE).filter((x) => x.endsWith(".json"))) {
    const file = `data/coverage/${f}`;
    const json = JSON.parse(readFileSync(join(COVERAGE, f), "utf8")) as { cells?: Record<string, Record<string, unknown>> };
    for (const [pk, cell] of Object.entries(json.cells ?? {})) {
      for (const key of Object.keys(cell)) {
        const lk = key.toLowerCase();
        if (deny.has(lk)) flag(file, `cell "${pk}" has denied composite field "${key}"`);
        if (!ALLOWED_CELL_KEYS.has(key)) flag(file, `cell "${pk}" has unexpected field "${key}" (allowed: ${[...ALLOWED_CELL_KEYS].join(", ")})`);
      }
    }
  }
}

console.log(`No-composite scan complete · denylist: ${[...deny].join(", ")}`);
if (violations) {
  console.error(`\n${violations} no-composite violation(s) — the charter forbids DRIA from storing a score of its own.`);
  process.exit(1);
}
console.log("No composite fields found. The verbatim guarantee holds. ✓");
