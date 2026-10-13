import { describe, expect, it } from "vitest";
import { calculateStats, callsByHour, filterBookings, pastBookings, rangeBounds, upcomingBookings } from "@/modules/sales/stats";
import type { BookingRow } from "@/modules/sales/types";

const now = new Date("2026-10-14T12:00:00Z"); // a Wednesday

function booking(id: string, startIso: string, extra: Partial<BookingRow> = {}): BookingRow {
  return {
    id, eventTypeName: "Call", inviteeName: id, inviteeEmail: `${id}@example.com`, inviteePhone: null,
    inviteeTimeZone: "America/New_York", startTime: startIso,
    endTime: new Date(Date.parse(startIso) + 30 * 60_000).toISOString(), locationType: null, joinUrl: null,
    rescheduleUrl: null, questions: [], canceledAt: null, cancelReason: null, canceledBy: null, status: "BOOKED",
    qualified: null, qualifiedReason: null, notes: null, repId: null, isDemo: false, callAttempts: [], ...extra,
  };
}

describe("calculateStats", () => {
  it("counts each status, excludes canceled, and uses closed / (showed + closed + lost)", () => {
    const stats = calculateStats([
      booking("a", "2026-10-01T15:00:00Z", { status: "SHOWED" }),
      booking("b", "2026-10-01T15:00:00Z", { status: "CLOSED" }),
      booking("c", "2026-10-01T15:00:00Z", { status: "CLOSED" }),
      booking("d", "2026-10-01T15:00:00Z", { status: "LOST" }),
      booking("e", "2026-10-01T15:00:00Z", { status: "NO_SHOW" }),
      booking("f", "2026-10-01T15:00:00Z", { status: "NOT_QUALIFIED" }),
      booking("g", "2026-10-01T15:00:00Z", { status: "CLOSED", canceledAt: "2026-09-30T00:00:00Z" }),
    ]);
    expect(stats).toEqual({ total: 6, noShows: 1, closed: 2, lost: 1, showed: 4, closeRate: 0.5 });
  });

  it("has no close rate when nobody showed", () => {
    expect(calculateStats([booking("a", "2026-10-01T15:00:00Z")]).closeRate).toBeNull();
  });
});

describe("filters", () => {
  const list = [
    booking("past", "2026-10-01T15:00:00Z", { repId: "r1" }),
    booking("monday", "2026-10-12T15:00:00Z", { repId: "r2" }),
    booking("soon", "2026-10-15T15:00:00Z"),
    booking("later", "2026-11-20T15:00:00Z", { repId: "r1" }),
  ];

  it("this week runs Monday to Monday", () => {
    const { from, to } = rangeBounds("week", now);
    expect(new Date(from).getDay()).toBe(1);
    expect(to - from).toBe(7 * 86_400_000);
    expect(filterBookings(list, { range: "week", rep: "all" }, now).map((b) => b.id)).toEqual(["monday", "soon"]);
  });

  it("last 30 days covers only the past 30 days", () => {
    expect(filterBookings(list, { range: "30d", rep: "all" }, now).map((b) => b.id)).toEqual(["past", "monday"]);
  });

  it("filters by rep and by unassigned", () => {
    expect(filterBookings(list, { range: "all", rep: "r1" }, now).map((b) => b.id)).toEqual(["past", "later"]);
    expect(filterBookings(list, { range: "all", rep: "unassigned" }, now).map((b) => b.id)).toEqual(["soon"]);
  });

  it("upcoming is soonest first, past is most recent first", () => {
    expect(upcomingBookings(list, now).map((b) => b.id)).toEqual(["soon", "later"]);
    expect(pastBookings(list, now).map((b) => b.id)).toEqual(["monday", "past"]);
  });
});

describe("callsByHour", () => {
  it("buckets calls by the invitee's hour or mine", () => {
    const b = booking("a", "2026-10-01T15:00:00Z", {
      inviteeTimeZone: "Europe/London",
      callAttempts: [
        { id: "1", attemptedAt: "2026-10-01T09:30:00Z", answered: true, note: null, repId: null },
        { id: "2", attemptedAt: "2026-10-01T09:45:00Z", answered: false, note: null, repId: null },
      ],
    });
    const theirs = callsByHour([b], { range: "all", rep: "all" }, "theirs", "America/New_York", now);
    expect(theirs[10]).toEqual({ hour: 10, answered: 1, notAnswered: 1 }); // 09:30 UTC = 10:30 in London (BST)
    const mine = callsByHour([b], { range: "all", rep: "all" }, "mine", "America/New_York", now);
    expect(mine[5]).toEqual({ hour: 5, answered: 1, notAnswered: 1 }); // 5:30 in New York (EDT)
  });
});
