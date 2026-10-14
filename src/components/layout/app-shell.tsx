"use client";

import { HeaderPill } from "@/components/layout/header-pill";
import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-state";
import { cn } from "@/lib/utils";

type Props = { demoMode: boolean; canSignOut: boolean; notice?: React.ReactNode; children: React.ReactNode };

function Frame({ demoMode, canSignOut, notice, children }: Props) {
  const { collapsed, hydrated } = useSidebar();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar demoMode={demoMode} canSignOut={canSignOut} />
      <div
        className={cn(
          "min-h-screen",
          hydrated && "transition-[margin] duration-300 ease-in-out",
          collapsed ? "md:ml-sidebar-collapsed" : "md:ml-sidebar",
        )}
      >
        <MobileNav demoMode={demoMode} canSignOut={canSignOut} />
        <HeaderPill canSignOut={canSignOut} />
        {/* pt-24 on desktop leaves room for the floating header pill. */}
        <main className="min-h-screen bg-canvas p-4 md:p-6 md:pt-24">
          {notice}
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell(props: Props) {
  return (
    <SidebarProvider>
      <Frame {...props} />
    </SidebarProvider>
  );
}
