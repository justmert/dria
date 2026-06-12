// check every protocol's defillama slug still resolves. hits the network so it
// runs in the scheduled data-health workflow, not pr ci.
// run: npx tsx scripts/check-slugs.ts
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROTO = join(ROOT, "data", "protocols");

interface P { key: string; metric: string; defillama: { slugs: string[] } }
const protocols = readdirSync(PROTO)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(PROTO, f), "utf8")) as P);

let bad = 0;
for (const p of protocols) {
  if (p.metric === "volume") continue; // volume comes from the overview endpoint, not /tvl
  for (const slug of p.defillama.slugs) {
    try {
      const res = await fetch(`https://api.llama.fi/tvl/${slug}`);
      const txt = await res.text();
      const ok = res.ok && /^[0-9.eE+-]+$/.test(txt.trim());
      console.log(`  ${ok ? "✓" : "✗"} ${p.key.padEnd(14)} ${slug.padEnd(22)} ${ok ? "$" + (Number(txt) / 1e6).toFixed(0) + "M" : "UNRESOLVED (" + res.status + ")"}`);
      if (!ok) bad++;
    } catch (e) {
      console.log(`  ✗ ${p.key} ${slug} — ${(e as Error).message}`);
      bad++;
    }
  }
}
if (bad) {
  console.error(`\n${bad} DefiLlama slug(s) failed to resolve.`);
  process.exit(1);
}
console.log("\nAll DefiLlama slugs resolve. ✓");
