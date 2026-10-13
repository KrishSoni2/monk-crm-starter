// AI-GUIDE: Test helpers. Use createMockCalendly(now) to build fake events and invitees
// and pass mock.fetchImpl to runSync(). Copy this pattern to test a new integration
// without touching the real service.
// A fake Calendly API for tests. Holds events and invitees in memory and answers the
// same URLs the real API does (users/me, scheduled_events with paging, invitees).
// Never talks to the network.
import type { CalendlyEvent, CalendlyInvitee } from "@/modules/sales/integrations/calendly/types";

export const API = "https://api.calendly.com";
export const ORG = `${API}/organizations/ORG1`;
export const USER = `${API}/users/USER1`;
export const TOKEN = "test-token-do-not-print";
const DAY = 86_400_000;
const PAGE_SIZE = 2; // small, so paging is exercised

export function createMockCalendly(now: Date) {
  const state = {
    orgAdmin: false,
    rejectToken: false,
    badNextPage: false,
    rateLimitOnce: new Set<string>(),
    events: [] as CalendlyEvent[],
    invitees: {} as Record<string, CalendlyInvitee[]>,
    calls: [] as string[],
  };

  const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    state.calls.push(url.toString());
    if (state.rejectToken || new Headers(init?.headers).get("authorization") !== `Bearer ${TOKEN}`) {
      return json({ title: "Unauthenticated" }, 401);
    }
    if (state.rateLimitOnce.delete(url.pathname)) return json({ title: "Too many requests" }, 429, { "retry-after": "1" });

    if (url.pathname === "/users/me") {
      return json({ resource: { uri: USER, name: "Test Owner", email: "owner@example.com", current_organization: ORG } });
    }
    if (url.pathname === "/scheduled_events") {
      if (url.searchParams.get("organization") && !state.orgAdmin) return json({ title: "Permission Denied" }, 403);
      const min = Date.parse(url.searchParams.get("min_start_time")!);
      const max = Date.parse(url.searchParams.get("max_start_time")!);
      const inWindow = state.events.filter((e) => Date.parse(e.start_time) >= min && Date.parse(e.start_time) <= max);
      const offset = Number(url.searchParams.get("page_token") ?? 0);
      let next: string | null = null;
      if (offset + PAGE_SIZE < inWindow.length) {
        const nextUrl = new URL(url);
        nextUrl.searchParams.set("page_token", String(offset + PAGE_SIZE));
        next = state.badNextPage ? `https://evil.example/steal?${nextUrl.searchParams}` : nextUrl.toString();
      }
      return json({ collection: inWindow.slice(offset, offset + PAGE_SIZE), pagination: { next_page: next } });
    }
    const match = url.pathname.match(/^\/scheduled_events\/([^/]+)\/invitees$/);
    if (match) return json({ collection: state.invitees[`${API}/scheduled_events/${match[1]}`] ?? [], pagination: {} });
    return json({ title: "Not found" }, 404);
  };

  /** An ISO time `days` from now at `hour`:00 UTC. */
  const at = (days: number, hour = 15) => {
    const d = new Date(now.getTime() + days * DAY);
    d.setUTCHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  const event = (id: string, days: number, hostEmail: string, extra: Partial<CalendlyEvent> = {}): CalendlyEvent => ({
    uri: `${API}/scheduled_events/${id}`,
    name: "Discovery Call",
    status: "active",
    start_time: at(days),
    end_time: new Date(Date.parse(at(days)) + 30 * 60_000).toISOString(),
    location: { type: "zoom", join_url: `https://zoom.example.com/j/${id}` },
    event_memberships: [{ user: USER, user_email: hostEmail, user_name: "Host" }],
    ...extra,
  });

  const invitee = (eventId: string, id: string, name: string, extra: Partial<CalendlyInvitee> = {}): CalendlyInvitee => ({
    uri: inviteeUri(eventId, id),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    status: "active",
    timezone: "Europe/London",
    questions_and_answers: [
      { question: "What would you like to talk about?", answer: "Automating intake", position: 1 },
      { question: "Phone number", answer: "+1 555-0142", position: 0 },
    ],
    reschedule_url: `https://calendly.com/reschedulings/${id}`,
    cancel_url: `https://calendly.com/cancellations/${id}`,
    rescheduled: false,
    old_invitee: null,
    new_invitee: null,
    cancellation: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...extra,
  });

  /** Add or replace an event and its invitees. */
  const put = (e: CalendlyEvent, ...inv: CalendlyInvitee[]) => {
    state.events = state.events.filter((x) => x.uri !== e.uri).concat(e);
    state.invitees[e.uri] = inv;
  };

  return { state, fetchImpl, at, event, invitee, put };
}

export const inviteeUri = (eventId: string, id: string) => `${API}/scheduled_events/${eventId}/invitees/${id}`;
