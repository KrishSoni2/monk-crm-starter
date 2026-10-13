"use client";

import { LogOut, Menu, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { APP_NAME, MODULES } from "@/modules";
import { cn } from "@/lib/utils";

const itemClass =
  "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-[18px] [&_svg]:shrink-0";

type SidebarProps = { demoMode: boolean; canSignOut: boolean };

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(itemClass, active && "bg-accent font-medium text-foreground")}
    >
      <Icon className={active ? "text-primary" : undefined} strokeWidth={1.75} />
      {label}
    </Link>
  );
}

function DemoBadge() {
  return (
    <span
      title="No Calendly token set, so you're seeing fictional sample data. See Settings."
      className="inline-block rounded-sm border px-2 py-0.5 text-xs text-muted-foreground"
    >
      Demo data
    </span>
  );
}

// The sidebar's contents, used by the fixed desktop sidebar and the mobile drawer.
function SidebarContent({ demoMode, canSignOut }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <>
      <div className="px-3">
        <p className="font-medium">{APP_NAME}</p>
        {demoMode && (
          <div className="mt-2">
            <DemoBadge />
          </div>
        )}
      </div>

      {/* Built from the modules config in src/modules/index.ts */}
      <nav className="mt-8 flex flex-col gap-1" aria-label="Modules">
        {MODULES.map((m) => (
          <NavLink key={m.id} href={m.href} label={m.label} icon={m.icon} active={isActive(m.href)} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <NavLink href="/settings" label="Settings" icon={Settings} active={isActive("/settings")} />
        <ThemeToggle className={itemClass} />
        {canSignOut && (
          <form action="/api/auth/logout" method="post">
            <button type="submit" className={itemClass}>
              <LogOut strokeWidth={1.75} />
              Sign out
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-sidebar flex-col border-r bg-sidebar px-3 py-6 md:flex">
      <SidebarContent {...props} />
    </aside>
  );
}

// Small screens: a slim top bar with a menu button that opens the sidebar as a drawer.
export function MobileNav(props: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
      <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
        <Menu />
      </Button>
      <p className="font-medium">{APP_NAME}</p>
      {props.demoMode && <DemoBadge />}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-sidebar gap-0 bg-sidebar px-3 py-6 sm:max-w-[240px]">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContent {...props} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
