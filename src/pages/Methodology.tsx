// methodology page
import { dria } from "@/data/dria";
import { Monogram, ProvTag, SectionHead } from "@/components/primitives";
import { useGo } from "@/lib/nav";
import { REPO_URL } from "@/config";
import type { ProtocolRow } from "@/data/dria";
import type { Provenance } from "@/lib/schema";

export function Methodology() {
  const go = useGo();
  const D = dria;
  const notDo = [
    "Assign its own risk score to any protocol.",
    "Weight, rank, or average feeds against each other.",
    "Tell you whether a protocol is safe or unsafe.",
    "Normalize ratings into a shared scale.",
    "Endorse, or de-list, any protocol or feed.",
  ];
  const does = [
    "Aggregates what every credible risk feed publishes, in one place.",
    "Shows each rating verbatim, in the provider's own format, with a live source link.",
    "Surfaces governance from onchain and verifiable sources, tagged by provenance.",
    "Treats coverage gaps as data — a missing rating is shown, never hidden.",
    "Discloses each feed's funding model and conflicts alongside its ratings.",
    "Keeps the entire dataset open and correctable by pull request.",
  ];

  // coverage example: most vs least covered
  const byCov = [...D.PROTOCOLS].map((p) => ({ p, n: p.covered + p.partial }));
  const most = [...byCov].sort((a, b) => b.n - a.n)[0];
  const thin = [...byCov].sort((a, b) => a.n - b.n)[0];
  const activeTotal = D.FEEDS.filter((f) => f.tier !== "unverified").length;

  const steps: [string, string, string][] = [
    ["Corrections", "Open an issue, or edit a data file and open a pull request.", "data/overlays/"],
    ["New protocols", "PR a record with a verified DefiLlama identifier.", "data/protocols/"],
    ["New feeds", "PR an entry with methodology, license, and conflicts.", "data/feeds/"],
  ];

  return (
    <div className="wrap-rd fade" style={{ paddingTop: 44, paddingBottom: 96, maxWidth: 960 }}>
      {/* hero */}
      <div style={{ maxWidth: 640 }}>
        <div className="eyebrow"><span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--accent)" }} />Methodology</div>
        <h1 className="display" style={{ fontSize: 44, margin: "16px 0 0", letterSpacing: "-0.03em", lineHeight: 1.04 }}>What DRIA does,<br />and refuses to do.</h1>
        <p style={{ fontSize: 17.5, lineHeight: 1.55, color: "var(--ink-2)", marginTop: 18 }}>
          DRIA sits one layer above the risk feeds. It does not produce risk intelligence — it makes the
          intelligence that already exists legible, in one neutral place.
        </p>
      </div>

      {/* oracle analogy panel */}
      <div className="card elev" style={{ marginTop: 40, padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "150px 1fr" }}>
        <div style={{ background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--line)" }}>
          <OracleGlyph />
        </div>
        <div style={{ padding: "30px 32px" }}>
          <div className="eyebrow">The oracle analogy</div>
          <p className="prose-block" style={{ fontSize: 21, lineHeight: 1.5, margin: "12px 0 0", color: "var(--ink)" }}>
            No single price feed should be canonical. A well-designed oracle aggregates many sources into one
            trusted value, treating none as authoritative. <b>The same principle applies to risk</b> — and the
            aggregation is the value.
          </p>
        </div>
      </div>

      {/* does / does not */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 24 }} className="dd-grid">
        <div className="card" style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
            <span className="icbadge flag">✕</span>
            <span className="display" style={{ fontSize: 16 }}>What DRIA <span className="stat-f">does not</span> do</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
            {notDo.map((t, i) => (
              <li key={i} style={{ display: "flex", gap: 12, fontSize: 14, lineHeight: 1.45, padding: "11px 0", borderTop: i ? "1px solid var(--line-2)" : "none" }}>
                <span className="stat-f" style={{ marginTop: 1 }}>✕</span><span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
            <span className="icbadge cov">✓</span>
            <span className="display" style={{ fontSize: 16 }}>What DRIA <span className="stat-c">does</span> do</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
            {does.map((t, i) => (
              <li key={i} style={{ display: "flex", gap: 12, fontSize: 14, lineHeight: 1.45, padding: "11px 0", borderTop: i ? "1px solid var(--line-2)" : "none" }}>
                <span className="stat-c" style={{ marginTop: 1 }}>✓</span><span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* coverage gaps as data */}
      <div style={{ marginTop: 52 }}>
        <SectionHead title="Coverage gaps as data" sub="A missing rating is information, never hidden behind a reassuring number." />
        <div className="card" style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "center" }} >
          <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: 0, color: "var(--ink-2)" }}>
            A protocol no feed has assessed is itself a signal. One covered by two feeds carries a meaningfully
            different profile from one covered by a dozen — before you read a single rating. Every one of the
            {" "}<b style={{ color: "var(--ink)" }}>{D.STATS.activeCells} cells</b> is explicitly labelled
            {" "}<span className="stat-c" style={{ fontWeight: 600 }}>covered</span>,
            {" "}<span className="stat-p" style={{ fontWeight: 600 }}>partial</span>, or
            {" "}<span className="dim" style={{ fontWeight: 600 }}>not yet covered</span>.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <GapExample p={most.p} n={most.n} total={activeTotal} label="Most scrutinized" go={go} />
            <GapExample p={thin.p} n={thin.n} total={activeTotal} label="Thinnest coverage" go={go} />
          </div>
        </div>
      </div>

      {/* feed registry */}
      <div style={{ marginTop: 52 }}>
        <SectionHead title="The feed registry" right={<span><b style={{ color: "var(--ink)" }}>{D.FEEDS.length}</b> providers</span>}
          sub="Every provider DRIA aggregates from. We do not rank them — we tier them by maturity and machine-readability." />
        <div className="panel-list">
          {D.FEEDS.map((f) => (
            <div key={f.key} className="lrow" style={{ gridTemplateColumns: "210px 130px 1fr", gap: 20, padding: "15px 24px" }} onClick={() => go("feed/" + f.key)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, flex: "none", display: "grid", placeItems: "center", background: "oklch(0.93 0.05 " + f.hue + ")", boxShadow: "inset 0 0 0 1px oklch(0.8 0.05 " + f.hue + " / 0.5)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 50, background: "oklch(0.6 0.11 " + f.hue + ")" }} />
                </span>
                <span className="display" style={{ fontSize: 14.5 }}>{f.name}</span>
              </div>
              <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                <span style={{ fontSize: 11.5, color: "oklch(0.5 0.085 " + f.hue + ")", fontWeight: 500 }}>{f.type}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between" }}>
                <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.4 }}>{f.focus}</span>
                <span className={"tier " + f.tier}>{f.tier}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* provenance */}
      <div style={{ marginTop: 52 }}>
        <SectionHead title="Data provenance" sub="Every data point carries a source tag, so you can weigh it accordingly." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="dd-grid">
          {(Object.keys(D.PROV) as Provenance[]).map((k) => (
            <div key={k} className="card" style={{ padding: "16px 18px", display: "flex", gap: 13, alignItems: "flex-start" }}>
              <ProvTag k={k} />
              <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{D.PROV[k].desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* contribute */}
      <div style={{ marginTop: 52 }}>
        <SectionHead title="How to contribute" sub="The entire dataset is plain files in a public repository. Anyone can propose a change." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="contrib-grid">
          {steps.map(([t, d, path], i) => (
            <div key={t} className="card" style={{ padding: 22 }}>
              <div className="display tnum" style={{ fontSize: 15, color: "var(--ink-4)" }}>0{i + 1}</div>
              <div className="display" style={{ fontSize: 15, marginTop: 10 }}>{t}</div>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: "8px 0 14px" }}>{d}</p>
              <span className="mono" style={{ fontSize: 11.5, color: "var(--accent)", background: "var(--accent-soft)", padding: "3px 8px", borderRadius: 6 }}>{path}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn primary">Open the repository →</a>
        </div>
      </div>
    </div>
  );
}

function OracleGlyph() {
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" fill="none">
      {[20, 30, 42, 54, 64].map((y, i) => (
        <line key={i} x1="20" y1={y} x2="44" y2="42" stroke="var(--accent)" strokeOpacity={0.4 + i * 0.04} strokeWidth="2" strokeLinecap="round" />
      ))}
      <circle cx="44" cy="42" r="3" fill="var(--accent)" />
      <circle cx="58" cy="42" r="9" fill="var(--accent)" />
      <circle cx="58" cy="42" r="9" stroke="var(--panel)" strokeWidth="2" />
    </svg>
  );
}

function GapExample({ p, n, total, label, go }: { p: ProtocolRow; n: number; total: number; label: string; go: (r: string) => void }) {
  return (
    <div onClick={() => go("protocol/" + p.key)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
      <Monogram p={p} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="display" style={{ fontSize: 14 }}>{p.name}</span>
          <span className="mono tnum" style={{ fontSize: 11, color: "var(--ink-3)" }}>{n}/{total}</span>
        </div>
        <div className="meter" style={{ marginTop: 6 }}>
          <i className="c" style={{ width: (p.covered / total * 100) + "%" }} />
          <i className="p" style={{ width: (p.partial / total * 100) + "%" }} />
        </div>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginTop: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      </div>
    </div>
  );
}
