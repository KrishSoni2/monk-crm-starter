"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

// Runs before the page paints (see src/app/layout.tsx) so there's no light flash in
// dark mode. A saved choice wins; otherwise we follow the system setting.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage can be blocked (private windows). The toggle still works for this visit.
    }
    setDark(next);
  }

  const Icon = dark ? Sun : Moon;
  return (
    <button type="button" onClick={toggle} className={className}>
      <Icon strokeWidth={1.75} />
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
