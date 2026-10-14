"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewerTimeZone } from "@/lib/use-viewer-time-zone";
import { BookingPanel } from "@/modules/sales/components/booking-panel";
import { BookingsBoard } from "@/modules/sales/components/bookings-board";
import { BookingsTable } from "@/modules/sales/components/bookings-table";
import { CallsByHourChart } from "@/modules/sales/components/calls-by-hour-chart";
import { FiltersBar, type SalesView } from "@/modules/sales/components/filters-bar";
import { StatsRow } from "@/modules/sales/components/stats-row";
import { useBookings } from "@/modules/sales/components/use-bookings";
import {
  calculateStats,
  callsByHour,
  filterBookings,
  pastBookings,
  upcomingBookings,
  type HourMode,
  type SalesFilters,
} from "@/modules/sales/stats";
import type { BookingRow, RepRow } from "@/modules/sales/types";

const VIEW_KEY = "sales:view";

// Remembers Table vs Board per browser. Storage can be unavailable (private
// windows), so every access is wrapped and the page works without it.
function useStoredView(): [SalesView, (view: SalesView) => void] {
  const [view, setView] = useState<SalesView>("table");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "table" || saved === "board") setView(saved);
    } catch {}
  }, []);
  const update = (next: SalesView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  };
  return [view, update];
}

// "Now" refreshes every minute so meetings move from Upcoming to Past on their own.
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

// The interactive part of the Sales page. Holds the bookings in memory so every change
// (table, board or panel) shows instantly, and derives stats, list and chart from the
// same filtered set.
export function SalesWorkspace({ initialBookings, reps }: { initialBookings: BookingRow[]; reps: RepRow[] }) {
  const { bookings, patchBooking, addCall, deleteCall } = useBookings(initialBookings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SalesFilters>({ range: "all", rep: "all" });
  const [view, setView] = useStoredView();
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");
  const [hourMode, setHourMode] = useState<HourMode>("theirs");
  const myZone = useViewerTimeZone();
  const now = useNow();

  const repsById = useMemo(() => new Map(reps.map((r) => [r.id, r])), [reps]);
  const filtered = useMemo(() => filterBookings(bookings, filters, now), [bookings, filters, now]);
  const stats = useMemo(() => calculateStats(filtered), [filtered]);
  const upcoming = useMemo(() => upcomingBookings(filtered, now), [filtered, now]);
  const past = useMemo(() => pastBookings(filtered, now), [filtered, now]);
  // Canceled bookings stay in the table (with a tag) but not on the board.
  const boardBookings = useMemo(() => filtered.filter((b) => b.canceledAt === null), [filtered]);
  const hours = useMemo(
    () => (myZone ? callsByHour(bookings, filters, hourMode, myZone, now) : null),
    [bookings, filters, hourMode, myZone, now],
  );
  const selected = bookings.find((b) => b.id === selectedId) ?? null;
  const rows = when === "upcoming" ? upcoming : past;

  return (
    <div className="space-y-6">
      <FiltersBar filters={filters} onChange={setFilters} reps={reps} view={view} onViewChange={setView} />
      <StatsRow stats={stats} />

      {view === "table" ? (
        <div className="flex flex-col gap-4">
          <Tabs value={when} onValueChange={(v) => setWhen(v as "upcoming" | "past")}>
            <TabsList aria-label="Upcoming or past">
              <TabsTrigger value="upcoming" className="gap-2 px-3">
                Upcoming
                <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums">
                  {upcoming.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2 px-3">
                Past
                <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums">
                  {past.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <BookingsTable
            bookings={rows}
            reps={reps}
            onPatch={patchBooking}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyTitle={when === "upcoming" ? "No upcoming bookings" : "No past bookings"}
            emptyHint={
              bookings.length === 0
                ? "New Calendly bookings show up here after the next sync."
                : when === "upcoming" && filters.range === "30d"
                  ? "“Last 30 days” only covers meetings that already happened. Switch to Past, or pick another range."
                  : "Nothing matches these filters. Try another date range or rep."
            }
          />
        </div>
      ) : (
        <BookingsBoard
          bookings={boardBookings}
          repsById={repsById}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={(id, status) => patchBooking(id, { status })}
        />
      )}

      <CallsByHourChart buckets={hours} mode={hourMode} onModeChange={setHourMode} />

      <BookingPanel
        booking={selected}
        reps={reps}
        onClose={() => setSelectedId(null)}
        onPatch={patchBooking}
        onAddCall={addCall}
        onDeleteCall={deleteCall}
      />
    </div>
  );
}
