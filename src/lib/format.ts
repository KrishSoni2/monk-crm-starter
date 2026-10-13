// Date and time formatting with the built-in Intl API.

export function formatTime(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatDate(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" }).format(
    new Date(iso),
  );
}

export function formatDateTime(iso: string, timeZone: string) {
  return `${formatDate(iso, timeZone)} · ${formatTime(iso, timeZone)}`;
}

// "Europe/London" -> "London", "America/New_York" -> "New York"
export function cityName(timeZone: string) {
  return (timeZone.split("/").pop() ?? timeZone).replaceAll("_", " ");
}

// Short zone label like "GMT+1" or "EDT".
export function zoneAbbreviation(iso: string, timeZone: string) {
  return (
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(new Date(iso))
      .find((p) => p.type === "timeZoneName")?.value ?? ""
  );
}

// Value for <input type="datetime-local"> in the viewer's local time.
export function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
