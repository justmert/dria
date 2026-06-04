// zod schemas + types for the data files. validated in dev/ci.
import { z } from "zod";

// enums

export const feedTypes = [
  "Rating",
  "Dashboard",
  "Research",
  "Monitoring",
  "Analysis",
  "Verification",
] as const;
export const FeedType = z.enum(feedTypes);
export type FeedType = z.infer<typeof FeedType>;

// tier = maturity + machine-readability, not a quality ranking
export const feedTiers = [
  "anchor",
  "scoped",
  "secondary",
  "marginal",
  "unverified",
] as const;
export const FeedTier = z.enum(feedTiers);
export type FeedTier = z.infer<typeof FeedTier>;

export const provenanceTags = [
  "onchain",
  "feed",
  "curated",
  "self-reported",
] as const;
export const Provenance = z.enum(provenanceTags);
export type Provenance = z.infer<typeof Provenance>;

// coverage status per protocol x feed cell
export const coverageStatuses = ["covered", "partial", "none", "flagged"] as const;
export const CoverageStatus = z.enum(coverageStatuses);
export type CoverageStatus = z.infer<typeof CoverageStatus>;

export const metricKinds = ["tvl", "volume"] as const;
export const MetricKind = z.enum(metricKinds);
export type MetricKind = z.infer<typeof MetricKind>;

// block fields that would be a score of our own. rating holds the provider's payload verbatim.
export const COMPOSITE_DENYLIST = [
  "score",
  "composite",
  "aggregate",
  "overall",
  "normalized",
  "rank",
  "weighted",
  "blended",
] as const;

const noCompositeKeys = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).superRefine((val, ctx) => {
    for (const key of Object.keys(val)) {
      if ((COMPOSITE_DENYLIST as readonly string[]).includes(key.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Field "${key}" is denied by the no-composite rule.`,
          path: [key],
        });
      }
    }
  });

// feeds

export const FeedSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  short: z.string().min(1),
  type: FeedType,
  tier: FeedTier,
  focus: z.string().min(1),
  output: z.string().min(1), // provider's native output format
  integration: z.string().min(1), // how we pull it in
  license: z.string().min(1),
  keyRequired: z.boolean(),
  conflict: z.string().min(1), // funding / conflict disclosure
  url: z.string().min(1), // bare host, no scheme
  methodologyUrl: z.string().url().optional(),
  repo: z.string().optional(),
  api: z.string().optional(),
  tierNote: z.string().optional(), // shown when tier is conditional
});
export type Feed = z.infer<typeof FeedSchema>;

// protocols

export const ProtocolSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  cat: z.string().min(1),
  metric: MetricKind,
  site: z.string().min(1),
  token: z.string().min(1),
  desc: z.string().min(1),
  versions: z.array(z.string()),
  // defillama slugs summed for the headline metric
  defillama: z.object({
    slugs: z.array(z.string().min(1)).min(1),
    dimension: z.enum(["dexs", "aggregators", "options", "derivatives"]).optional(), // for volume protocols
  }),
  // governance source hints for safe / defiscan ingestion
  governance: z
    .object({
      safe: z.string().optional(),
      safeChain: z.string().optional(),
      defiscanSlug: z.string().optional(),
      tally: z.string().optional(),
    })
    .optional(),
});
export type Protocol = z.infer<typeof ProtocolSchema>;

// live metric (defillama ingestion output)

export const MetricRecordSchema = z.object({
  value: z.number().nonnegative(),
  metric: MetricKind,
  source: z.string().url(),
  asOf: z.string(),
  breakdown: z.record(z.string(), z.number()).optional(), // per-slug breakdown
});
export type MetricRecord = z.infer<typeof MetricRecordSchema>;

export const TvlFileSchema = z.object({
  generatedAt: z.string(),
  source: z.string(),
  protocols: z.record(z.string(), MetricRecordSchema),
});
export type TvlFile = z.infer<typeof TvlFileSchema>;

// coverage cells

export const CellSchema = noCompositeKeys({
  status: CoverageStatus,
  rating: z.string().optional(), // provider payload, never computed
  kind: z.string().optional(), // render hint: stage|grade|vector|pqr|dashboard...
  note: z.string().optional(), // provider's own note
  source: z.string().url().optional(),
  asOf: z.string().optional(), // iso date
});
export type Cell = z.infer<typeof CellSchema>;

export const CoverageFileSchema = z.object({
  feed: z.string(),
  generatedAt: z.string(),
  method: z.enum(["ingested", "curated"]), // how cells were produced
  cells: z.record(z.string(), CellSchema),
});
export type CoverageFile = z.infer<typeof CoverageFileSchema>;

// governance

export const GovSourceSchema = z.object({
  prov: Provenance,
  url: z.string().url().optional(),
});

export const GovernanceSchema = z.object({
  type: z.string().optional(),
  multisig: z.string().optional(),
  multisigUrl: z.string().url().optional(),
  threshold: z.string().optional(),
  timelock: z.string().optional(),
  signersKnown: z.string().optional(),
  pause: z.string().optional(),
  upgrade: z.string().optional(),
  emergency: z.string().optional(),
  generatedAt: z.string().optional(),
  sources: z.record(z.string(), GovSourceSchema).optional(),
});
export type Governance = z.infer<typeof GovernanceSchema>;

// audits & incidents

export const AuditSchema = z.object({
  firm: z.string().min(1),
  date: z.string().min(1),
  url: z.string().url(),
  scope: z.string().optional(),
});
export type Audit = z.infer<typeof AuditSchema>;

export const AuditsFileSchema = z.object({
  protocol: z.string(),
  audits: z.array(AuditSchema),
});
export type AuditsFile = z.infer<typeof AuditsFileSchema>;

export const IncidentSchema = z.object({
  date: z.string().min(1),
  loss: z.string().min(1),
  type: z.string().min(1),
  recovered: z.string().optional(),
  source: z.string().min(1),
  url: z.string().url().optional(),
});
export type Incident = z.infer<typeof IncidentSchema>;

export const IncidentsFileSchema = z.object({
  protocol: z.string(),
  incidents: z.array(IncidentSchema),
});
export type IncidentsFile = z.infer<typeof IncidentsFileSchema>;

// provenance descriptions

export const PROVENANCE: Record<Provenance, { label: string; desc: string }> = {
  onchain: {
    label: "onchain",
    desc: "Fetched directly from chain or a verified onchain source (Safe API, viem).",
  },
  feed: {
    label: "feed",
    desc: "Sourced from a feed provider's published assessment.",
  },
  curated: {
    label: "curated",
    desc: "Manually researched and added by a human curator via pull request, with a source link.",
  },
  "self-reported": {
    label: "self-reported",
    desc: "Provided by the protocol team directly. Lowest trust tier.",
  },
};
