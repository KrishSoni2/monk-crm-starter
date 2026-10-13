"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

// Runs before the page paints (see src/app/layout.tsx) so there's no light flash in
// dark mode. A saved choice wins; otherwise we follow the system setting.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

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

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-full items-center gap-3 rounded-button px-3 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-text"
    >
      <Icon name={dark ? "sun" : "moon"} />
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
