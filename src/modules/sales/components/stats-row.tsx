"use client";

import { CalendarCheck, TrendingUp, Trophy, UserX, XCircle, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STAT_CARDS, type SalesStats } from "@/modules/sales/stats";

// Numbers count to their new value when a filter changes, instead of jumping.
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    const from = previous.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min((now - start) / 400, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
      else previous.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}</>;
}

const ICONS: Record<keyof SalesStats, { icon: LucideIcon; className?: string }> = {
  total: { icon: CalendarCheck },
  noShows: { icon: UserX },
  closed: { icon: Trophy, className: "text-positive" },
  lost: { icon: XCircle, className: "text-negative" },
  closeRate: { icon: TrendingUp },
  showed: { icon: CalendarCheck },
};

// Each card shows its number and, underneath, exactly how it's counted.
export function StatsRow({ stats }: { stats: SalesStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {STAT_CARDS.map((card) => {
        const value = stats[card.key];
        const { icon: Icon, className } = ICONS[card.key];
        return (
          <Card key={card.key} className="gap-0 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {value === null ? "—" : card.format === "percent" ? `${Math.round(value * 100)}%` : <AnimatedNumber value={value} />}
                </p>
                <p className="text-xs text-muted-foreground">{card.how}</p>
              </div>
              <div className="shrink-0 rounded-lg bg-muted p-2">
                <Icon className={cn("size-5 text-muted-foreground", className)} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
