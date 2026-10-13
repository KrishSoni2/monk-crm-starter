"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ModuleDefinition } from "@/modules/types";

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: IconName; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 items-center gap-3 rounded-button px-3 text-sm transition-colors ${
        active ? "bg-surface-hover font-medium text-text" : "text-muted hover:bg-surface-hover hover:text-text"
      }`}
    >
      <Icon name={icon} className={active ? "text-accent" : undefined} />
      {label}
    </Link>
  );
}

export function Sidebar({
  appName,
  modules,
  demoMode,
  canSignOut,
}: {
  appName: string;
  modules: ModuleDefinition[];
  demoMode: boolean;
  canSignOut: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="fixed inset-y-0 left-0 flex w-sidebar flex-col border-r border-line bg-surface px-3 py-6">
      <div className="px-3">
        <p className="text-base font-medium">{appName}</p>
        {demoMode && (
          <span
            title="No Calendly token set, so you're seeing fictional sample data. See Settings."
            className="mt-2 inline-block rounded-input border border-line px-2 py-0.5 text-xs text-muted"
          >
            Demo data
          </span>
        )}
      </div>

      <nav className="mt-8 flex flex-col gap-1" aria-label="Modules">
        {modules.map((m) => (
          <NavLink key={m.id} href={m.href} label={m.label} icon={m.icon} active={isActive(m.href)} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <NavLink href="/settings" label="Settings" icon="settings" active={isActive("/settings")} />
        <ThemeToggle />
        {canSignOut && (
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="flex h-9 w-full items-center gap-3 rounded-button px-3 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Icon name="logout" />
              Sign out
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
