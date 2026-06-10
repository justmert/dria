// philidor ingestion. philidor.io scores individual defi vaults via a public
// api (api.philidor.io/v1). each vault has a risk_tier (Prime/Core/Edge) from a
// 0-10 score. since they score vaults not whole protocols, each cell is marked
// partial: rating = the tier of the protocol's largest tvl ethereum vault, note
// = how many vaults + the flagship. no averaging.
// only ethereum mainnet vaults (chain_id 1).
// run: npx tsx ingest/philidor.ts
import { fetchJSON, writeData, todayISO } from "./lib.ts";

const API = "https://api.philidor.io/v1";
// analytics dashboard, /vaults takes a ?protocol=<id> filter
const ANALYTICS = "https://analytics.philidor.io";

// one vault record from GET /v1/vaults
interface PhilidorVault {
  id: string;
  protocol_id: string;
  protocol_name: string;
  chain_id: number;
  chain_name: string;
  curator_id: string | null;
  name: string;
  symbol: string;
  tvl_usd: number | null;
  total_score: string | null;
  risk_tier: string | null; // e.g. "Prime" | "Core" | "Edge"
  is_active: boolean;
}

interface VaultsResponse {
  data: PhilidorVault[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// map a philidor vault to a dria key. null if it's not one we track (beefy, nest).
// morpho: curated metamorpho vaults (curator_id set) -> "morpho-vaults",
// bare morpho blue markets (no curator) -> "morpho".
function toProtocolKey(v: PhilidorVault): string | null {
  switch (v.protocol_id) {
    case "aave":
      return "aave";
    case "spark":
      return "spark";
    case "uniswap":
      return "uniswap";
    case "compound":
      return "compound";
    case "yearn":
      return "yearn";
    case "morpho":
      return v.curator_id ? "morpho-vaults" : "morpho";
    default:
      return null; // not one we track (beefy, nest, ...)
  }
}

// deep link to the analytics dashboard filtered to this protocol
function sourceFor(philidorProtocolId: string): string {
  return `${ANALYTICS}/vaults?protocol=${encodeURIComponent(philidorProtocolId)}`;
}

async function fetchAllEthereumVaults(): Promise<PhilidorVault[]> {
  const out: PhilidorVault[] = [];
  const limit = 100; // server max page size
  let page = 1;
  for (;;) {
    const res = await fetchJSON<VaultsResponse>(
      `${API}/vaults?chain=ethereum&limit=${limit}&page=${page}`
    );
    if (!res?.data) throw new Error(`unexpected response shape on page ${page}`);
    out.push(...res.data);
    const totalPages = res.meta?.totalPages ?? page;
    if (page >= totalPages) break;
    page++;
  }
  // just in case, keep only ethereum mainnet
  return out.filter((v) => v.chain_id === 1);
}

function tvl(v: PhilidorVault): number {
  return typeof v.tvl_usd === "number" && Number.isFinite(v.tvl_usd) ? v.tvl_usd : 0;
}

async function main() {
  console.log("Philidor: fetching Ethereum-mainnet vaults from", `${API}/vaults`);
  const vaults = await fetchAllEthereumVaults();
  console.log(`Philidor: fetched ${vaults.length} Ethereum-mainnet vault(s)`);

  // group by dria key, remember the philidor protocol_id for the source link
  const groups = new Map<string, { philidorId: string; vaults: PhilidorVault[] }>();
  for (const v of vaults) {
    const key = toProtocolKey(v);
    if (!key) continue;
    if (!v.risk_tier) continue; // skip vaults with no tier
    const g = groups.get(key) ?? { philidorId: v.protocol_id, vaults: [] };
    g.vaults.push(v);
    groups.set(key, g);
  }

  const asOf = todayISO().slice(0, 10);
  const cells: Record<string, Record<string, string>> = {};

  for (const [key, { philidorId, vaults: vs }] of [...groups.entries()].sort()) {
    // flagship = highest tvl scored vault, its tier is the cell rating
    const flagship = vs.reduce((a, b) => (tvl(b) > tvl(a) ? b : a));
    const tier = flagship.risk_tier as string;
    const count = vs.length;

    // most common tier across this protocol's vaults, just for the note (not a composite)
    const tierCounts = new Map<string, number>();
    for (const v of vs) tierCounts.set(v.risk_tier!, (tierCounts.get(v.risk_tier!) ?? 0) + 1);
    const modal = [...tierCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const distribution = [...tierCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${c} ${t}`)
      .join(", ");

    const note =
      `${count} Ethereum vault${count === 1 ? "" : "s"} scored ` +
      `(largest: ${flagship.symbol || flagship.name} → ${tier}; ` +
      `tiers: ${distribution})`;

    cells[key] = {
      status: "partial", // philidor is vault-scoped, not protocol-scoped
      rating: tier, // flagship vault's risk_tier
      kind: "vector",
      note,
      source: sourceFor(philidorId),
      asOf,
    };

    console.log(
      `  ${key.padEnd(14)} ${count} vault(s)  flagship=${flagship.symbol} ` +
        `tier=${tier}  modal=${modal[0]} (${modal[1]})`
    );
  }

  const covered = Object.keys(cells);
  if (covered.length === 0) throw new Error("no DRIA-mapped Philidor vaults found");

  writeData("data/coverage/philidor.json", {
    feed: "philidor",
    generatedAt: todayISO(),
    method: "ingested",
    cells,
  });

  console.log(`Philidor: covered ${covered.length} protocol(s): ${covered.join(", ")}`);
}

main().catch((e) => {
  console.error("Philidor ingestion failed:", e);
  process.exit(1);
});
