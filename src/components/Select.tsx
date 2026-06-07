// themed dropdown to replace native select so the menu follows the theme
import { useEffect, useId, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  // optional colored dot
  dot?: string;
}

export function Select({
  value,
  onChange,
  options,
  ariaLabel,
  menuAlign = "left",
  minWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  menuAlign?: "left" | "right";
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const openMenu = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openMenu();
      else setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) openMenu();
      else choose(options[active].value);
    }
  };

  return (
    <div className="dd-wrap" ref={wrapRef} style={{ minWidth }}>
      <button
        type="button"
        className={"dd-btn" + (open ? " open" : "")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKey}
      >
        <span className="dd-val" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {current?.dot && <span className="dd-dot" style={{ background: current.dot }} />}
          {current?.label}
        </span>
        <svg className="dd-chevron" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={"dd-menu" + (menuAlign === "right" ? " right" : "")} role="listbox" id={id} aria-label={ariaLabel}>
          {options.map((o, i) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={"dd-opt" + (o.value === value ? " sel" : "")}
              style={i === active && o.value !== value ? { background: "var(--hover)", color: "var(--ink)" } : undefined}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
            >
              {o.dot && <span className="dd-dot" style={{ background: o.dot }} />}
              <span>{o.label}</span>
              <svg className="dd-check" viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden>
                <path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
