// Time zone helpers built on the browser/Node Intl API (no date library needed).

// How far a time zone is ahead of UTC at a given moment, in milliseconds.
export function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
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
