// home: the coverage matrix
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { dria } from "@/data/dria";
import { Monogram, TypeLegend } from "@/components/primitives";
import { Select } from "@/components/Select";
import { useGo } from "@/lib/nav";
import type { FeedRow, ProtocolRow } from "@/data/dria";

const FEED_TIER_RANK: Record<string, number> = { anchor: 0, scoped: 1, secondary: 2, marginal: 3, unverified: 4 };
type FeedSort = "coverage" | "tier" | "name";

export function Home() {
  const go = useGo();
  const D = dria;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<{ key: "tvl" | "feeds" | "name"; dir: number }>({ key: "tvl", dir: -1 });
  const [lens, setLens] = useState("");
  const [hover, setHover] = useState({ r: -1, c: -1 });
  const [showFlagged, setShowFlagged] = useState(false);
  const [feedSort, setFeedSort] = useState<FeedSort>("coverage");

  const feeds = useMemo(() => {
    const fs = D.FEEDS.filter((f) => showFlagged || f.tier !== "unverified");
    return [...fs].sort((a, b) =>
      feedSort === "name"
        ? a.name.localeCompare(b.name)
        : feedSort === "tier"
          ? FEED_TIER_RANK[a.tier] - FEED_TIER_RANK[b.tier] || b.cellCount - a.cellCount
          : b.cellCount - a.cellCount || FEED_TIER_RANK[a.tier] - FEED_TIER_RANK[b.tier] || a.name.localeCompare(b.name)
    );
  }, [showFlagged, feedSort]);
  const activeTotal = D.activeFeedCount;
  const lensFeed = lens ? D.feedByKey(lens) : null;

  const rows = useMemo(() => {
    let r = D.PROTOCOLS.filter(
      (p) =>
        (cat === "All" || p.cat === cat) &&
        (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.cat.toLowerCase().includes(q.toLowerCase()))
    );
    if (lensFeed) r = r.filter((p) => { const c = D.MATRIX[p.key][lens]; return c && (c.status === "covered" || c.status === "partial"); });
    const dir = sort.dir;
    return [...r].sort((a, b) =>
      sort.key === "name"
        ? a.name.localeCompare(b.name) * dir
        : sort.key === "feeds"
          ? (a.covered + a.partial - (b.covered + b.partial)) * dir
          : (a.tvl - b.tvl) * dir
    );
  }, [q, cat, sort, lens, showFlagged]);

  const setSortKey = (k: "tvl" | "feeds" | "name") =>
    setSort((s) => (s.key === k ? { key: k, dir: -s.dir } : { key: k, dir: k === "name" ? 1 : -1 }));
  const arr = (k: string) => (sort.key === k ? (sort.dir < 0 ? " ↓" : " ↑") : "");

  const cells = D.STATS.activeCells;
  const covPct = Math.round((D.STATS.covered / cells) * 100);
  const parPct = Math.round((D.STATS.partial / cells) * 100);

  return (
    <div className="fade">
      {/* hero */}
      <div className="wrap" style={{ paddingTop: 56, paddingBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <h1 className="display" style={{ fontSize: "clamp(33px, 7vw, 50px)", lineHeight: 1.05, margin: 0, letterSpacing: "-0.035em", maxWidth: 740 }}>
            Every risk feed, every protocol.
            <br />
            One neutral grid.
          </h1>
          <span className="livepill" style={{ marginTop: 6 }} title={`Live data · updated ${D.asOf}`}>
            <span className="ld" />
            Live <span style={{ color: "var(--ink-4)" }}>·</span> updated <b>{D.asOf}</b>
          </span>
        </div>
        <p style={{ fontSize: "clamp(16px, 2.4vw, 18px)", lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 580, marginTop: 18 }}>
          No single oracle should price an asset; no single feed should grade a protocol's risk. DRIA shows what every
          provider publishes — verbatim, source-tagged, never blended into a score.
        </p>
        <div style={{ display: "flex", gap: 0, marginTop: 30, flexWrap: "wrap" }}>
          <StatItem v={D.STATS.protocols} l="Protocols" />
          <StatItem v={activeTotal} l="Active feeds" />
          <StatItem v={D.fmtUSD(D.STATS.totalTVL)} l="TVL tracked" />
          <StatItem
            v={covPct + "%"}
            l="Cells covered"
            last
            sub={
              <div className="bigbar" style={{ width: 120, marginTop: 9 }}>
                <i style={{ width: covPct + "%", background: "var(--covered)" }} />
                <i style={{ width: parPct + "%", background: "var(--partial)" }} />
              </div>
            }
          />
        </div>
      </div>

      {/* toolbar */}
      <div
        style={{
          position: "sticky",
          top: 66,
          zIndex: 30,
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(14px)",
          marginTop: 40,
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="wrap" style={{ padding: "12px clamp(14px, 5vw, 48px)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="search"
            placeholder="Search protocols…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: "0 1 230px", minWidth: 150 }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["All", ...D.CATEGORIES].map((c) => (
              <button key={c} className={"fchip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Select
              ariaLabel="Sort protocols"
              value={sort.key}
              onChange={(v) => setSort({ key: v as "tvl" | "feeds" | "name", dir: v === "name" ? 1 : -1 })}
              options={[
                { value: "tvl", label: "Sort: TVL" },
                { value: "feeds", label: "Sort: Coverage" },
                { value: "name", label: "Sort: Name" },
              ]}
            />
            <Select
              ariaLabel="Feed lens — highlight one provider"
              menuAlign="right"
              value={lens}
              onChange={setLens}
              options={[
                { value: "", label: "Feed lens: off" },
                ...D.FEEDS.filter((f) => f.tier !== "unverified").map((f) => ({
                  value: f.key,
                  label: "Lens: " + f.name,
                  dot: "oklch(0.6 0.11 " + f.hue + ")",
                })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* matrix */}
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 26 }}>
        {lensFeed && (
          <div className="lens" style={{ ["--lh" as string]: lensFeed.hue }}>
            <span className="lens-ico">
              <i />
            </span>
            <div className="lens-body">
              <div className="lens-title">
                <span className="lens-name">{lensFeed.name}</span>
                <span className="pill" style={{ fontSize: 9.5 }}>
                  {lensFeed.type}
                </span>
                <span className="lens-count">
                  <b>{rows.length}</b> protocols covered
                </span>
              </div>
              <div className="lens-focus">{lensFeed.focus}</div>
            </div>
            <button className="btn lens-clear" style={{ padding: "7px 14px", fontSize: 12.5 }} onClick={() => setLens("")}>
              Clear lens
            </button>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
          <span className="dim mono" style={{ fontSize: 11, letterSpacing: "0.04em" }}>Feed columns</span>
          <Select
            ariaLabel="Order feed columns"
            menuAlign="right"
            value={feedSort}
            onChange={(v) => setFeedSort(v as FeedSort)}
            options={[
              { value: "coverage", label: "Most covered first" },
              { value: "tier", label: "By tier" },
              { value: "name", label: "A–Z" },
            ]}
          />
        </div>
        <MatrixView rows={rows} feeds={feeds} go={go} hover={hover} setHover={setHover} lens={lens} setSortKey={setSortKey} arr={arr} activeTotal={activeTotal} />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <TypeLegend />
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }} className="mono dim">
              <span className="dotc covered" />
              <span style={{ fontSize: 11 }}>covered</span>
            </span>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }} className="mono dim">
              <span className="dotc partial" />
              <span style={{ fontSize: 11 }}>partial</span>
            </span>
            <button className="fchip" onClick={() => setShowFlagged((s) => !s)}>
              {showFlagged ? "Hide" : "Show"} flagged
            </button>
            <span className="dim mono" style={{ fontSize: 11 }}>
              {rows.length} protocols · {feeds.length} feeds
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ v, l, sub, last }: { v: ReactNode; l: string; sub?: ReactNode; last?: boolean }) {
  return (
    <div style={{ padding: "0 28px", borderRight: last ? "none" : "1px solid var(--line)" }}>
      <div className="display tnum" style={{ fontSize: 27, lineHeight: 1 }}>
        {v}
      </div>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 7, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {l}
      </div>
      {sub}
    </div>
  );
}

function MatrixView({
  rows,
  feeds,
  go,
  hover,
  setHover,
  lens,
  setSortKey,
  arr,
  activeTotal,
}: {
  rows: ProtocolRow[];
  feeds: FeedRow[];
  go: (r: string) => void;
  hover: { r: number; c: number };
  setHover: (h: { r: number; c: number }) => void;
  lens: string;
  setSortKey: (k: "tvl" | "feeds" | "name") => void;
  arr: (k: string) => string;
  activeTotal: number;
}) {
  const D = dria;
  const [narrow, setNarrow] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 640 : false));
  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 640);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const LEAD = narrow ? 208 : 300;
  const COL = narrow ? 116 : 138;

  return (
    <div className="mx-scroll">
      <div className="mx-inner">
        <table className="mtable2">
          <colgroup>
            <col style={{ width: LEAD }} />
            {feeds.map((f) => (
              <col key={f.key} style={{ width: COL }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="mxh-lead" style={{ background: "var(--panel)", padding: "0 20px 13px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)", cursor: "pointer" }} onClick={() => setSortKey("name")}>
                    Protocol{arr("name")}
                  </span>
                  <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)", cursor: "pointer" }} onClick={() => setSortKey("tvl")}>
                    TVL{arr("tvl")} · coverage{arr("feeds")}
                  </span>
                </div>
              </th>
              {feeds.map((f, c) => {
                const on = hover.c === c || lens === f.key;
                return (
                  <th key={f.key} style={{ borderLeft: "1px solid var(--line-2)", background: f.tier === "unverified" ? "var(--flag-soft)" : lens === f.key ? "var(--accent-soft)" : "var(--panel)" }}>
                    <div className={"mx-colhead" + (on ? " xcol" : "")} onClick={() => go("feed/" + f.key)} title={f.name + " · " + f.type + (f.tier === "unverified" ? " · unverified" : "")}>
                      <span className="tline" style={{ background: f.tier === "unverified" ? "var(--flag)" : "oklch(0.6 0.11 " + f.hue + ")" }} />
                      <span className="nm" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        {f.name}
                        {f.tier === "unverified" && <span className="flagmark" style={{ width: 7, height: 7 }} />}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, r) => {
              const matrix = D.MATRIX[p.key];
              return (
                <tr key={p.key}>
                  <td className="mxc-lead" style={{ cursor: "pointer" }} onClick={() => go("protocol/" + p.key)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                      <Monogram p={p} size={38} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span className="display" style={{ fontSize: 16 }}>
                            {p.name}
                          </span>
                          {p.versions.length > 0 && (
                            <span className="mono" style={{ fontSize: 9.5, color: "var(--ink-4)" }}>
                              ×{p.versions.length}
                            </span>
                          )}
                        </div>
                        <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1, whiteSpace: "nowrap" }}>
                          {p.cat} · <span style={{ color: "var(--ink-2)" }}>{D.fmtUSD(p.tvl)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                          <div className="meter" style={{ width: 110 }}>
                            <i className="c" style={{ width: (p.covered / activeTotal) * 100 + "%" }} />
                            <i className="p" style={{ width: (p.partial / activeTotal) * 100 + "%" }} />
                          </div>
                          <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                            {p.covered + p.partial}/{activeTotal}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  {feeds.map((f, c) => {
                    const cell = matrix[f.key];
                    const st = cell ? cell.status : "none";
                    const xon = hover.r === r || hover.c === c || lens === f.key;
                    const rating = cell && cell.rating ? (cell.rating.length > 16 ? cell.rating.slice(0, 15) + "…" : cell.rating) : null;
                    const clickable = st !== "none" && st !== "flagged";
                    return (
                      <td
                        key={f.key}
                        className={"mx-cell" + (xon ? " xon" : "")}
                        onMouseEnter={() => setHover({ r, c })}
                        onMouseLeave={() => setHover({ r: -1, c: -1 })}
                        onClick={clickable ? () => go("protocol/" + p.key) : undefined}
                        style={{ cursor: clickable ? "pointer" : "default" }}
                        title={cell && cell.rating ? f.name + ": " + cell.rating : st === "flagged" ? "Unverified — flagged" : "Not yet covered"}
                      >
                        {st === "none" ? (
                          <span style={{ color: "var(--ink-4)", fontFamily: "var(--f-mono)", fontSize: 13 }}>–</span>
                        ) : st === "flagged" ? (
                          <span className="flagmark" />
                        ) : (
                          <span className="cellbtn">
                            <span className={"dotc " + st} />
                            <span className="mono" style={{ fontSize: 11.5, color: "var(--ink)", whiteSpace: "nowrap" }}>
                              {rating}
                            </span>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mx-fade" />
    </div>
  );
}
