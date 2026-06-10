// defiscan ingestion (deficollective/defiscan repo, MIT).
// each protocol is under src/content/protocols/<folder>/ with a data.json and
// per-chain .md files. the .md frontmatter has stage (0/1/2) and a 5-element
// risks array. risks order is:
//   [0] chain  [1] upgradeability  [2] autonomy  [3] exitWindow  [4] accessibility
// we only use the ethereum mainnet review (ethereum.md) and map folders to dria
// keys by defillama slug, falling back to a name match. protocols defiscan
// doesn't review just don't show up. governance answers come straight from the
// published stage + risk levels.
// writes:
//   data/coverage/defiscan.json   one cell per reviewed protocol
//   data/governance/<key>.json    derived governance answers (merged)
import { fetchJSON, fetchText, loadProtocols, writeData, readJSON, todayISO } from "./lib";

const API = "https://api.github.com/repos/deficollective/defiscan/contents/src/content/protocols";
const RAW = "https://raw.githubusercontent.com/deficollective/defiscan/main/src/content/protocols";
const SITE = "https://www.defiscan.info/protocols";

type RiskLevel = "L" | "M" | "H" | "-";

interface GhEntry { name: string; type: "file" | "dir" }
interface DataJson { id?: string; protocol?: string; defillama_slug?: string[] }
interface Review {
  folder: string;
  protocolName: string;
  slugs: string[];
  stage: number;
  risks: RiskLevel[];
  publishDate: string;
  // false when publish_date is the 1970 sentinel
  datePublished: boolean;
}

/* frontmatter parsing */

// grab the yaml frontmatter between the first pair of --- fences
function frontmatter(md: string): string {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---/);
  return m ? m[1] : "";
}

function parseStage(fm: string): number | null {
  const m = fm.match(/^\s*stage:\s*([0-2])\s*$/m);
  return m ? Number(m[1]) : null;
}

function parseRisks(fm: string): RiskLevel[] | null {
  const m = fm.match(/^\s*risks:\s*\[([^\]]*)\]/m);
  if (!m) return null;
  const arr = m[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter((s) => s.length > 0) as RiskLevel[];
  return arr.length ? arr : null;
}

function parseDate(fm: string): { date: string; published: boolean } {
  const m = fm.match(/^\s*publish_date:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})["']?/m);
  // 1970-01-01 means unset, treat as unknown
  if (m && m[1] !== "1970-01-01") return { date: m[1], published: true };
  return { date: todayISO().slice(0, 10), published: false };
}

/* dria mapping */

// map a defiscan folder to a dria key. slug match first, then name. null if
// no dria protocol matches (defiscan reviews lots we don't track).
function mapToDriaKey(
  review: Review,
  protocols: { key: string; name: string; slugs: string[] }[]
): string | null {
  // slug match
  for (const p of protocols) {
    if (review.slugs.some((s) => p.slugs.includes(s))) {
      // morpho-blue is shared by "morpho" and "morpho-vaults". the defiscan
      // "morpho" folder is morpho blue itself, so -> "morpho".
      if (p.key === "morpho-vaults") continue;
      return p.key;
    }
  }
  // name match for the few that don't share a slug
  const n = review.protocolName.toLowerCase();
  const nameMap: Record<string, string> = {
    sky: "spark", // sky/maker -> spark (only if no spark folder)
  };
  for (const [needle, key] of Object.entries(nameMap)) {
    if (n.includes(needle) && protocols.some((p) => p.key === key)) return key;
  }
  return null;
}

/* governance derivation */

const yn = (v: boolean | null): "Yes" | "No" | "Partial" =>
  v === null ? "Partial" : v ? "Yes" : "No";

// turn defiscan risk levels + stage into our governance answers. just
// re-expressing their published data, not making a new call.
//   upgradeability (idx 1): H -> upgrade can take funds -> "Yes"; L -> "No"; M -> "Partial"
//   exitWindow (idx 3): H -> centralized pause/emergency control -> "Yes"; L -> "No"; M -> "Partial"
//   signersKnown: a finished ethereum review means controllers are documented -> "Yes".
//     actual multisig addresses get filled in by the separate safe step.
function deriveGovernance(review: Review, key: string, url: string, now: string) {
  const upg = review.risks[1] ?? "-";
  const exit = review.risks[3] ?? "-";

  const fromLevel = (lvl: RiskLevel): boolean | null =>
    lvl === "H" ? true : lvl === "L" ? false : null; // M or "-" => partial/unknown

  const upgrade = yn(fromLevel(upg));
  // exit-window risk covers centralized control, which includes pause/emergency
  const pause = yn(fromLevel(exit));
  const emergency = yn(fromLevel(exit));

  const src = { prov: "feed" as const, url };
  return {
    protocol: key,
    signersKnown: "Yes",
    pause,
    upgrade,
    emergency,
    generatedAt: now,
    sources: {
      signersKnown: src,
      pause: src,
      upgrade: src,
      emergency: src,
    },
  };
}

/* main */

async function main() {
  const now = todayISO();
  const protocols = loadProtocols().map((p) => ({
    key: p.key,
    name: p.name,
    slugs: p.defillama.slugs,
  }));

  // list the protocol folders
  const entries = await fetchJSON<GhEntry[]>(API);
  const folders = entries.filter((e) => e.type === "dir" && e.name !== "diagrams").map((e) => e.name);
  console.log(`DeFiScan: ${folders.length} protocol folders found.\n`);

  // fetch each folder's ethereum review + data.json
  const reviews: Review[] = [];
  for (const folder of folders) {
    try {
      const md = await fetchText(`${RAW}/${folder}/ethereum.md`);
      const fm = frontmatter(md);
      const stage = parseStage(fm);
      const risks = parseRisks(fm);
      if (stage === null || !risks) {
        console.log(`  - ${folder.padEnd(22)} no usable Ethereum stage/risks, skipping`);
        continue;
      }
      let data: DataJson = {};
      try {
        data = await fetchJSON<DataJson>(`${RAW}/${folder}/data.json`);
      } catch {
        // data.json optional, name still works for matching
      }
      const pub = parseDate(fm);
      reviews.push({
        folder,
        protocolName: data.protocol || folder,
        slugs: data.defillama_slug ?? [],
        stage,
        risks,
        publishDate: pub.date,
        datePublished: pub.published,
      });
    } catch {
      // no ethereum.md means no ethereum mainnet review
      console.log(`  - ${folder.padEnd(22)} no ethereum.md (no Ethereum review)`);
    }
  }

  // map reviews to dria keys. if two folders hit the same key (compound-v2 vs
  // compound-v3), pick the best one: higher stage, then a real date over the
  // 1970 sentinel, then higher version, then more recent date.
  const versionNum = (folder: string): number => {
    const m = folder.match(/v(\d+)\b/);
    return m ? Number(m[1]) : 0;
  };
  const better = (r: Review, prev: Review): boolean => {
    if (r.stage !== prev.stage) return r.stage > prev.stage;
    if (r.datePublished !== prev.datePublished) return r.datePublished;
    const rv = versionNum(r.folder), pv = versionNum(prev.folder);
    if (rv !== pv) return rv > pv;
    return r.publishDate > prev.publishDate;
  };
  const byKey = new Map<string, Review>();
  const unmapped: string[] = [];
  for (const r of reviews) {
    const key = mapToDriaKey(r, protocols);
    if (!key) {
      unmapped.push(`${r.folder} (${r.protocolName})`);
      continue;
    }
    const prev = byKey.get(key);
    if (!prev || better(r, prev)) byKey.set(key, r);
  }

  // build coverage cells + governance files
  const cells: Record<string, unknown> = {};
  const covered: string[] = [];
  for (const [key, r] of [...byKey.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const slug = r.folder;
    const url = `${SITE}/${slug}`;
    const rating = `Stage ${r.stage}`;
    const dims = r.risks.filter((x) => x !== "-").length;
    cells[key] = {
      status: "covered",
      rating,
      kind: "stage",
      note: `${rating} · ${dims} risk dimensions`,
      source: url,
      // only set asOf when there's a real date, leave it off for the 1970 sentinel
      ...(r.datePublished ? { asOf: r.publishDate } : {}),
    };

    // governance: merge with any existing file (the safe step also writes here)
    const govPath = `data/governance/${key}.json`;
    const existing = (readJSON<Record<string, unknown>>(govPath) ?? {}) as Record<string, unknown>;
    const derived = deriveGovernance(r, key, url, now);
    const merged = {
      ...existing,
      ...derived,
      // keep sources from other steps (e.g. onchain safe)
      sources: { ...(existing.sources as object | undefined), ...derived.sources },
    };
    writeData(govPath, merged);

    covered.push(`${key} → ${slug}: ${rating}  risks=[${r.risks.join(",")}]`);
  }

  writeData("data/coverage/defiscan.json", {
    feed: "defiscan",
    generatedAt: now,
    method: "ingested",
    cells,
  });

  // summary
  const allKeys = protocols.map((p) => p.key);
  const coveredKeys = new Set(byKey.keys());
  const missing = allKeys.filter((k) => !coveredKeys.has(k));

  console.log(`\n=== DeFiScan coverage: ${coveredKeys.size}/${allKeys.length} DRIA protocols ===`);
  console.log("Covered:");
  covered.forEach((c) => console.log("  ✓ " + c));
  console.log(`\nNot reviewed by DeFiScan (honest gaps): ${missing.length}`);
  missing.forEach((m) => console.log("  · " + m));
  if (unmapped.length) {
    console.log(`\nDeFiScan reviews outside DRIA's 20 (ignored): ${unmapped.length}`);
    unmapped.forEach((u) => console.log("  – " + u));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
