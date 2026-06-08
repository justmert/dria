// feed / provider detail page
import { useParams } from "react-router-dom";
import { dria } from "@/data/dria";
import { Monogram, StatusBadge, SectionHead } from "@/components/primitives";
import { useGo } from "@/lib/nav";

export function FeedDetail() {
  const { key } = useParams();
  const go = useGo();
  const f = dria.feedByKey(key ?? "");
  if (!f)
    return (
      <div className="wrap" style={{ padding: 60 }}>
        Unknown feed.{" "}
        <a onClick={() => go("methodology")} style={{ cursor: "pointer" }}>
          Registry
        </a>
      </div>
    );
  const isUnv = f.tier === "unverified";
  const coverage = dria.PROTOCOLS.map((p) => ({ p, cell: dria.MATRIX[p.key][f.key] }))
    .filter((x) => x.cell && (x.cell.status === "covered" || x.cell.status === "partial"))
    .sort((a, b) => b.p.tvl - a.p.tvl);
  const independent = f.conflict.toLowerCase().includes("independent");
  const meta: [string, string][] = [
    ["Output", f.output],
    ["Integration", f.integration],
    ["License", f.license],
    ["API key", f.keyRequired ? "Required" : "Not required"],
  ];

  // rating spread for this one feed (its own scale)
  const dist = (() => {
    const m: Record<string, number> = {};
    coverage.forEach(({ cell }) => {
      if (cell.rating === undefined) return;
      m[cell.rating] = (m[cell.rating] || 0) + 1;
    });
    const arr = Object.entries(m)
      .map(([rating, n]) => ({ rating, n }))
      .sort((a, b) => b.n - a.n);
    return arr;
  })();
  const maxN = dist.length ? Math.max(...dist.map((d) => d.n)) : 1;
  const showDist = dist.length >= 2 && coverage.length >= 3;

  return (
    <div className="wrap-rd fade" style={{ paddingTop: 28, paddingBottom: 80, maxWidth: 1000 }}>
      <button className="nav-link" style={{ paddingLeft: 0, marginBottom: 18 }} onClick={() => go("methodology")}>← Feed registry</button>

      <div className="rd" style={{ marginTop: 4, gridTemplateColumns: "340px 1fr" }}>
        {/* sticky rail: identity, meta, conflict, distribution */}
        <div className="rd-rail">
          <div className="card elev" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 14, height: 14, borderRadius: 50, flex: "none", background: "oklch(0.6 0.11 " + f.hue + ")", boxShadow: "0 0 0 4px oklch(0.6 0.11 " + f.hue + " / 0.14)" }} />
              <h1 className="display" style={{ fontSize: 23, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{f.name}</h1>
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span className={"tier " + f.tier}>{f.tier}</span>
              <span className="pill" style={{ color: "oklch(0.5 0.1 " + f.hue + ")" }}>{f.type}</span>
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 12 }}><a href={"https://" + f.url} target="_blank" rel="noreferrer">{f.url}</a></div>
            <div style={{ height: 1, background: "var(--line-2)", margin: "16px 0 4px" }} />
            <div className="facts">{meta.map(([k, v]) => <div className="f" key={k}><span className="fl">{k}</span><span className="fv" style={{ maxWidth: 160 }}>{v}</span></div>)}</div>
          </div>

          <div className="ocard" style={{ ["--h" as string]: independent ? 152 : 40, boxShadow: "var(--shadow-sm)", marginTop: 12 }}>
            <div className="kicker">Conflict disclosure</div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 2 }}>
              <span style={{ fontSize: 17, color: independent ? "var(--covered)" : "var(--partial)" }}>{independent ? "○" : "●"}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>{f.conflict}</span>
            </div>
            <div className="dim mono" style={{ fontSize: 10.5, marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--line-2)" }}>Surfacing a feed's funding model is part of neutrality.</div>
          </div>

          {showDist && (
            <div className="card" style={{ padding: 22, marginTop: 12, boxShadow: "var(--shadow-sm)" }}>
              <div className="kicker" style={{ marginBottom: 4 }}>Rating distribution</div>
              <div className="dim" style={{ fontSize: 11.5, marginBottom: 12 }}>How {f.name} rates the {coverage.length} protocols it covers — in its own scale.</div>
              {dist.map((d) => (
                <div className="distrow" key={d.rating}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.rating}</span>
                  <div className="distbar"><i style={{ width: (d.n / maxN * 100) + "%", background: "oklch(0.6 0.11 " + f.hue + ")" }} /></div>
                  <span className="mono tnum" style={{ fontSize: 12, color: "var(--ink-2)", textAlign: "right" }}>{d.n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* main: coverage */}
        <div>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "var(--ink-2)", margin: "2px 0 36px", maxWidth: 600 }}>{f.focus}</p>
          <SectionHead title="Coverage on DRIA"
            right={isUnv ? <span className="stat-f" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="flagmark" style={{ width: 8, height: 8 }} /> flagged — not populated</span> : <span><b style={{ color: "var(--ink)" }}>{coverage.length}</b> protocols</span>}
            sub={isUnv ? "Could not be confirmed as a live product. Listed for transparency; integrated only once a public dataset exists." : "This provider's verbatim view, protocol by protocol. Ratings shown exactly as published."} />
          {isUnv ? (
            <div className="card" style={{ padding: 26, borderColor: "color-mix(in srgb, var(--flag) 30%, var(--line))", boxShadow: "var(--shadow-sm)" }}>
              <div className="mono stat-f" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><span className="flagmark" /> Unverified — no public dataset available.</div>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>No data is invented for flagged providers. The flag itself is honest information.</div>
            </div>
          ) : (
            <div className="panel-list">
              {coverage.map(({ p, cell }) => (
                <div key={p.key} className="lrow" style={{ gridTemplateColumns: "1fr auto", gap: 18, padding: "16px 22px" }} onClick={() => go("protocol/" + p.key)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                    <Monogram p={p} size={34} />
                    <div>
                      <div className="display" style={{ fontSize: 15 }}>{p.name}</div>
                      <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.cat} · {dria.fmtUSD(p.tvl)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <StatusBadge status={cell.status} />
                    <span className="ochip" style={{ ["--h" as string]: f.hue, fontSize: 12.5 }}><span className="tdot" /><span className="rt">{cell.rating ?? ""}</span></span>
                    <span className="dim mono" style={{ fontSize: 10.5, width: 74, textAlign: "right" }}>{cell.asOf ?? ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <hr className="hr" style={{ margin: "36px 0 16px" }} />
          <div className="muted" style={{ fontSize: 13 }}>DRIA shows this feed's output verbatim and never alters it. <a onClick={() => go("methodology")} style={{ cursor: "pointer" }}>How the registry works →</a></div>
        </div>
      </div>
    </div>
  );
}
