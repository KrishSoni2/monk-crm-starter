// Time zone helpers built on the browser/Node Intl API (no date library needed).

// How far a time zone is ahead of UTC at a given moment, in milliseconds.
// Reads the wall-clock parts in that zone, rebuilds them as if they were UTC, and
// compares with the real moment (rounded to the second, since we drop milliseconds).
export function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const wall: Record<string, number> = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(date)) {
    if (type !== "literal") wall[type] = Number(value);
  }
  const wallAsUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  const actual = date.getTime() - date.getUTCMilliseconds();
  return wallAsUtc - actual;
}

// The UTC moment for a wall-clock time in a time zone, e.g. 9:30 in Europe/London.
export function zonedTimeToUtc(
  y: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(y, monthIndex, day, hour, minute);
  const first = guess - timeZoneOffsetMs(new Date(guess), timeZone);
  // Second pass handles the rare case where the guess crossed a daylight-saving change.
  return new Date(guess - timeZoneOffsetMs(new Date(first), timeZone));
}

// The hour (0-23) of a moment as seen in a time zone.
export function hourInTimeZone(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(date);
  return Number(hour) % 24;
}
