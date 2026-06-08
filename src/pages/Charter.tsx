// charter & stewardship page
import { useGo } from "@/lib/nav";
import { SectionHead } from "@/components/primitives";
import { STEWARD, REPO_URL } from "@/config";

export function Charter() {
  const go = useGo();
  void go;

  const articles: [string, string, string][] = [
    ["I", "No composite scoring", "DRIA produces no risk score, rank, weighting, or composite assessment of its own. Each feed's rating is stored as an opaque payload and presented verbatim. A field-name denylist — score, composite, aggregate, overall, normalized, rank — is enforced in continuous integration on every pull request, by machine, not reviewer attention alone."],
    ["II", "Verbatim & provenance", "Every rating is shown exactly as its provider issued it, and always appears with that feed's name, a live source link, a provenance tag, and a capture timestamp. A rating never appears beside a number DRIA could be seen to have produced."],
    ["III", "Neutrality & conflict disclosure", "DRIA picks no winner among feeds. Each feed's funding model and any ties to the protocols or issuers it rates are disclosed directly in the product. The project declares its own conflicts and carries none of its own, as it issues no rating."],
    ["IV", "Coverage gaps as data", "A missing rating is shown as information, never concealed. Every protocol-by-feed cell is explicitly labelled covered, partial, or not yet covered. Unverifiable providers are flagged, never populated with invented data."],
    ["V", "Open data & correction", "The entire dataset is plain files in a public AGPL-3.0 repository, correctable by pull request. A CODEOWNERS file routes every proposed change to the maintainers and the steward."],
  ];
  const statusDefs: [string, string, string][] = [
    ["covered", "covered", "The feed publishes an assessment for this protocol, captured verbatim with a source link."],
    ["partial", "partial", "The feed covers part of the protocol — a single version, market, or asset — or its terms permit only a coverage link, not the rating text."],
    ["not yet covered", "none", "No assessment from this feed exists for this protocol. Shown as data, not hidden."],
    ["flagged", "flagged", "The provider could not be verified as a live product. Listed for transparency; integrated only once it publishes a public dataset."],
  ];
  const amendment = [
    "Written agreement from the Ethereum Foundation",
    "Supermajority of the project's maintainers",
    "The named steward's sign-off",
    "A publicly recorded rationale, committed to the repo",
  ];

  return (
    <div className="wrap-rd fade" style={{ paddingTop: 44, paddingBottom: 96, maxWidth: 960 }}>
      {/* hero */}
      <div style={{ maxWidth: 640 }}>
        <div className="eyebrow"><span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--accent)" }} />Project charter · committed to the repository</div>
        <h1 className="display" style={{ fontSize: 44, margin: "16px 0 0", letterSpacing: "-0.03em", lineHeight: 1.04 }}>The rules that<br />keep DRIA neutral.</h1>
        <p style={{ fontSize: 17.5, lineHeight: 1.55, color: "var(--ink-2)", marginTop: 18 }}>
          Neutrality is not left to policy. It is written into the charter and enforced in the data structure —
          and can only be changed at a deliberately high bar.
        </p>
      </div>

      {/* articles */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
        {articles.map(([n, title, body]) => (
          <div key={n} className="card" style={{ padding: 26, display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ flex: "none", width: 48, height: 48, borderRadius: 12, background: "var(--accent-soft)", display: "grid", placeItems: "center" }}>
              <span className="display" style={{ fontSize: 18, color: "var(--accent)" }}>{n}</span>
            </div>
            <div>
              <div className="display" style={{ fontSize: 17 }}>{title}</div>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.62, margin: "9px 0 0" }}>{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* amendment bar */}
      <div style={{ marginTop: 52 }}>
        <SectionHead title="The amendment bar" sub="Changing the no-composite rule (Article I) requires all four — together." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }} className="amend-grid">
          {amendment.map((t, i) => (
            <div key={i} className="card" style={{ padding: 20, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span className="icbadge acc" style={{ width: 24, height: 24, borderRadius: 7, fontSize: 11 }}>{i + 1}</span>
                {i < amendment.length - 1 && <span className="dim" style={{ marginLeft: "auto", fontSize: 14 }}>+</span>}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.5, margin: "12px 0 0", color: "var(--ink-2)" }}>{t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* coverage status defs */}
      <div style={{ marginTop: 52 }}>
        <SectionHead title="Coverage status definitions" sub="The four states every cell in the matrix can hold." />
        <div className="card" style={{ overflow: "hidden" }}>
          {statusDefs.map(([label, st, desc], i) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 18, padding: "18px 22px", borderTop: i ? "1px solid var(--line-2)" : "none", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                {st === "flagged" ? <span className="flagmark" /> : st === "none" ? <span style={{ width: 8, height: 8, borderRadius: 50, background: "var(--ink-4)" }} /> : <span className={"dotc " + st} />}
                <span style={{ fontSize: 13.5, fontWeight: 600, color: st === "covered" ? "var(--covered)" : st === "partial" ? "var(--partial)" : st === "flagged" ? "var(--flag)" : "var(--ink-3)" }}>{label}</span>
              </span>
              <span style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* stewardship */}
      <div style={{ marginTop: 52 }}>
        <SectionHead title="Stewardship" sub="Who keeps it alive once the initial work is done." />
        <div className="card elev" style={{ padding: 0, display: "grid", gridTemplateColumns: "1fr 300px" }} >
          <div style={{ padding: 28, borderRight: "1px solid var(--line)" }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.62, margin: 0, color: "var(--ink-2)" }}>
              Long-term ownership rests with a named steward — a publicly identifiable person or organization
              committed to maintaining DRIA over the long term. The steward is lead reviewer for the charter, data,
              and schema files, holds the top entry in CODEOWNERS and merge authority, and is recorded in
              {" "}<span className="mono" style={{ color: "var(--accent)" }}>GOVERNANCE.md</span>. Handoff is concrete:
              transfer of the repository, a CODEOWNERS update, and a signed commit accepting the role.
            </p>
          </div>
          <div style={{ padding: 28, background: "var(--panel-2)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
            <div>
              <div className="kicker">Named steward</div>
              <div className="display" style={{ fontSize: 22, marginTop: 6 }}>{STEWARD}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="pill">GOVERNANCE.md</span>
              <span className="pill">CODEOWNERS</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="hr" style={{ margin: "48px 0 18px" }} />
      <div className="muted" style={{ fontSize: 13.5 }}>Full charter and governance docs live in the repository. <a href={`${REPO_URL}/blob/main/CHARTER.md`} target="_blank" rel="noreferrer">View CHARTER.md →</a></div>
    </div>
  );
}
