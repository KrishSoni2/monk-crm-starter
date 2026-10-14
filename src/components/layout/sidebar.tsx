"use client";

import { LogOut, Menu, PanelLeft, PanelLeftClose, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppMark } from "@/components/layout/app-mark";
import { useSidebar } from "@/components/layout/sidebar-state";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MODULES } from "@/modules";

type ShellProps = { demoMode: boolean; canSignOut: boolean };

const rowClass =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-[padding] duration-300";
const idleClass = "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

function Label({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  return (
    <span className={cn("min-w-0 truncate transition-opacity duration-300", collapsed ? "opacity-0" : "opacity-100")}>
      {children}
    </span>
  );
}

// Collapsed, every row shows its name in a tooltip instead.
function WithTooltip({ collapsed, label, children }: { collapsed: boolean; label: string; children: React.ReactElement }) {
  if (!collapsed) return children;
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function NavItem({ href, label, icon: Icon, collapsed }: { href: string; label: string; icon: LucideIcon; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <WithTooltip collapsed={collapsed} label={label}>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(rowClass, active ? "bg-sidebar-accent text-sidebar-accent-foreground" : idleClass)}
      >
        <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
        <Label collapsed={collapsed}>{label}</Label>
      </Link>
    </WithTooltip>
  );
}

function DemoChip({ collapsed }: { collapsed: boolean }) {
  const title = "No Calendly token set, so you're seeing fictional sample data. See Settings.";
  return (
    <div className="px-4 pt-3" title={title}>
      {collapsed ? (
        <span className="mx-auto block size-2 rounded-full bg-primary/70" aria-label="Demo data" />
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary/70" />
          Demo data
        </span>
      )}
    </div>
  );
}

// The sidebar's contents, used by the fixed desktop sidebar and the mobile drawer.
function SidebarBody({ demoMode, canSignOut, collapsed, onToggle }: ShellProps & { collapsed: boolean; onToggle?: () => void }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link href={MODULES[0]?.href ?? "/"} aria-label="Home">
          <AppMark showName={!collapsed} />
        </Link>
      </div>
      <Separator />
      {demoMode && <DemoChip collapsed={collapsed} />}

      {/* Built from the modules config in src/modules/index.ts */}
      <nav className="flex-1 space-y-1 px-2 pt-3 pb-4" aria-label="Modules">
        {MODULES.map((m) => (
          <NavItem key={m.id} href={m.href} label={m.label} icon={m.icon} collapsed={collapsed} />
        ))}
      </nav>

      <div className="mt-auto border-t px-2 py-4">
        {onToggle && (
          <>
            <WithTooltip collapsed={collapsed} label="Expand sidebar">
              <button type="button" onClick={onToggle} className={cn(rowClass, idleClass)}>
                {collapsed ? <PanelLeft className="size-4 shrink-0" /> : <PanelLeftClose className="size-4 shrink-0" />}
                <Label collapsed={collapsed}>Collapse</Label>
              </button>
            </WithTooltip>
            <Separator className="my-2" />
          </>
        )}
        <NavItem href="/settings" label="Settings" icon={Settings} collapsed={collapsed} />
        {canSignOut && (
          <form action="/api/auth/logout" method="post" className="mt-2">
            <WithTooltip collapsed={collapsed} label="Sign out">
              <button type="submit" className={cn(rowClass, idleClass)}>
                <LogOut className="size-4 shrink-0" />
                <Label collapsed={collapsed}>Sign out</Label>
              </button>
            </WithTooltip>
          </form>
        )}
      </div>
    </>
  );
}

export function Sidebar(props: ShellProps) {
  const { collapsed, hydrated, toggle } = useSidebar();
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 hidden flex-col overflow-hidden border-r bg-sidebar md:flex",
        hydrated && "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar",
      )}
    >
      <SidebarBody {...props} collapsed={collapsed} onToggle={toggle} />
    </aside>
  );
}

// Small screens: a slim top bar with a menu button that opens the sidebar as a drawer.
export function MobileNav(props: ShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
      <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
        <Menu />
      </Button>
      <AppMark />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-sidebar gap-0 bg-sidebar p-0 sm:max-w-[240px]">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarBody {...props} collapsed={false} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
