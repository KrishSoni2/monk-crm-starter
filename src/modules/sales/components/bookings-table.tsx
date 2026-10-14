"use client";

import { Calendar, CalendarX2, Clock, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cityName, formatDate, formatTime } from "@/lib/format";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { cn } from "@/lib/utils";
import { InitialsAvatar } from "@/modules/sales/components/rep-label";
import { CanceledTag, STATUS_PILL } from "@/modules/sales/components/status-badge";
import { BOARD_COLUMNS, STATUS_LABELS, type BookingPatch, type BookingRow, type RepRow } from "@/modules/sales/types";

const UNASSIGNED = "unassigned";
// The first column stays put while the table scrolls sideways, so nothing gets squeezed.
const stickyCell = "sticky left-0 z-10 bg-card transition-colors group-hover:bg-muted";

export function BookingsTable({
  bookings,
  reps,
  selectedId,
  onSelect,
  onPatch,
  emptyTitle = "No bookings yet",
  emptyHint = "New Calendly bookings show up here after the next sync.",
}: {
  bookings: BookingRow[];
  reps: RepRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: BookingPatch) => void;
  emptyTitle?: string;
  emptyHint?: string;
}) {
  const myZone = useViewerTimeZone();

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border bg-card px-6 py-16 text-center">
        <CalendarX2 className="size-6 text-subtle" strokeWidth={1.5} />
        <p className="mt-4 font-medium">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table className="min-w-[1180px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn("min-w-[240px] border-r", "sticky left-0 z-10 bg-card")}>Invitee</TableHead>
            <TableHead className="min-w-[160px]">Scheduled</TableHead>
            <TableHead className="min-w-[180px]">Assigned To</TableHead>
            <TableHead className="min-w-[130px]">Status</TableHead>
            <TableHead className="min-w-[100px]">Event Type</TableHead>
            <TableHead className="min-w-[90px]">Qualified</TableHead>
            <TableHead className="min-w-[100px]">Calls</TableHead>
            <TableHead className="min-w-[150px]">Their Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => {
            const selected = b.id === selectedId;
            const upcoming = Date.parse(b.endTime) > Date.now();
            const answered = b.callAttempts.filter((c) => c.answered).length;
            return (
              <TableRow
                key={b.id}
                onClick={() => onSelect(b.id)}
                data-state={selected ? "selected" : undefined}
                className="group h-row cursor-pointer transition-colors duration-150"
              >
                <TableCell className={cn(stickyCell, "border-r", selected && "bg-muted")}>
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={b.inviteeName} />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(b.id);
                        }}
                        className="flex max-w-48 items-center gap-2 text-left text-sm font-medium outline-none focus-visible:underline"
                      >
                        <span className="truncate">{b.inviteeName}</span>
                        {b.canceledAt && <CanceledTag />}
                      </button>
                      <p className="flex max-w-48 items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{b.inviteeEmail}</span>
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <span className="tabular-nums">{myZone ? formatDate(b.startTime, myZone) : ""}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      <span className="tabular-nums">{myZone ? formatTime(b.startTime, myZone) : ""}</span>
                      {upcoming && !b.canceledAt && (
                        <Badge variant="outline" className="ml-1 border-status-showed-foreground/30 px-1.5 py-0 text-xs text-status-showed-foreground">
                          Upcoming
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Rep and status can be changed right here; clicks don't open the panel. */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={b.repId ?? UNASSIGNED}
                    onValueChange={(v) => onPatch(b.id, { repId: v === UNASSIGNED ? null : v })}
                  >
                    <SelectTrigger className="h-8 w-[172px]" aria-label={`Rep for ${b.inviteeName}`}>
                      <SelectValue placeholder="Assign..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>
                        <span className="text-muted-foreground">Unassigned</span>
                      </SelectItem>
                      {reps.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id}>
                          <span className="flex items-center gap-2">
                            <InitialsAvatar name={rep.name} color={rep.color} className="size-5 [&_[data-slot=avatar-fallback]]:text-[10px]" />
                            {rep.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select value={b.status} onValueChange={(v) => onPatch(b.id, { status: v as BookingRow["status"] })}>
                    <SelectTrigger
                      aria-label={`Status for ${b.inviteeName}`}
                      className="group/status h-auto w-auto rounded-full border-0 bg-transparent p-0 shadow-none transition-all duration-150 hover:bg-muted/50 hover:ring-1 hover:ring-border dark:bg-transparent [&>svg]:ml-1 [&>svg]:-mr-1 [&>svg]:opacity-0 [&>svg]:transition-opacity group-hover/status:[&>svg]:opacity-100"
                    >
                      <Badge className={cn("pointer-events-none rounded-full border-transparent", STATUS_PILL[b.status])}>
                        {STATUS_LABELS[b.status]}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent align="start" sideOffset={4} className="min-w-[140px]">
                      {BOARD_COLUMNS.map((c) => (
                        <SelectItem key={c.status} value={c.status}>
                          <Badge className={cn("rounded-full border-transparent", STATUS_PILL[c.status])}>{c.label}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  {b.eventTypeName ? (
                    <Badge variant="outline" className="rounded-full text-xs">
                      {b.eventTypeName}
                    </Badge>
                  ) : (
                    <span className="text-sm text-subtle">—</span>
                  )}
                </TableCell>

                <TableCell className="text-sm">
                  {b.qualified === null ? <span className="text-subtle">Not yet</span> : b.qualified ? "Yes" : "No"}
                </TableCell>

                <TableCell className="text-sm tabular-nums">
                  {b.callAttempts.length === 0 ? (
                    <span className="text-subtle">None</span>
                  ) : (
                    <>
                      {b.callAttempts.length}
                      <span className="text-muted-foreground"> · {answered} answered</span>
                    </>
                  )}
                </TableCell>

                <TableCell>
                  {b.inviteeTimeZone ? (
                    <div className="space-y-1">
                      <p className="text-sm tabular-nums">{formatTime(b.startTime, b.inviteeTimeZone)}</p>
                      <p className="text-xs text-muted-foreground">{cityName(b.inviteeTimeZone)}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-subtle">Unknown</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
