"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Runs before the page paints (see src/app/layout.tsx) so there's no light flash in
// dark mode. A saved choice wins; otherwise we follow the system setting.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage can be blocked (private windows). The toggle still works for this visit.
    }
    setDark(next);
  };
  return { dark, toggle };
}

// Sun in light mode, moon in dark mode, with a small rotate between them.
export function ThemeToggleButton() {
  const { toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="relative size-9" aria-label="Toggle theme">
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
