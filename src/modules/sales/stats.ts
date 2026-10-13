// AI-GUIDE: Stats calculations for the Sales module. Pure functions (no database, no
// React), so they run in the browser on the bookings already loaded and are easy to
// test. Everything on the stats row and the hour chart comes from here.
//
// To add a stat card:
//   1. Add a field to SalesStats and calculate it in calculateStats().
//   2. Add an entry to STAT_CARDS with a label and a one-line "how it's calculated"
//      subtitle. Never show a number without saying what it counts.
// To change a definition (e.g. what "showed" means), change it here only: the cards,
// subtitles and BUILD.md must all agree, so update the subtitle and BUILD.md too.
import type { BookingStatus } from "@/generated/prisma/enums";
import { hourInTimeZone } from "@/lib/time";
import type { BookingRow } from "@/modules/sales/types";

export type DateRange = "week" | "30d" | "all";
export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

/** "all" = every rep, "unassigned" = no rep, otherwise a rep id. */
export type RepFilter = string;

export type SalesFilters = { range: DateRange; rep: RepFilter };

const DAY = 24 * 60 * 60 * 1000;

// Date ranges use the viewer's own clock (their browser's time zone).
// This week = Monday 00:00 to next Monday 00:00. Last 30 days = the 30 days up to now.
export function rangeBounds(range: DateRange, now: Date): { from: number; to: number } {
  if (range === "all") return { from: -Infinity, to: Infinity };
  if (range === "30d") return { from: now.getTime() - 30 * DAY, to: now.getTime() };
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return { from: monday.getTime(), to: nextMonday.getTime() };
}

function matchesRep(repId: string | null, rep: RepFilter) {
  if (rep === "all") return true;
  if (rep === "unassigned") return repId === null;
  return repId === rep;
}

/** Bookings whose meeting starts inside the date range and that match the rep filter. */
export function filterBookings(bookings: BookingRow[], filters: SalesFilters, now: Date): BookingRow[] {
  const { from, to } = rangeBounds(filters.range, now);
  return bookings.filter((b) => {
    const start = Date.parse(b.startTime);
    return start >= from && start < to && matchesRep(b.repId, filters.rep);
  });
}

/** Upcoming = the meeting hasn't ended yet. Soonest first. */
export function upcomingBookings(bookings: BookingRow[], now: Date) {
  return bookings
    .filter((b) => Date.parse(b.endTime) > now.getTime())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Past = the meeting has ended. Most recent first. */
export function pastBookings(bookings: BookingRow[], now: Date) {
  return bookings
    .filter((b) => Date.parse(b.endTime) <= now.getTime())
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
}

// "Showed" = the meeting happened: Showed, Closed or Lost. Not qualified is left out
// on purpose, because it's often decided before the call.
export const SHOWED_STATUSES: BookingStatus[] = ["SHOWED", "CLOSED", "LOST"];

export type SalesStats = {
  total: number;
  noShows: number;
  closed: number;
  lost: number;
  showed: number;
  /** 0 to 1, or null when nobody has showed yet (no rate to show). */
  closeRate: number | null;
};

/** Canceled bookings never count toward stats. */
export function calculateStats(bookings: BookingRow[]): SalesStats {
  const active = bookings.filter((b) => b.canceledAt === null);
  const count = (statuses: BookingStatus[]) => active.filter((b) => statuses.includes(b.status)).length;
  const showed = count(SHOWED_STATUSES);
  const closed = count(["CLOSED"]);
  return {
    total: active.length,
    noShows: count(["NO_SHOW"]),
    closed,
    lost: count(["LOST"]),
    showed,
    closeRate: showed > 0 ? closed / showed : null,
  };
}

export const STAT_CARDS: { key: keyof SalesStats; label: string; how: string; format?: "percent" }[] = [
  { key: "total", label: "Total bookings", how: "All bookings in range, excluding canceled" },
  { key: "noShows", label: "No-shows", how: "Status is No-show" },
  { key: "closed", label: "Closed", how: "Status is Closed" },
  { key: "lost", label: "Lost", how: "Status is Lost" },
  { key: "closeRate", label: "Close rate", how: "Closed ÷ showed (showed + closed + lost)", format: "percent" },
];

export type HourBucket = { hour: number; answered: number; notAnswered: number };
export type HourMode = "theirs" | "mine";

/**
 * Call attempts grouped by hour of day (0-23). "theirs" uses the invitee's own time
 * zone (when do people pick up?), "mine" uses the viewer's. Calls are filtered by
 * when they happened (date range) and who made them (rep filter).
 */
export function callsByHour(
  bookings: BookingRow[],
  filters: SalesFilters,
  mode: HourMode,
  myZone: string,
  now: Date,
): HourBucket[] {
  const buckets: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({ hour, answered: 0, notAnswered: 0 }));
  const { from, to } = rangeBounds(filters.range, now);
  for (const b of bookings) {
    const zone = mode === "theirs" ? (b.inviteeTimeZone ?? myZone) : myZone;
    for (const call of b.callAttempts) {
      const at = Date.parse(call.attemptedAt);
      if (at < from || at >= to || !matchesRep(call.repId, filters.rep)) continue;
      const bucket = buckets[hourInTimeZone(new Date(at), zone)];
      if (call.answered) bucket.answered++;
      else bucket.notAnswered++;
    }
  }
  return buckets;
}
