// command palette (cmd+k)
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { dria } from "@/data/dria";
import { Monogram } from "@/components/primitives";
import { useGo } from "@/lib/nav";

interface Item {
  type: "Page" | "Protocol" | "Feed";
  label: string;
  sub?: string;
  k: string;
  p?: (typeof dria.PROTOCOLS)[number];
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const go = useGo();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = [
      { type: "Page", label: "Protocols — coverage", k: "" },
      { type: "Page", label: "Methodology", k: "methodology" },
      { type: "Page", label: "Charter & stewardship", k: "charter" },
    ];
    const protos: Item[] = dria.PROTOCOLS.map((p) => ({ type: "Protocol", label: p.name, sub: p.cat, k: "protocol/" + p.key, p }));
    const feeds: Item[] = dria.FEEDS.map((f) => ({ type: "Feed", label: f.name, sub: f.type, k: "feed/" + f.key }));
    const all = [...pages, ...protos, ...feeds];
    if (!q) return all;
    const s = q.toLowerCase();
    return all.filter((i) => i.label.toLowerCase().includes(s) || (i.sub || "").toLowerCase().includes(s));
  }, [q]);

  // remounted on open so state is fresh, just focus the input
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, []);

  if (!open) return null;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      const it = items[sel];
      if (it) {
        go(it.k);
        onClose();
      }
    }
  };

  let lastType: string | null = null;
  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-box" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Jump to a protocol, feed, or page…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={onKey}
        />
        <div className="cmd-list">
          {items.length === 0 && (
            <div className="dim mono" style={{ padding: 16, fontSize: 13 }}>
              No matches.
            </div>
          )}
          {items.map((it, i) => {
            const head = it.type !== lastType ? <div className="cmd-grp">{it.type}</div> : null;
            lastType = it.type;
            return (
              <Fragment key={it.k + i}>
                {head}
                <div
                  className={"cmd-row" + (i === sel ? " sel" : "")}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    go(it.k);
                    onClose();
                  }}
                >
                  {it.p ? (
                    <Monogram p={it.p} size={26} />
                  ) : (
                    <span style={{ width: 26, textAlign: "center", color: "var(--ink-3)" }} className="mono">
                      {it.type === "Feed" ? "◉" : "▸"}
                    </span>
                  )}
                  <span style={{ flex: 1 }}>
                    <span style={{ fontWeight: 500 }}>{it.label}</span>
                    {it.sub && (
                      <span className="dim mono" style={{ fontSize: 11, marginLeft: 8 }}>
                        {it.sub}
                      </span>
                    )}
                  </span>
                  <span className="dim mono" style={{ fontSize: 11 }}>
                    ↵
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
