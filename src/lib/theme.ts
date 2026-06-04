import { useEffect, useState } from "react";

export type ThemeMode = "daylight" | "nocturne";
export interface Tweaks {
  theme: ThemeMode;
  accent: "cobalt" | "teal" | "violet";
  density: "comfortable" | "compact";
}

const DEFAULTS: Tweaks = { theme: "daylight", accent: "cobalt", density: "comfortable" };
const KEY = "dria.tweaks";

export function useTweaks(): [Tweaks, (k: keyof Tweaks, v: string) => void] {
  const [t, setT] = useState<Tweaks>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const merged = { ...DEFAULTS, ...JSON.parse(raw) } as Tweaks;
        // fix up old/removed accents (e.g. the old "rose")
        if (!["cobalt", "teal", "violet"].includes(merged.accent)) merged.accent = DEFAULTS.accent;
        return merged;
      }
    } catch {
      /* ignore */
    }
    return DEFAULTS;
  });

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-accent", t.accent);
    r.setAttribute("data-density", t.density);
    try {
      localStorage.setItem(KEY, JSON.stringify(t));
    } catch {
      /* ignore */
    }
  }, [t]);

  const set = (k: keyof Tweaks, v: string) => setT((p) => ({ ...p, [k]: v }) as Tweaks);
  return [t, set];
}
