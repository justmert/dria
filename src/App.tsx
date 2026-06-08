// app shell: router, cmd+k palette, theme, footer
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { CommandPalette } from "@/components/CommandPalette";
import { Mark } from "@/components/primitives";
import { Home } from "@/pages/Home";
import { ProtocolDetail } from "@/pages/Protocol";
import { FeedDetail } from "@/pages/Feed";
import { Methodology } from "@/pages/Methodology";
import { Charter } from "@/pages/Charter";
import { useTweaks } from "@/lib/theme";
import { dria } from "@/data/dria";
import { STEWARD, LICENSE } from "@/config";

export default function App() {
  const [t, setTweak] = useTweaks();
  const [cmd, setCmd] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((c) => !c);
      } else if (e.key === "/" && !/input|textarea|select/i.test((document.activeElement as HTMLElement)?.tagName)) {
        e.preventDefault();
        setCmd(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Nav onCmd={() => setCmd(true)} theme={t.theme} onToggleTheme={() => setTweak("theme", t.theme === "daylight" ? "nocturne" : "daylight")} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/protocol/:key" element={<ProtocolDetail />} />
        <Route path="/feed/:key" element={<FeedDetail />} />
        <Route path="/methodology" element={<Methodology />} />
        <Route path="/charter" element={<Charter />} />
        <Route path="*" element={<Home />} />
      </Routes>

      <footer style={{ borderTop: "1px solid var(--line)", marginTop: 40 }}>
        <div className="wrap" style={{ padding: "26px 40px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
            <Mark size={22} />
            <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
              DRIA · a public good by {STEWARD} · {LICENSE}
            </span>
          </div>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            No scores. No synthesis. · Data as of {dria.asOf}
          </span>
        </div>
      </footer>

      <CommandPalette key={cmd ? "open" : "closed"} open={cmd} onClose={() => setCmd(false)} />
    </>
  );
}
