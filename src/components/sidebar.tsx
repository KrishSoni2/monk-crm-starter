"use client";

import { LogOut, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME, MODULES } from "@/modules";
import { cn } from "@/lib/utils";

const itemClass =
  "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-[18px] [&_svg]:shrink-0";

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

export function Sidebar({ demoMode, canSignOut }: { demoMode: boolean; canSignOut: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="fixed inset-y-0 left-0 flex w-sidebar flex-col border-r bg-sidebar px-3 py-6">
      <div className="px-3">
        <p className="font-medium">{APP_NAME}</p>
        {demoMode && (
          <span
            title="No Calendly token set, so you're seeing fictional sample data. See Settings."
            className="mt-2 inline-block rounded-sm border px-2 py-0.5 text-xs text-muted-foreground"
          >
            Demo data
          </span>
        )}
      </div>

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
    </aside>
  );
}
