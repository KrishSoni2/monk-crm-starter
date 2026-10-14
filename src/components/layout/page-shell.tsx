"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The page column: centered, with the standard vertical rhythm. Keyed by route so each
 * page settles in gently on navigation. Only this wrapper animates, never the data.
 */
export function PageShell({ children, maxWidth = "7xl" }: { children: ReactNode; maxWidth?: "6xl" | "7xl" }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={cn("enter-settle mx-auto space-y-6", maxWidth === "7xl" ? "max-w-7xl" : "max-w-6xl")}>
      {children}
    </div>
  );
}

/**
 * The masthead card that opens every page: a small brand-colored eyebrow, a confident
 * title, a plain-English subtitle and an optional action area on the right.
 */
export function PageMasthead({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-eyebrow mb-2 text-primary/80">{eyebrow}</p>
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
          {subtitle && <div className="mt-2 text-sm text-subtle">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** A setup warning shown above the page content (not for errors in normal use). */
export function SetupNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mb-6 max-w-7xl rounded-xl border border-warning-border bg-warning px-4 py-3 text-sm text-warning-foreground">
      {children}
    </div>
  );
}
