// check the source links in the data are still live. hits the network so it
// runs in the scheduled data-health workflow. collects every source/url across
// coverage, audits, incidents and governance and checks each one. exits
// non-zero on any hard 404.
// run: npx tsx scripts/check-links.ts
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

function collectUrls(): { url: string; where: string }[] {
  const urls: { url: string; where: string }[] = [];
  const walk = (sub: string, pick: (j: unknown, name: string) => { url: string; where: string }[]) => {
    const dir = join(DATA, sub);
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      urls.push(...pick(JSON.parse(readFileSync(join(dir, f), "utf8")), `${sub}/${f}`));
    }
  };
  walk("coverage", (j, name) => Object.entries((j as { cells: Record<string, { source?: string }> }).cells).flatMap(([k, c]) => (c.source ? [{ url: c.source, where: `${name}:${k}` }] : [])));
  walk("audits", (j, name) => (j as { audits: { url: string }[] }).audits.map((a, i) => ({ url: a.url, where: `${name}#${i}` })));
  walk("incidents", (j, name) => (j as { incidents: { url?: string }[] }).incidents.flatMap((a, i) => (a.url ? [{ url: a.url, where: `${name}#${i}` }] : [])));
  walk("governance", (j, name) => Object.entries((j as { sources?: Record<string, { url?: string }> }).sources ?? {}).flatMap(([k, s]) => (s.url ? [{ url: s.url, where: `${name}:${k}` }] : [])));
  return urls;
}

async function check(url: string): Promise<number> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "dria-linkcheck" } });
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "dria-linkcheck" } });
    }
    clearTimeout(t);
    return res.status;
  } catch {
    return 0;
  }
}

const urls = collectUrls();
const seen = new Map<string, { url: string; where: string }>();
for (const u of urls) if (!seen.has(u.url)) seen.set(u.url, u);
console.log(`Checking ${seen.size} unique source links…\n`);

let dead = 0;
const results = await Promise.all(
  [...seen.values()].map(async ({ url, where }) => ({ url, where, status: await check(url) }))
);
for (const r of results.sort((a, b) => a.status - b.status)) {
  // 0 = network/timeout (often bot-blocked), 2xx/3xx ok, 401/402/403/429 = gated, not dead
  const hardDead = r.status === 404 || r.status === 410;
  if (hardDead) {
    dead++;
    console.error(`  ✗ ${r.status} ${r.url}  (${r.where})`);
  } else if (r.status === 0 || r.status >= 400) {
    console.warn(`  ? ${r.status || "ERR"} ${r.url}  (${r.where}) — gated/blocked, not counted as dead`);
  }
}
console.log(`\n${seen.size - dead}/${seen.size} links OK · ${dead} hard-dead (404/410).`);
if (dead) process.exit(1);
console.log("No dead source links. ✓");
