// zyfai risk ingestion (risk.zyf.ai). undocumented but public json api.
// each pool has boolean risk checks (apy/utilization/tvl stability, collateral
// health). output is a pass/fail checklist per pool, not a score, so we show the
// flagship pool's checklist as "<n>/<m> checks". no averaging.
// endpoints (chainId=1 = ethereum mainnet):
//   /api/api/v2/opportunities/safe
//   /api/api/v2/opportunities/async
//   /api/api/v2/opportunities/degen-strategies
import { fetchJSON, writeData, todayISO } from "./lib.ts";

const DASHBOARD = "https://risk.zyf.ai/";
const CHAIN_ID = 1;
const ENDPOINTS = ["safe", "async", "degen-strategies"] as const;

// the boolean checks zyfai exposes per pool
const BOOL_CHECKS = ["isApyStable7Days", "isUtilizationStable", "isTvlStable"] as const;
const CHECK_TOTAL = BOOL_CHECKS.length + 1; // +1 for collateralHealth

interface CollateralHealth {
  isHealthy?: boolean;
}

interface Pool {
  protocol_name?: string;
  pool_name?: string;
  pool_address?: string;
  tvl?: number | null;
  status?: string;
  url?: string;
  isApyStable7Days?: boolean;
  isUtilizationStable?: boolean;
  isTvlStable?: boolean;
  collateralHealth?: CollateralHealth;
}

interface ApiResponse {
  status?: string;
  data?: Pool[];
}

// map a zyfai protocol_name to a dria key. null if we don't track it.
// morpho pools here are metamorpho vaults, so they map to "morpho-vaults".
function toDriaKey(p: Pool): string | null {
  const name = (p.protocol_name ?? "").trim();
  switch (name) {
    case "Aave V3":
      return "aave";
    case "Compound V3":
      return "compound";
    case "Spark":
      return "spark";
    case "Fluid":
      return "fluid";
    case "Euler":
      return "euler";
    case "Yearn":
      return "yearn";
    case "Morpho":
      return "morpho-vaults";
    default:
      return null; // superform, wasabi, dolomite, etc. not tracked
  }
}

// count how many checks pass for a pool
function passingChecks(p: Pool): number {
  let n = 0;
  for (const c of BOOL_CHECKS) if (p[c] === true) n++;
  if (p.collateralHealth?.isHealthy === true) n++;
  return n;
}

async function main(): Promise<void> {
  // fetch all three ethereum endpoints
  const collected: Pool[] = [];
  const errors: string[] = [];
  for (const ep of ENDPOINTS) {
    const url = `https://risk.zyf.ai/api/api/v2/opportunities/${ep}?chainId=${CHAIN_ID}`;
    try {
      const res = await fetchJSON<ApiResponse>(url);
      const pools = Array.isArray(res?.data) ? res.data : [];
      collected.push(...pools);
      console.log(`  ${ep}: ${pools.length} pools`);
    } catch (e) {
      errors.push(`${ep}: ${(e as Error).message}`);
      console.error(`  ${ep}: FETCH FAILED — ${(e as Error).message}`);
    }
  }

  // got nothing? write an empty but valid file
  if (collected.length === 0) {
    console.error("\nNo Zyfai pool data fetched — endpoints unreachable.");
    if (errors.length) console.error("Errors:\n  " + errors.join("\n  "));
    writeData("data/coverage/zyfai.json", {
      feed: "zyfai",
      generatedAt: todayISO(),
      method: "ingested",
      cells: {},
    });
    console.log("Wrote EMPTY cells (no fabrication).");
    return;
  }

  // group pools by dria key
  const byKey = new Map<string, Pool[]>();
  for (const p of collected) {
    const key = toDriaKey(p);
    if (!key) continue;
    (byKey.get(key) ?? byKey.set(key, []).get(key)!).push(p);
  }

  const asOf = todayISO().slice(0, 10);
  const cells: Record<string, unknown> = {};

  for (const [key, pools] of byKey) {
    if (pools.length < 1) continue;

    // dedupe pools by address (same pool shows up across endpoints)
    const distinct = new Set(pools.map((p) => p.pool_address ?? p.pool_name ?? Math.random()));

    // flagship = highest tvl pool for this protocol
    const flagship = pools.reduce((a, b) => ((b.tvl ?? 0) > (a.tvl ?? 0) ? b : a));
    const pass = passingChecks(flagship);

    // link to the flagship pool if there's a per-pool url, else the dashboard
    const source =
      typeof flagship.url === "string" && /^https?:\/\//.test(flagship.url)
        ? flagship.url
        : DASHBOARD;

    cells[key] = {
      status: "partial",
      rating: `${pass}/${CHECK_TOTAL} checks`,
      kind: "checks",
      note: `${distinct.size} pool${distinct.size === 1 ? "" : "s"} tracked`,
      source,
      asOf,
    };

    console.log(
      `  ${key}: ${pass}/${CHECK_TOTAL} checks · ${distinct.size} pools · flagship="${flagship.pool_name}"`
    );
  }

  writeData("data/coverage/zyfai.json", {
    feed: "zyfai",
    generatedAt: todayISO(),
    method: "ingested",
    cells,
  });

  console.log(`\nCovered ${Object.keys(cells).length} protocols from real Zyfai data.`);
}

main().catch((e) => {
  console.error("zyfai ingestion failed:", e);
  process.exit(1);
});
