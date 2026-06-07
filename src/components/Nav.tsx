// top nav, desktop links plus cmd+k and theme toggle, mobile burger sheet
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Mark } from "@/components/primitives";
import { useGo } from "@/lib/nav";
import { REPO_URL } from "@/config";
import type { ThemeMode } from "@/lib/theme";

const links: [string, string][] = [
  ["", "Protocols"],
  ["methodology", "Methodology"],
  ["charter", "Charter"],
];

export function Nav({
  onCmd,
  theme,
  onToggleTheme,
}: {
  onCmd: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const go = useGo();
  const { pathname } = useLocation();
  const top = pathname.replace(/^\/+/, "").split("/")[0];
  const [sheet, setSheet] = useState(false);
  const goClose = (k: string) => {
    setSheet(false);
    go(k);
  };

  return (
    <nav className="nav">
      <div className="brand" onClick={() => go("")}>
        <Mark />
        <span className="brand-name">
          DRIA<span className="sub">by YK Labs</span>
        </span>
      </div>
      <div className="nav-links">
        <button className="cmdk" onClick={onCmd} aria-label="Search">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flex: "none" }}>
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="nav-cmd-label">Search protocols, feeds…</span>
          </span>
          <kbd>⌘K</kbd>
        </button>
        <div className="nav-desktop-links">
          {links.map(([k, label]) => (
            <button key={k} className={"nav-link" + (top === k ? " active" : "")} onClick={() => go(k)}>
              {label}
            </button>
          ))}
          <a className="nav-link" href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </div>
        <button
          className="nav-link"
          onClick={onToggleTheme}
          title={theme === "daylight" ? "Switch to dark" : "Switch to light"}
          aria-label="Toggle theme"
          style={{ fontSize: 15, lineHeight: 1 }}
        >
          {theme === "daylight" ? "◐" : "◑"}
        </button>
        <button className="nav-burger" onClick={() => setSheet((s) => !s)} aria-label="Menu" aria-expanded={sheet}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            {sheet ? (
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <>
                <path d="M2.5 5h13M2.5 9h13M2.5 13h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div className={"nav-sheet" + (sheet ? " open" : "")}>
        {links.map(([k, label]) => (
          <button key={k} className={"nav-link" + (top === k ? " active" : "")} onClick={() => goClose(k)}>
            {label}
          </button>
        ))}
        <a className="nav-link" href={REPO_URL} target="_blank" rel="noreferrer" onClick={() => setSheet(false)}>
          GitHub ↗
        </a>
      </div>
    </nav>
  );
}
