import { STAT_CARDS, type SalesStats } from "@/modules/sales/stats";

function formatValue(value: number | null, format?: "percent") {
  if (value === null) return "—";
  return format === "percent" ? `${Math.round(value * 100)}%` : value.toLocaleString();
}

// Each card shows its number and, underneath, exactly how it's counted.
export function StatsRow({ stats }: { stats: SalesStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {STAT_CARDS.map((card) => (
        <div key={card.key} className="rounded-card border p-card">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-3xl font-medium tracking-tight tabular-nums">
            {formatValue(stats[card.key], card.format)}
          </p>
          <p className="mt-2 text-xs text-subtle">{card.how}</p>
        </div>
      ))}
    </div>
  );
}
