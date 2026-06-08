// protocol detail page
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { dria } from "@/data/dria";
import { Monogram, ProvTag, StatusBadge, SectionHead } from "@/components/primitives";
import { useGo } from "@/lib/nav";
import { REPO_NEW_ISSUE } from "@/config";
import type { FeedType } from "@/lib/schema";

export function ProtocolDetail() {
  const { key } = useParams();
  const go = useGo();
  const D = dria;
  const p = D.protoByKey(key ?? "");
  if (!p)
    return (
      <div className="wrap" style={{ padding: 60 }}>
        Unknown protocol.{" "}
        <a onClick={() => go("")} style={{ cursor: "pointer" }}>
          Back
        </a>
      </div>
    );

  const matrix = D.MATRIX[p.key];
  const gov = D.GOV[p.key] ?? {};
  const audits = D.AUDITS[p.key] ?? [];
  const incidents = D.INCIDENTS[p.key] ?? [];
  const activeTotal = D.FEEDS.filter((f) => f.tier !== "unverified").length;

  const covered = D.FEEDS.filter((f) => {
    const c = matrix[f.key];
    return c && (c.status === "covered" || c.status === "partial");
  });
  const notCovered = D.FEEDS.filter((f) => matrix[f.key] && matrix[f.key].status === "none");
  const flagged = D.FEEDS.filter((f) => matrix[f.key] && matrix[f.key].status === "flagged");
  const gapCount = activeTotal - covered.length;

  const order: FeedType[] = ["Rating", "Dashboard", "Research", "Monitoring", "Analysis", "Verification"];
  const groups = order.map((t) => ({ t, feeds: covered.filter((f) => f.type === t) })).filter((g) => g.feeds.length);

  const idx = D.PROTOCOLS.findIndex((x) => x.key === p.key);
  const prev = D.PROTOCOLS[(idx - 1 + D.PROTOCOLS.length) % D.PROTOCOLS.length];
  const next = D.PROTOCOLS[(idx + 1) % D.PROTOCOLS.length];

  return (
    <div className="wrap-rd fade" style={{ paddingTop: 28, paddingBottom: 80 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button className="nav-link" style={{ paddingLeft: 0 }} onClick={() => go("")}>
          ← All protocols
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="nav-link mono" style={{ fontSize: 12 }} onClick={() => go("protocol/" + prev.key)}>
            ← {prev.name}
          </button>
          <button className="nav-link mono" style={{ fontSize: 12 }} onClick={() => go("protocol/" + next.key)}>
            {next.name} →
          </button>
        </div>
      </div>

      <div className="rd" style={{ marginTop: 4 }}>
        {/* sticky rail: identity, tvl, coverage, gov */}
        <div className="rd-rail">
          <div className="card elev" style={{ padding: 22 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Monogram p={p} size={48} />
              <div style={{ minWidth: 0 }}>
                <h1 className="display" style={{ fontSize: 24, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
                  {p.name}
                </h1>
                <div style={{ marginTop: 5 }}>
                  <span className="pill">{p.cat}</span>
                </div>
              </div>
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 14 }}>
              <a href={"https://" + p.site} target="_blank" rel="noreferrer">
                {p.site}
              </a>{" "}
              · {p.token}
            </div>

            <div style={{ height: 1, background: "var(--line-2)", margin: "16px 0" }} />
            <div className="kicker">{p.metric === "volume" ? "24h Volume" : "Total Value Locked"}</div>
            <div className="display tnum" style={{ fontSize: 30, marginTop: 3, lineHeight: 1 }}>
              {D.fmtUSD(p.tvl)}
            </div>
            <div className="dim mono" style={{ fontSize: 10.5, marginTop: 6 }}>
              <ProvTag k="onchain" />{" "}
              <a href={p.tvlSource} target="_blank" rel="noreferrer">
                DefiLlama
              </a>
            </div>

            <div style={{ height: 1, background: "var(--line-2)", margin: "16px 0" }} />
            <div className="kicker" style={{ marginBottom: 10, whiteSpace: "nowrap" }}>
              Coverage · {covered.length}/{activeTotal} feeds
            </div>
            <div className="bigbar" style={{ marginBottom: 12 }}>
              <i style={{ width: (p.covered / activeTotal) * 100 + "%", background: "var(--covered)" }} />
              <i style={{ width: (p.partial / activeTotal) * 100 + "%", background: "var(--partial)" }} />
            </div>
            <div style={{ display: "flex", gap: "14px 22px", flexWrap: "wrap" }}>
              <Mini n={p.covered} l="covered" c="var(--covered)" />
              <Mini n={p.partial} l="partial" c="var(--partial)" />
              <Mini n={gapCount} l="gaps" c="var(--ink-4)" />
              <Mini n={audits.length} l="audits" c="var(--ink)" />
              <Mini n={incidents.length} l="incidents" c={incidents.length ? "var(--flag)" : "var(--covered)"} />
            </div>

            {p.versions.length > 0 && (
              <>
                <div style={{ height: 1, background: "var(--line-2)", margin: "16px 0" }} />
                <div className="kicker" style={{ marginBottom: 9 }}>
                  Versions · one family
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.versions.map((v) => (
                    <span key={v} className="pill">
                      {v}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <a
            href={REPO_NEW_ISSUE}
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ display: "block", textAlign: "center", marginTop: 12 }}
          >
            Submit a correction ↗
          </a>
        </div>

        {/* main */}
        <div>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "var(--ink)",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              margin: "2px 0 8px",
              maxWidth: 620,
            }}
          >
            {p.desc}
          </p>
          <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 38 }}>
            {p.cat} · Ethereum mainnet
          </div>

          <div style={{ marginBottom: 40 }}>
            <SectionHead
              title="Governance"
              right={
                <a href="https://app.safe.global" target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 11.5 }}>
                  Safe API ↗
                </a>
              }
              sub="Sourced from onchain state and verifiable registries — never solely self-reported."
            />
            <div className="card" style={{ boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              {/* onchain structure */}
              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
                  <span className="kicker">Onchain structure</span>
                  <ProvTag k="onchain" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
                  <GovFact label="Governance type" value={gov.type} />
                  <GovFact label="Admin multisig" value={gov.multisig} href={gov.multisigUrl} addr />
                  <GovFact label="Signer threshold" value={gov.threshold} />
                  <GovFact label="Timelock" value={gov.timelock} />
                </div>
              </div>
              <div style={{ height: 1, background: "var(--line-2)" }} />
              {/* admin powers */}
              <div style={{ padding: "20px 24px", background: "var(--panel-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
                  <span className="kicker">Admin powers</span>
                  <ProvTag k="curated" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <GovPower label="Signers known" value={gov.signersKnown} />
                  <GovPower label="Pause capability" value={gov.pause} />
                  <GovPower label="Upgrade capability" value={gov.upgrade} />
                  <GovPower label="Emergency powers" value={gov.emergency} />
                </div>
              </div>
            </div>
          </div>

          <SectionHead
            title="Second opinions"
            right={
              <span>
                <b style={{ color: "var(--ink)" }}>{covered.length}</b> feeds · {gapCount} gaps
              </span>
            }
            sub="What each provider publishes, in its own format. Verbatim — never normalized or combined into a score."
          />
          {groups.map((g) => (
            <div key={g.t} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 50, background: "oklch(0.6 0.11 " + D.TYPE_HUE[g.t] + ")" }} />
                <span
                  className="mono"
                  style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-2)" }}
                >
                  {g.t}
                </span>
                <span className="dim mono" style={{ fontSize: 11 }}>
                  · {g.feeds.length}
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--line-2)", marginLeft: 4 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(252px, 1fr))", gap: 14 }}>
                {g.feeds.map((f) => {
                  const cell = matrix[f.key];
                  const big = !(cell.kind === "dashboard" || cell.kind === "research" || cell.kind === "monitor");
                  return (
                    <div key={f.key} className="ocard" style={{ ["--h" as string]: f.hue }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <button
                          className="display"
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            color: "var(--ink)",
                            fontSize: 15,
                            textAlign: "left",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                          onClick={() => go("feed/" + f.key)}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: 50, background: "oklch(0.6 0.11 " + f.hue + ")" }} />
                          {f.name}
                        </button>
                        <StatusBadge status={cell.status} />
                      </div>
                      <div style={{ padding: "8px 0 2px" }}>
                        <div className="display tnum" style={{ fontSize: big ? 28 : 17, color: "var(--ink)", lineHeight: 1.05 }}>
                          {cell.rating}
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
                          {cell.note}
                        </div>
                      </div>
                      <div className="muted" style={{ fontSize: 12, lineHeight: 1.45, paddingTop: 12, borderTop: "1px solid var(--line-2)" }}>
                        {f.focus}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <a href={cell.source} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 11 }}>
                          source ↗ <ProvTag k="feed" />
                        </a>
                        <span className="dim mono" style={{ fontSize: 10 }}>
                          {cell.asOf}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {(notCovered.length > 0 || flagged.length > 0) && (
            <div className="card" style={{ padding: "16px 18px", marginBottom: 8, boxShadow: "var(--shadow-sm)" }}>
              {notCovered.length > 0 && (
                <div className="dim mono" style={{ fontSize: 12, lineHeight: 1.6 }}>
                  <span style={{ color: "var(--ink-4)" }}>○</span> Not yet covered: {notCovered.map((f) => f.name).join(", ")}.
                </div>
              )}
              {flagged.length > 0 && (
                <div
                  className="mono"
                  style={{
                    fontSize: 12,
                    marginTop: notCovered.length ? 8 : 0,
                    color: "var(--ink-3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <span className="flagmark" style={{ width: 8, height: 8 }} /> Unverified, not populated:{" "}
                  {flagged.map((f) => f.name).join(", ")}.
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 40 }}>
            <SectionHead
              title="Audit history"
              right={
                <span>
                  <ProvTag k="curated" /> primary sources
                </span>
              }
            />
            <div className="card" style={{ padding: "6px 22px", boxShadow: "var(--shadow-sm)" }}>
              <div className="facts">
                {audits.map((a, i) => (
                  <div className="f" key={i}>
                    <span style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                      <span className="display" style={{ fontSize: 14.5 }}>
                        {a.firm}
                      </span>
                      <span className="dim mono" style={{ fontSize: 11 }}>
                        {a.date}
                      </span>
                    </span>
                    <a href={a.url} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 11.5 }}>
                      report ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 40 }}>
            <SectionHead
              title="Incident history"
              right={
                <span>
                  <ProvTag k="curated" /> De.Fi REKT · Rekt News
                </span>
              }
            />
            {incidents.length === 0 ? (
              <div className="card" style={{ padding: 22, display: "flex", gap: 11, alignItems: "center", boxShadow: "var(--shadow-sm)" }}>
                <span className="stat-c" style={{ fontSize: 17 }}>
                  ●
                </span>
                <span className="muted" style={{ fontSize: 14.5 }}>
                  No major incidents on record.
                </span>
              </div>
            ) : (
              <div className="card" style={{ padding: "24px 26px", boxShadow: "var(--shadow-sm)" }}>
                <div className="tl">
                  {incidents.map((inc, i) => (
                    <div className="tl-item" key={i}>
                      <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                          {inc.date}
                        </span>
                        <span className="display tnum stat-f" style={{ fontSize: 19 }}>
                          {inc.loss}
                        </span>
                        <span className="pill">{inc.recovered}</span>
                      </div>
                      <div style={{ fontSize: 14, marginTop: 5 }}>{inc.type}</div>
                      <div className="dim mono" style={{ fontSize: 10.5, marginTop: 3 }}>
                        source:{" "}
                        {inc.url ? (
                          <a href={inc.url} target="_blank" rel="noreferrer">
                            {inc.source}
                          </a>
                        ) : (
                          inc.source
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ n, l, c }: { n: number; l: string; c: string }) {
  return (
    <div>
      <div className="display tnum" style={{ fontSize: 18, color: c }}>
        {n}
      </div>
      <div className="mono" style={{ fontSize: 9.5, color: "var(--ink-3)", letterSpacing: "0.04em" }}>
        {l}
      </div>
    </div>
  );
}

function GovFact({ label, value, addr, href }: { label: string; value?: string; addr?: boolean; href?: string }) {
  const display: ReactNode =
    value && href ? (
      <a href={href} target="_blank" rel="noreferrer">
        {value}
      </a>
    ) : (
      value || "—"
    );
  return (
    <div>
      <div className="fl" style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ink-3)" }}>
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 14.5,
          color: "var(--ink)",
          marginTop: 5,
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          whiteSpace: "nowrap",
        }}
      >
        {display}
        {addr && value && value !== "—" && <span style={{ color: "var(--accent)", fontSize: 11 }}>↗</span>}
      </div>
    </div>
  );
}

function GovPower({ label, value }: { label: string; value?: string }) {
  const v = (value || "—").trim();
  const head = v.split(" ")[0].toLowerCase();
  const state = head === "yes" ? "yes" : head === "no" ? "no" : head === "partial" ? "partial" : "na";
  const glyph = { yes: "●", no: "○", partial: "◐", na: "–" }[state];
  const gc = { yes: "var(--ink)", no: "var(--ink-4)", partial: "var(--partial)", na: "var(--ink-4)" }[state];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        padding: "11px 14px",
        borderRadius: 10,
        background: "var(--panel)",
        border: "1px solid var(--line)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{label}</span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontSize: 12.5,
          color: "var(--ink)",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: gc, fontSize: 9 }}>{glyph}</span>
        {v}
      </span>
    </div>
  );
}
