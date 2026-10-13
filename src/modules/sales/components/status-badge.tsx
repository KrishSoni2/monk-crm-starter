import type { BookingStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/modules/sales/types";

// Statuses are quiet by design: text and a soft outline, never the brand color.
// Only "Closed" gets a touch of green so wins are easy to spot.
export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm border px-2 text-xs whitespace-nowrap text-muted-foreground",
        status === "CLOSED" && "border-positive/40 text-positive",
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function CanceledTag() {
  return (
    <span className="inline-flex h-5 items-center rounded-sm bg-secondary px-1.5 text-xs text-muted-foreground">
      Canceled
    </span>
  );
}
