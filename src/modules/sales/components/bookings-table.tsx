"use client";

import { CalendarX2 } from "lucide-react";
import { cityName, formatDateTime, formatTime } from "@/lib/format";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { cn } from "@/lib/utils";
import { RepLabel } from "@/modules/sales/components/rep-label";
import { CanceledTag, StatusBadge } from "@/modules/sales/components/status-badge";
import type { BookingRow, RepRow } from "@/modules/sales/types";

// Rows are 48px tall and the first column stays put while the table scrolls sideways,
// so nothing gets squeezed on smaller screens.
const headClass = "h-10 px-4 text-left text-xs font-medium whitespace-nowrap text-muted-foreground";
const cellClass = "h-row px-4 whitespace-nowrap";

export function BookingsTable({
  bookings,
  repsById,
  selectedId,
  onSelect,
}: {
  bookings: BookingRow[];
  repsById: Map<string, RepRow>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const myZone = useViewerTimeZone();

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-card border px-card py-16 text-center">
        <CalendarX2 className="size-6 text-subtle" strokeWidth={1.5} />
        <p className="mt-4 font-medium">No bookings yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          New Calendly bookings show up here after the next sync.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border">
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead className="bg-surface">
          <tr className="border-b">
            <th className={cn(headClass, "sticky left-0 z-10 border-r bg-surface")}>Invitee</th>
            <th className={headClass}>Meeting (your time)</th>
            <th className={headClass}>Event type</th>
            <th className={headClass}>Rep</th>
            <th className={headClass}>Status</th>
            <th className={headClass}>Qualified</th>
            <th className={headClass}>Calls</th>
            <th className={headClass}>Their time</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const selected = b.id === selectedId;
            const answered = b.callAttempts.filter((c) => c.answered).length;
            return (
              <tr
                key={b.id}
                onClick={() => onSelect(b.id)}
                className={cn(
                  "group cursor-pointer border-b last:border-b-0 transition-colors hover:bg-accent/60",
                  selected && "bg-accent/60",
                  b.canceledAt && "text-muted-foreground",
                )}
              >
                <td
                  className={cn(
                    cellClass,
                    "sticky left-0 z-10 border-r bg-background transition-colors group-hover:bg-accent",
                    selected && "bg-accent",
                  )}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(b.id);
                    }}
                    className="flex max-w-56 items-center gap-2 text-left font-medium text-foreground outline-none focus-visible:underline"
                  >
                    <span className="truncate">{b.inviteeName}</span>
                    {b.canceledAt && <CanceledTag />}
                  </button>
                </td>
                <td className={cn(cellClass, "tabular-nums")}>{myZone ? formatDateTime(b.startTime, myZone) : ""}</td>
                <td className={cellClass}>{b.eventTypeName ?? "—"}</td>
                <td className={cellClass}>
                  <RepLabel rep={b.repId ? repsById.get(b.repId) : undefined} />
                </td>
                <td className={cellClass}>
                  <StatusBadge status={b.status} />
                </td>
                <td className={cellClass}>
                  {b.qualified === null ? (
                    <span className="text-subtle">Not yet</span>
                  ) : b.qualified ? (
                    "Yes"
                  ) : (
                    "No"
                  )}
                </td>
                <td className={cn(cellClass, "tabular-nums")}>
                  {b.callAttempts.length === 0 ? (
                    <span className="text-subtle">None</span>
                  ) : (
                    <>
                      {b.callAttempts.length}
                      <span className="text-muted-foreground"> · {answered} answered</span>
                    </>
                  )}
                </td>
                <td className={cn(cellClass, "tabular-nums")}>
                  {b.inviteeTimeZone ? (
                    <>
                      {formatTime(b.startTime, b.inviteeTimeZone)}
                      <span className="text-muted-foreground"> · {cityName(b.inviteeTimeZone)}</span>
                    </>
                  ) : (
                    <span className="text-subtle">Unknown</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
