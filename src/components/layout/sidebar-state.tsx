"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Remembers whether the sidebar is collapsed (per browser). Storage can be unavailable
// (private windows), so every access is wrapped and the app works without it.
const KEY = "sidebar:collapsed";

type SidebarState = { collapsed: boolean; hydrated: boolean; toggle: () => void };
const SidebarContext = createContext<SidebarState>({ collapsed: false, hydrated: false, toggle: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === "1");
    } catch {}
    setHydrated(true);
  }, []);

  const toggle = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(KEY, value ? "0" : "1");
      } catch {}
      return !value;
    });

  return <SidebarContext.Provider value={{ collapsed, hydrated, toggle }}>{children}</SidebarContext.Provider>;
}

export const useSidebar = () => useContext(SidebarContext);
