// pull live tvl/volume from defillama (api.llama.fi, no key needed)
// morpho vaults comes from morpho's api so we don't double count morpho blue.
// unresolved slugs just count as 0 and show up in the breakdown.
import { fetchJSON, loadProtocols, writeData, todayISO } from "./lib";

const LLAMA = "https://api.llama.fi";

async function tvlForSlug(slug: string): Promise<number> {
  // /tvl/{slug} gives back the current usd tvl as a plain number
  const v = await fetchJSON<number>(`${LLAMA}/tvl/${slug}`);
  return typeof v === "number" && isFinite(v) ? v : 0;
}

interface OverviewItem { name: string; total24h: number | null; slug?: string }
interface Overview { protocols: OverviewItem[] }

let aggregatorsCache: Overview | null = null;
async function aggregators(): Promise<Overview> {
  if (!aggregatorsCache) {
    aggregatorsCache = await fetchJSON<Overview>(
      `${LLAMA}/overview/aggregators?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`
    );
  }
  return aggregatorsCache;
}

const VOLUME_NAME_MATCH: Record<string, RegExp> = {
  cowswap: /^cow\s?swap$|^cow protocol$/i,
  "1inch": /^1inch/i,
  zerox: /^0x|matcha/i,
};

async function volumeFor(key: string): Promise<{ value: number; matched: string }> {
  const ov = await aggregators();
  const rx = VOLUME_NAME_MATCH[key];
  const hits = ov.protocols.filter((p) => rx.test(p.name));
  const value = hits.reduce((s, p) => s + (p.total24h ?? 0), 0);
  return { value, matched: hits.map((h) => h.name).join(", ") || "(no match)" };
}

async function morphoVaultsTVL(): Promise<number> {
  // morpho graphql api, sum vault total assets on ethereum (chainId 1)
  const q = `{ vaults(first: 1000, where: { chainId_in: [1] }) { items { state { totalAssetsUsd } } } }`;
  const data = await fetchJSON<{ data?: { vaults?: { items?: { state?: { totalAssetsUsd?: number } }[] } } }>(
    "https://blue-api.morpho.org/graphql",
    { body: JSON.stringify({ query: q }) }
  );
  const items = data.data?.vaults?.items ?? [];
  return items.reduce((s, it) => s + (it.state?.totalAssetsUsd ?? 0), 0);
}

async function main() {
  const protocols = loadProtocols();
  const out: Record<string, { value: number; metric: "tvl" | "volume"; source: string; asOf: string; breakdown: Record<string, number> }> = {};
  const now = todayISO();

  for (const p of protocols) {
    try {
      let value = 0;
      const breakdown: Record<string, number> = {};
      let source = `https://defillama.com/protocol/${p.defillama.slugs[0]}`;

      if (p.key === "morpho-vaults") {
        value = await morphoVaultsTVL();
        breakdown["morpho-vaults"] = value;
        source = "https://app.morpho.org/ethereum/earn";
      } else if (p.metric === "volume") {
        const { value: v, matched } = await volumeFor(p.key);
        value = v;
        breakdown[matched] = v;
        source = `https://defillama.com/aggregators`;
      } else {
        for (const slug of p.defillama.slugs) {
          const v = await tvlForSlug(slug);
          breakdown[slug] = v;
          value += v;
        }
      }

      out[p.key] = { value: Math.round(value), metric: p.metric, source, asOf: now, breakdown };
      console.log(
        `  ${p.key.padEnd(14)} ${p.metric === "volume" ? "vol" : "tvl"} $${(value / 1e6).toFixed(1)}M  ${Object.entries(breakdown).map(([k, v]) => `${k}=${(v / 1e6).toFixed(0)}M`).join(" ")}`
      );
    } catch (e) {
      console.error(`  ! ${p.key} failed:`, (e as Error).message);
    }
  }

  const got = Object.keys(out).length;
  if (got < protocols.length) {
    console.warn(`\n  WARNING: only ${got}/${protocols.length} protocols resolved.`);
  }
  writeData("data/tvl/latest.json", { generatedAt: now, source: "https://api.llama.fi", protocols: out });
  console.log(`\nDone: ${got}/${protocols.length} protocols.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
