// builds the typed dataset from the json files in /data. no db, all committed files.
// hues and counts are derived for display only, not scores.
import {
  FeedSchema,
  ProtocolSchema,
  CoverageFileSchema,
  GovernanceSchema,
  AuditsFileSchema,
  IncidentsFileSchema,
  TvlFileSchema,
  PROVENANCE,
  type Feed,
  type Protocol,
  type Cell,
  type Governance,
  type Audit,
  type Incident,
  type FeedType,
  type FeedTier,
} from "@/lib/schema";

// glob all data files, bundled at build time
const feedMods = import.meta.glob("/data/feeds/*.json", { eager: true });
const protoMods = import.meta.glob("/data/protocols/*.json", { eager: true });
const coverageMods = import.meta.glob("/data/coverage/*.json", { eager: true });
const govMods = import.meta.glob("/data/governance/*.json", { eager: true });
const auditMods = import.meta.glob("/data/audits/*.json", { eager: true });
const incidentMods = import.meta.glob("/data/incidents/*.json", { eager: true });
const tvlMods = import.meta.glob("/data/tvl/latest.json", { eager: true });

const def = (m: unknown) => (m as { default: unknown }).default;
const DEV = import.meta.env.DEV;

// matrix column order, anchors first -> unverified last
const FEED_ORDER = [
  "defiscan", "blockanalitica", "philidor", "xerberus", "credora", "llamarisk",
  "curatorwatch", "zyfai", "pigi", "defisafety", "pharos", "defisaver",
  "defipunkd", "risklayer", "defisphere",
];
const tierRank: Record<FeedTier, number> = {
  anchor: 0, scoped: 1, secondary: 2, marginal: 3, unverified: 4,
};

// feed type hues by methodology category, not a risk color
const TYPE_HUE: Record<FeedType, number> = {
  Rating: 262, Dashboard: 192, Research: 322, Monitoring: 38, Analysis: 152, Verification: 12,
};
// protocol monogram hues, identity only
const MONO_PALETTE = [262, 222, 192, 158, 128, 92, 60, 32, 14, 350, 322, 292];

// load + validate feeds
export interface FeedRow extends Feed {
  hue: number;
  coveredCount: number; // derived, for column sorter
  partialCount: number;
  cellCount: number;
}
const feeds: FeedRow[] = Object.values(feedMods)
  .map((m) => {
    const raw = def(m);
    const f = DEV ? FeedSchema.parse(raw) : (raw as Feed);
    return { ...f, hue: TYPE_HUE[f.type] ?? 220, coveredCount: 0, partialCount: 0, cellCount: 0 };
  })
  .sort((a, b) => {
    const ia = FEED_ORDER.indexOf(a.key);
    const ib = FEED_ORDER.indexOf(b.key);
    if (ia !== -1 && ib !== -1) return ia - ib;
    return tierRank[a.tier] - tierRank[b.tier] || a.name.localeCompare(b.name);
  });

// live metrics from defillama ingestion
const tvlFile = Object.values(tvlMods)[0]
  ? (DEV ? TvlFileSchema.parse(def(Object.values(tvlMods)[0])) : (def(Object.values(tvlMods)[0]) as ReturnType<typeof TvlFileSchema.parse>))
  : { generatedAt: "", source: "", protocols: {} as Record<string, { value: number; metric: "tvl" | "volume"; source: string; asOf: string }> };

// load + validate protocols
export interface ProtocolRow extends Protocol {
  hue: number;
  mono: string;
  tvl: number;
  tvlSource: string;
  tvlAsOf: string;
  covered: number;
  partial: number;
  feedsTotal: number;
}

const protoBase: Protocol[] = Object.values(protoMods).map((m) => {
  const raw = def(m);
  return DEV ? ProtocolSchema.parse(raw) : (raw as Protocol);
});

// default order is by live metric desc, sorted below

// coverage matrix
type Matrix = Record<string, Record<string, Cell>>;
const coverageByFeed: Record<string, Record<string, Cell>> = {};
for (const m of Object.values(coverageMods)) {
  const raw = def(m);
  const file = DEV ? CoverageFileSchema.parse(raw) : (raw as ReturnType<typeof CoverageFileSchema.parse>);
  coverageByFeed[file.feed] = file.cells;
}

// governance / audits / incidents
const GOV: Record<string, Governance> = {};
for (const m of Object.values(govMods)) {
  const raw = def(m) as Governance & { protocol?: string };
  const parsed = DEV ? GovernanceSchema.parse(raw) : raw;
  const key = (raw as { protocol?: string }).protocol;
  if (key) GOV[key] = parsed;
}
const AUDITS: Record<string, Audit[]> = {};
for (const m of Object.values(auditMods)) {
  const file = DEV ? AuditsFileSchema.parse(def(m)) : (def(m) as ReturnType<typeof AuditsFileSchema.parse>);
  AUDITS[file.protocol] = file.audits;
}
const INCIDENTS: Record<string, Incident[]> = {};
for (const m of Object.values(incidentMods)) {
  const file = DEV ? IncidentsFileSchema.parse(def(m)) : (def(m) as ReturnType<typeof IncidentsFileSchema.parse>);
  INCIDENTS[file.protocol] = file.incidents;
}

// assemble protocols with live metric + coverage counts
const MATRIX: Matrix = {};
const protocols: ProtocolRow[] = protoBase.map((p) => {
  const metricRec = tvlFile.protocols[p.key];
  const row: ProtocolRow = {
    ...p,
    hue: 0,
    mono: p.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2),
    tvl: metricRec?.value ?? 0,
    tvlSource: metricRec?.source ?? `https://defillama.com/protocol/${p.defillama.slugs[0]}`,
    tvlAsOf: metricRec?.asOf ?? "",
    covered: 0,
    partial: 0,
    feedsTotal: 0,
  };
  // build this protocol's matrix row
  MATRIX[p.key] = {};
  for (const f of feeds) {
    let cell: Cell;
    if (f.tier === "unverified") {
      cell = { status: "flagged" };
    } else {
      cell = coverageByFeed[f.key]?.[p.key] ?? { status: "none" };
    }
    MATRIX[p.key][f.key] = cell;
  }
  return row;
});

// sort by live metric desc, then assign monogram hues by final order
protocols.sort((a, b) => b.tvl - a.tvl);
protocols.forEach((p, i) => {
  p.hue = MONO_PALETTE[i % MONO_PALETTE.length];
  const cells = Object.values(MATRIX[p.key]);
  p.covered = cells.filter((c) => c.status === "covered").length;
  p.partial = cells.filter((c) => c.status === "partial").length;
  p.feedsTotal = p.covered + p.partial;
});

// per-feed coverage counts for the column sorter
for (const f of feeds) {
  let cov = 0, par = 0;
  for (const p of protocols) {
    const c = MATRIX[p.key][f.key];
    if (c?.status === "covered") cov++;
    else if (c?.status === "partial") par++;
  }
  f.coveredCount = cov;
  f.partialCount = par;
  f.cellCount = cov + par;
}

// categories
const CATEGORIES = Array.from(new Set(protocols.map((p) => p.cat))).sort();

// stats
const activeFeeds = feeds.filter((f) => f.tier !== "unverified");
const STATS = {
  protocols: protocols.length,
  feeds: feeds.length,
  feedsActive: activeFeeds.length,
  feedsFlagged: feeds.length - activeFeeds.length,
  cells: protocols.length * feeds.length,
  activeCells: protocols.length * activeFeeds.length,
  covered: 0,
  partial: 0,
  totalTVL: protocols.filter((p) => p.metric === "tvl").reduce((s, p) => s + p.tvl, 0),
};
for (const p of protocols) {
  STATS.covered += p.covered;
  STATS.partial += p.partial;
}

// helpers
export function fmtUSD(n: number): string {
  if (!n) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
}

const asOf =
  tvlFile.generatedAt?.slice(0, 10) ||
  (Object.values(tvlFile.protocols)[0]?.asOf ?? "");

export const dria = {
  PROV: PROVENANCE,
  FEEDS: feeds,
  PROTOCOLS: protocols,
  CATEGORIES,
  MATRIX,
  GOV,
  AUDITS,
  INCIDENTS,
  STATS,
  TYPE_HUE,
  activeFeedCount: activeFeeds.length,
  fmtUSD,
  feedByKey: (k: string) => feeds.find((f) => f.key === k),
  protoByKey: (k: string) => protocols.find((p) => p.key === k),
  asOf,
};

export type Dria = typeof dria;
