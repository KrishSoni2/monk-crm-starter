/* ============================================================
 * CONNECTION: Calendly (REST API v2)
 * Required:   Optional (app runs in demo mode without it)
 * Env vars:   CALENDLY_TOKEN
 * Get it:     Calendly > Integrations & apps > API & webhooks
 *             > Personal access tokens
 * Plan:       Free plan works (polling). Webhooks need a paid plan.
 * If missing: Demo data is shown and "Sync now" explains why.
 * Docs:       docs/CONNECTIONS.md#calendly
 * ============================================================ */
// A small Calendly API client. It only reads. Pass a different `fetchImpl` to test it
// against fake responses. The token is only ever sent to api.calendly.com and is never
// logged or included in error messages.
import type { CalendlyEvent, CalendlyInvitee, CalendlyUser } from "@/modules/sales/integrations/calendly/types";

export const CALENDLY_API = "https://api.calendly.com";
const MAX_RETRIES = 3;

export class CalendlyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type Page<T> = { collection: T[]; pagination?: { next_page?: string | null } };

function explain(status: number): string {
  if (status === 401) return "Calendly rejected the token (401). Check CALENDLY_TOKEN is current and copied in full.";
  if (status === 403) return "This Calendly token isn't allowed to do that (403).";
  if (status === 429) return "Calendly is rate-limiting us (429). The next sync will catch up.";
  return `Calendly returned an error (${status}).`;
}

export function createCalendlyClient(token: string, fetchImpl: typeof fetch = fetch) {
  async function get<T>(url: string): Promise<T> {
    // Never send the token anywhere except Calendly's API.
    if (!url.startsWith(`${CALENDLY_API}/`)) throw new CalendlyError("Refusing to call a non-Calendly URL", 0);
    for (let attempt = 0; ; attempt++) {
      const response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const wait = Number(response.headers.get("retry-after")) || 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, Math.min(wait, 30) * 1000));
        continue;
      }
      if (!response.ok) throw new CalendlyError(explain(response.status), response.status);
      return (await response.json()) as T;
    }
  }

  async function getAll<T>(firstUrl: string): Promise<T[]> {
    const items: T[] = [];
    let url: string | null | undefined = firstUrl;
    while (url) {
      const page: Page<T> = await get<Page<T>>(url);
      items.push(...(page.collection ?? []));
      url = page.pagination?.next_page;
    }
    return items;
  }

  return {
    /** The person who owns the token, including their organization. */
    async getCurrentUser(): Promise<CalendlyUser> {
      return (await get<{ resource: CalendlyUser }>(`${CALENDLY_API}/users/me`)).resource;
    },

    /** All scheduled events (active and canceled) starting inside the window. */
    async listScheduledEvents(scope: { organization: string } | { user: string }, from: Date, to: Date) {
      const params = new URLSearchParams({
        ...scope,
        min_start_time: from.toISOString(),
        max_start_time: to.toISOString(),
        count: "100",
        sort: "start_time:asc",
      });
      return getAll<CalendlyEvent>(`${CALENDLY_API}/scheduled_events?${params}`);
    },

    /** Everyone booked into one event (active and canceled). */
    async listInvitees(eventUri: string) {
      return getAll<CalendlyInvitee>(`${eventUri}/invitees?count=100`);
    },
  };
}

export type CalendlyClient = ReturnType<typeof createCalendlyClient>;
