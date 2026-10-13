import { describe, expect, it } from "vitest";
import { hourInTimeZone, timeZoneOffsetMs, zonedTimeToUtc } from "@/lib/time";

const HOUR = 3_600_000;

describe("time zone helpers", () => {
  it("knows the offset in summer and winter time", () => {
    expect(timeZoneOffsetMs(new Date("2026-07-01T12:00:00Z"), "Europe/London")).toBe(1 * HOUR);
    expect(timeZoneOffsetMs(new Date("2026-12-01T12:00:00Z"), "Europe/London")).toBe(0);
    expect(timeZoneOffsetMs(new Date("2026-07-01T12:00:00Z"), "America/New_York")).toBe(-4 * HOUR);
    expect(timeZoneOffsetMs(new Date("2026-07-01T12:00:00Z"), "Asia/Kolkata")).toBe(5.5 * HOUR);
  });

  it("turns a wall-clock time in a zone into the right moment", () => {
    expect(zonedTimeToUtc(2026, 6, 1, 9, 30, "Europe/London").toISOString()).toBe("2026-07-01T08:30:00.000Z");
    expect(zonedTimeToUtc(2026, 11, 1, 9, 30, "America/New_York").toISOString()).toBe("2026-12-01T14:30:00.000Z");
  });

  it("reads the hour in a zone", () => {
    expect(hourInTimeZone(new Date("2026-07-01T23:30:00Z"), "Asia/Singapore")).toBe(7);
    expect(hourInTimeZone(new Date("2026-07-01T00:30:00Z"), "UTC")).toBe(0);
  });
});
