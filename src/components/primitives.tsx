// shared ui bits
import { useState } from "react";
import type { ReactNode } from "react";
import { dria } from "@/data/dria";
import type { CoverageStatus, Provenance } from "@/lib/schema";
import type { FeedRow, ProtocolRow } from "@/data/dria";

// logo mark
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 26 26" fill="none">
      <rect x="0.6" y="0.6" width="24.8" height="24.8" rx="7" stroke="var(--line-strong)" strokeWidth="1.2" />
      <line x1="6" y1="7" x2="15" y2="13" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="13" x2="15" y2="13" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="19" x2="15" y2="13" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="18.5" cy="13" r="3.1" fill="var(--accent)" />
    </svg>
  );
}

export function Monogram({ p, size = 38 }: { p: ProtocolRow; size?: number }) {
  const [errored, setErrored] = useState(false);
  const radius = Math.round(size * 0.28);

  if (!errored) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: radius,
          background: "var(--panel)",
          boxShadow: "inset 0 0 0 1px var(--line)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={`/logos/${p.key}.png`}
          alt={`${p.name} logo`}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setErrored(true)}
          style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: radius }}
        />
      </span>
    );
  }

  return (
    <span className="mono-tile" style={{ ["--h" as string]: p.hue, width: size, height: size, fontSize: size * 0.36 }}>
      {p.mono}
    </span>
  );
}

const PROV_COLORS: Record<string, string> = {
  onchain: "var(--covered)",
  feed: "var(--accent)",
  curated: "var(--partial)",
  "self-reported": "var(--flag)",
};

export function ProvTag({ k }: { k: Provenance }) {
  const p = dria.PROV[k] ?? dria.PROV.curated;
  return (
    <span className="tag" title={p.desc}>
      <i style={{ background: PROV_COLORS[k] ?? "var(--ink-3)" }} />
      {p.label}
    </span>
  );
}

export function CoverageMeter({
  covered,
  partial,
  total,
  width = 100,
}: {
  covered: number;
  partial: number;
  total: number;
  width?: number;
}) {
  const c = (covered / total) * 100;
  const pa = (partial / total) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div className="meter" style={{ width }}>
        <i className="c" style={{ width: c + "%" }} />
        <i className="p" style={{ width: pa + "%" }} />
      </div>
      <span className="mono tnum" style={{ fontSize: 11.5, color: "var(--ink-2)" }}>
        {covered + partial}
        <span style={{ color: "var(--ink-4)" }}>/{total}</span>
      </span>
    </div>
  );
}

export function StatusDot({ status }: { status: CoverageStatus }) {
  if (status === "covered") return <span className="dotc covered" />;
  if (status === "partial") return <span className="dotc partial" />;
  if (status === "flagged") return <span className="flagmark" />;
  return <span style={{ width: 8, height: 8, borderRadius: 50, background: "var(--ink-4)", display: "inline-block" }} />;
}

// status badge
export function StatusBadge({ status }: { status: CoverageStatus }) {
  const map: Record<CoverageStatus, [string, ReactNode, string]> = {
    covered: ["c", <span className="dotc covered" style={{ width: 6, height: 6 }} />, "covered"],
    partial: ["p", <span className="dotc partial" style={{ width: 6, height: 6 }} />, "partial"],
    flagged: ["f", <span className="flagmark" style={{ width: 7, height: 7 }} />, "flagged"],
    none: ["n", <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--ink-4)", display: "inline-block" }} />, "not covered"],
  };
  const [cls, dot, label] = map[status] ?? map.none;
  return (
    <span className={"cbadge " + cls}>
      {dot}
      {label}
    </span>
  );
}

export function SectionHead({
  title,
  right,
  sub,
  id,
}: {
  title: ReactNode;
  right?: ReactNode;
  sub?: ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, gap: 16, flexWrap: "wrap" }}
    >
      <div>
        <h2 className="display" style={{ fontSize: 21, margin: 0 }}>
          {title}
        </h2>
        {sub && (
          <div className="muted" style={{ fontSize: 13.5, marginTop: 5, maxWidth: 620 }}>
            {sub}
          </div>
        )}
      </div>
      {right && (
        <div className="mono" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
          {right}
        </div>
      )}
    </div>
  );
}

export function TypeLegend() {
  const types = (Object.keys(dria.TYPE_HUE) as (keyof typeof dria.TYPE_HUE)[]).filter((t) =>
    dria.FEEDS.some((f) => f.type === t)
  );
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
      <span className="kicker">Methodology</span>
      {types.map((t) => (
        <span key={t} style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: 50, background: "oklch(0.6 0.11 " + dria.TYPE_HUE[t] + ")" }} />
          <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-2)" }}>
            {t}
          </span>
        </span>
      ))}
    </div>
  );
}

export type { FeedRow, ProtocolRow };
