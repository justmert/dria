// defipunkd ingestion (guil-lambert/defipunkd github dataset).
// assessments live at data/assessments/<slug>/<slice>.json, one per dimension.
// there's no tier field in the data so we recompute wood/bronze/silver/gold the
// same way they do (apps/web/src/lib/tier.ts): a slice has quorum at >=3 models;
// gold = all 5 slices quorum + every consensus strong, silver = all 5 quorum
// with >=1 not-strong, bronze = >=1 slice quorum, wood = some submissions but no
// quorum. when multiple slugs map to one key (curve-dex/crvusd/curve-llamalend
// -> curve) keep the highest tier. only emit a key if we actually fetched it.
import { fetchJSON, writeData, todayISO } from "./lib";

const API = "https://api.github.com/repos/guil-lambert/defipunkd/contents/data/assessments";
const RAW = "https://raw.githubusercontent.com/guil-lambert/defipunkd/main/data/assessments";

// the 5 dimensions ("pizza slices") that count toward the tier. other slice
// files (e.g. "discovery") exist but aren't part of the rubric, so ignore them.
const PIZZA_SLICES = ["control", "ability-to-exit", "autonomy", "open-access", "verifiability"] as const;
const QUORUM_MIN = 3;

type Tier = "none" | "wood" | "bronze" | "silver" | "gold";
const TIER_RANK: Record<Tier, number> = { none: 0, wood: 1, bronze: 2, silver: 3, gold: 4 };
const TIER_LABEL: Record<Tier, string> = {
  none: "None",
  wood: "Wood",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

// defipunkd slug -> dria key. only the ones that map are listed, rest ignored.
const SLUG_TO_KEY: Record<string, string> = {
  aave: "aave",
  "aave-v3": "aave",
  lido: "lido",
  sparklend: "spark",
  "sky-lending": "spark",
  morpho: "morpho",
  "morpho-blue": "morpho",
  "uniswap-v4": "uniswap",
  "curve-dex": "curve",
  crvusd: "curve",
  "curve-llamalend": "curve",
  pendle: "pendle",
  "rocket-pool": "rocket-pool",
  "liquity-v1": "liquity",
  "balancer-v3": "balancer",
};

interface GhEntry { name: string; type: string }

interface SliceFile {
  slug: string;
  slice: string;
  consensus_strength?: string;
  merged_at?: string;
  snapshot_generated_at?: string;
  merged_from?: { model: string }[];
}

interface SlugResult {
  slug: string;
  tier: Tier;
  quorumCount: number;
  gradedSlices: number;
  asOf: string; // yyyy-mm-dd, latest merge/snapshot date seen
}

async function assessSlug(slug: string): Promise<SlugResult | null> {
  // list which slice files this slug actually has
  let entries: GhEntry[];
  try {
    entries = await fetchJSON<GhEntry[]>(`${API}/${slug}`, {
      headers: { "user-agent": "dria-ingest" },
    });
  } catch {
    return null;
  }
  const present = new Set(entries.filter((e) => e.type === "file").map((e) => e.name));

  let quorumCount = 0;
  let tentativeQuorumCount = 0;
  let gradedSlices = 0;
  let anySubmission = false;
  let latest = "";

  for (const dim of PIZZA_SLICES) {
    const fname = `${dim}.json`;
    if (!present.has(fname)) continue;
    let f: SliceFile;
    try {
      f = await fetchJSON<SliceFile>(`${RAW}/${slug}/${fname}`);
    } catch {
      continue;
    }
    const models = f.merged_from?.length ?? 0;
    if (models >= 1) {
      anySubmission = true;
      gradedSlices += 1;
    }
    if (models >= QUORUM_MIN) {
      quorumCount += 1;
      // tentative = consensus isn't "strong" (weak/disagreement/missing)
      if (f.consensus_strength !== "strong") tentativeQuorumCount += 1;
    }
    const d = (f.merged_at ?? f.snapshot_generated_at ?? "").slice(0, 10);
    if (d > latest) latest = d;
  }

  let tier: Tier;
  if (quorumCount >= PIZZA_SLICES.length) tier = tentativeQuorumCount === 0 ? "gold" : "silver";
  else if (quorumCount >= 1) tier = "bronze";
  else if (anySubmission) tier = "wood";
  else tier = "none";

  if (tier === "none") return null;
  return { slug, tier, quorumCount, gradedSlices, asOf: latest || todayISO().slice(0, 10) };
}

async function main() {
  const now = todayISO();

  // list the dataset, keep only slugs that map to a dria key
  const listing = await fetchJSON<GhEntry[]>(API, { headers: { "user-agent": "dria-ingest" } });
  const datasetSlugs = listing.filter((e) => e.type === "dir").map((e) => e.name);
  const relevant = datasetSlugs.filter((s) => s in SLUG_TO_KEY);

  // assess each slug, keep highest tier per dria key
  const best = new Map<string, SlugResult>();
  for (const slug of relevant) {
    const res = await assessSlug(slug);
    if (!res) continue;
    const key = SLUG_TO_KEY[slug];
    const cur = best.get(key);
    if (!cur || TIER_RANK[res.tier] > TIER_RANK[cur.tier]) best.set(key, res);
    console.log(
      `  ${slug.padEnd(18)} -> ${key.padEnd(12)} ${TIER_LABEL[res.tier].padEnd(7)} (${res.quorumCount}/5 dims at quorum, ${res.gradedSlices}/5 graded)`
    );
  }

  const cells: Record<
    string,
    { status: "covered" | "partial"; rating: string; kind: string; note: string; source: string; asOf: string }
  > = {};

  for (const [key, res] of best) {
    const allQuorum = res.quorumCount >= PIZZA_SLICES.length;
    // covered = all 5 dims at quorum (silver/gold), partial = only some (bronze/wood)
    const status: "covered" | "partial" = allQuorum ? "covered" : "partial";
    const note = allQuorum
      ? "5-dimension consensus"
      : `${res.quorumCount}/5 dimensions at consensus (early-stage)`;
    cells[key] = {
      status,
      rating: TIER_LABEL[res.tier],
      kind: "tier",
      note,
      source: `https://defipunkd.com/protocol/${res.slug}`,
      asOf: res.asOf,
    };
  }

  writeData("data/coverage/defipunkd.json", {
    feed: "defipunkd",
    generatedAt: now,
    method: "ingested",
    cells,
  });

  const covered = Object.entries(cells)
    .map(([k, c]) => `${k}=${c.rating}(${c.status})`)
    .sort();
  const allKeys = [
    "lido", "aave", "spark", "morpho", "uniswap", "compound", "morpho-vaults",
    "rocket-pool", "curve", "pendle", "fluid", "liquity", "euler", "balancer",
    "mellow", "yearn", "gearbox", "cowswap", "1inch", "zerox",
  ];
  const missing = allKeys.filter((k) => !(k in cells));
  console.log(`\nCovered ${Object.keys(cells).length}/20 DRIA keys:`);
  for (const c of covered) console.log(`  ${c}`);
  console.log(`\nNot in DeFiPunk'd dataset (${missing.length}): ${missing.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
