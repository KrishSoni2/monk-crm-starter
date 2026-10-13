// Calendly sync against a fake Calendly API and a real (test) Postgres database.
// Needs TEST_DATABASE_URL (a separate, empty database: these tests erase it).
// Without it, this whole file is skipped.
import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as webhookPOST } from "@/app/api/webhooks/calendly/route";
import { getDb } from "@/lib/db";
import { ensureDemoData } from "@/modules/sales/demo/seed";
import { normalizeInvitee } from "@/modules/sales/integrations/calendly/normalize";
import { loadRepEmails, saveInvitee } from "@/modules/sales/integrations/calendly/store";
import { runSync } from "@/modules/sales/integrations/calendly/sync";
import { API, createMockCalendly, inviteeUri, TOKEN, USER } from "./helpers/mock-calendly";

const hasDb = Boolean(process.env.DATABASE_URL);
const now = new Date();
const mock = createMockCalendly(now);
const { state, at, event, invitee, put } = mock;

describe.skipIf(!hasDb)("Calendly sync (database)", () => {
  const db = hasDb ? getDb() : (undefined as never);
  const sync = () => runSync({ source: "manual", fetchImpl: mock.fetchImpl, now });
  const row = (eventId: string, id: string) => db.booking.findUnique({ where: { inviteeUri: inviteeUri(eventId, id) } });
  let realRepId = "";
  let demoBefore = 0;

  beforeAll(async () => {
    await db.$executeRawUnsafe('TRUNCATE "CallAttempt", "Booking", "Rep", "SyncRun"');
    process.env.CALENDLY_TOKEN = TOKEN;
    // Demo data, plus one real rep the owner added themselves.
    await ensureDemoData(db);
    demoBefore = await db.booking.count({ where: { source: "DEMO" } });
    realRepId = (await db.rep.create({ data: { name: "Real Rep", email: "real.rep@example.com", color: "violet" } })).id;

    put(event("E1", 2, "real.rep@example.com"), invitee("E1", "A", "Alex Archer"));
    put(event("E2", 3, "someone.else@example.com"), invitee("E2", "B", "Blair Brook"));
    put(event("E3", -5, "real.rep@example.com"), invitee("E3", "C", "Casey Cole"), invitee("E3", "D", "Devon Dale"));
    put(event("OLD", -90, "real.rep@example.com"), invitee("OLD", "Z", "Outside Window")); // outside the 60-day window
  });

  it("first real sync falls back from organization to user scope, pages, and respects the 60-day window", async () => {
    const result = await sync();
    expect(result).toMatchObject({ status: "ok", created: 4, events: 3 });
    expect(state.calls.some((c) => c.includes("organization="))).toBe(true);
    expect(state.calls.some((c) => c.includes(`user=${encodeURIComponent(USER)}`))).toBe(true);
    expect(state.calls.some((c) => c.includes("page_token="))).toBe(true);
  });

  it("first real sync deletes ONLY demo rows", async () => {
    expect(demoBefore).toBeGreaterThan(0);
    expect(await db.booking.count({ where: { source: "DEMO" } })).toBe(0);
    expect(await db.rep.count({ where: { isDemo: true } })).toBe(0);
    expect(await db.rep.findUnique({ where: { id: realRepId } })).not.toBeNull();
    expect(await db.callAttempt.count()).toBe(0);
    expect(await db.booking.count()).toBe(4);
  });

  it("captures time zone, links, Q&A, phone and host", async () => {
    const a = await row("E1", "A");
    expect(a).toMatchObject({
      inviteeTimeZone: "Europe/London",
      joinUrl: "https://zoom.example.com/j/E1",
      rescheduleUrl: "https://calendly.com/reschedulings/A",
      cancelUrl: "https://calendly.com/cancellations/A",
      inviteePhone: "+1 555-0142",
      hostEmail: "real.rep@example.com",
      source: "CALENDLY",
    });
  });

  it("auto-assigns a rep when the host email matches, leaves others unassigned", async () => {
    expect((await row("E1", "A"))?.repId).toBe(realRepId);
    expect((await row("E2", "B"))?.repId).toBeNull();
  });

  it("syncing twice never duplicates", async () => {
    expect(await sync()).toMatchObject({ status: "ok", created: 0, updated: 4 });
    expect(await db.booking.count()).toBe(4);
  });

  it("never overwrites team fields, but refreshes Calendly fields", async () => {
    const a = (await row("E1", "A"))!;
    await db.booking.update({
      where: { id: a.id },
      data: { status: "SHOWED", qualified: true, qualifiedReason: "Budget ok", notes: "Hot lead", repId: null },
    });
    await db.callAttempt.create({ data: { bookingId: a.id, answered: true, note: "Confirmed" } });
    state.invitees[`${API}/scheduled_events/E1`][0].questions_and_answers = [
      { question: "What would you like to talk about?", answer: "Changed answer", position: 0 },
    ];
    await sync();
    const after = (await row("E1", "A"))!;
    expect(after).toMatchObject({ status: "SHOWED", qualified: true, qualifiedReason: "Budget ok", notes: "Hot lead" });
    expect(after.repId).toBe(realRepId); // an empty rep is filled from the host email again
    expect((after.questions as { answer: string }[])[0].answer).toBe("Changed answer");
    expect(await db.callAttempt.count({ where: { bookingId: a.id } })).toBe(1);
  });

  it("never replaces a rep the team chose", async () => {
    const other = await db.rep.create({ data: { name: "Other Rep", email: "other.rep@example.com", color: "teal" } });
    const a = (await row("E1", "A"))!;
    await db.booking.update({ where: { id: a.id }, data: { repId: other.id } });
    await sync();
    expect((await row("E1", "A"))?.repId).toBe(other.id);
  });

  it("invitee cancels: cancel info saved, status left alone", async () => {
    state.invitees[`${API}/scheduled_events/E2`][0] = invitee("E2", "B", "Blair Brook", {
      status: "canceled",
      cancellation: { canceled_by: "Blair Brook", reason: "Schedule conflict", canceler_type: "invitee", created_at: at(-1, 10) },
    });
    await sync();
    const b = (await row("E2", "B"))!;
    expect(b).toMatchObject({ cancelReason: "Schedule conflict", canceledBy: "Blair Brook", status: "BOOKED" });
    expect(b.canceledAt?.toISOString()).toBe(at(-1, 10));
  });

  it("host cancels the whole event: every invitee is marked canceled", async () => {
    const e3 = state.events.find((e) => e.uri.endsWith("/E3"))!;
    e3.status = "canceled";
    e3.cancellation = { canceled_by: "Host", reason: "Host is sick", canceler_type: "host", created_at: at(-6, 9) };
    await sync();
    for (const id of ["C", "D"]) {
      const r = (await row("E3", id))!;
      expect(r.cancelReason).toBe("Host is sick");
      expect(r.canceledAt).not.toBeNull();
    }
  });

  it("reschedule: the same row moves to the new invitee and keeps rep, notes, calls and status", async () => {
    const before = (await row("E1", "A"))!;
    state.invitees[`${API}/scheduled_events/E1`][0] = invitee("E1", "A", "Alex Archer", {
      status: "canceled",
      rescheduled: true,
      new_invitee: inviteeUri("E4", "A2"),
      cancellation: { canceled_by: "Alex Archer", reason: "Need a later slot", canceler_type: "invitee", created_at: at(0, 8) },
    });
    put(event("E4", 9, "real.rep@example.com"), invitee("E4", "A2", "Alex Archer", { old_invitee: before.inviteeUri }));
    expect(await sync()).toMatchObject({ status: "ok" });
    expect(await db.booking.count()).toBe(4);
    const after = (await db.booking.findUnique({ where: { id: before.id } }))!;
    expect(after.inviteeUri).toBe(inviteeUri("E4", "A2"));
    expect(after.previousInviteeUris).toContain(before.inviteeUri);
    expect(after.startTime.toISOString()).toBe(at(9));
    expect(after).toMatchObject({ canceledAt: null, cancelReason: null, status: "SHOWED", notes: "Hot lead", repId: before.repId });
    expect(await db.callAttempt.count({ where: { bookingId: before.id } })).toBe(1);
  });

  it("reschedule: the old invitee is ignored on every later sync", async () => {
    expect(await sync()).toMatchObject({ created: 0 });
    expect(await db.booking.count()).toBe(4);
    expect(await row("E1", "A")).toBeNull();
  });

  it("reschedule of a No-show: back to Booked with an automatic note", async () => {
    put(event("N1", -3, "x@example.com"), invitee("N1", "N", "Noel North"));
    await sync();
    const original = (await row("N1", "N"))!;
    await db.booking.update({ where: { id: original.id }, data: { status: "NO_SHOW", notes: "Called twice, no answer" } });

    state.invitees[`${API}/scheduled_events/N1`][0] = invitee("N1", "N", "Noel North", { status: "canceled", rescheduled: true });
    put(event("N2", 6, "x@example.com"), invitee("N2", "N2", "Noel North", { old_invitee: original.inviteeUri }));
    await sync();

    const after = (await db.booking.findUnique({ where: { id: original.id } }))!;
    expect(after.status).toBe("BOOKED");
    const oldDate = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/London", weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    }).format(original.startTime);
    expect(after.notes).toBe(`Called twice, no answer\n\nRescheduled from ${oldDate} (Europe/London), was No-show`);
  });

  it("reschedule of any other status leaves the status and notes alone", async () => {
    put(event("L1", -4, "x@example.com"), invitee("L1", "L", "Lee Lane"));
    await sync();
    const original = (await row("L1", "L"))!;
    await db.booking.update({ where: { id: original.id }, data: { status: "NOT_QUALIFIED", notes: null } });
    put(event("L2", 8, "x@example.com"), invitee("L2", "L2", "Lee Lane", { old_invitee: original.inviteeUri }));
    await sync();
    expect(await db.booking.findUnique({ where: { id: original.id } })).toMatchObject({ status: "NOT_QUALIFIED", notes: null });
  });

  it("reschedule whose original was never synced: one row, and the original is ignored later", async () => {
    const count = await db.booking.count();
    put(event("E5", 4, "x@example.com"), invitee("E5", "F2", "Frankie Fox", { old_invitee: inviteeUri("E9", "F1") }));
    await sync();
    expect(await db.booking.count()).toBe(count + 1);
    put(event("E9", 1, "x@example.com"), invitee("E9", "F1", "Frankie Fox", { status: "canceled", rescheduled: true }));
    await sync();
    expect(await db.booking.count()).toBe(count + 1);
  });

  it("webhook order: the old invitee's cancel arrives before the new one's create", async () => {
    const reps = await loadRepEmails(db);
    const gEvent = event("G", 5, "x@example.com");
    const g1 = invitee("G", "G1", "Gale Grant");
    await saveInvitee(db, normalizeInvitee(gEvent, g1), reps);
    const original = (await row("G", "G1"))!;
    await saveInvitee(db, normalizeInvitee(gEvent, { ...g1, status: "canceled", rescheduled: true }), reps);
    expect((await db.booking.findUnique({ where: { id: original.id } }))?.canceledAt).not.toBeNull();
    await saveInvitee(db, normalizeInvitee(event("H", 7, "x@example.com"), invitee("H", "G2", "Gale Grant", { old_invitee: g1.uri })), reps);
    expect(await db.booking.findUnique({ where: { id: original.id } })).toMatchObject({ inviteeUri: inviteeUri("H", "G2"), canceledAt: null });
    expect(await saveInvitee(db, normalizeInvitee(gEvent, { ...g1, status: "canceled", rescheduled: true }), reps)).toBe("skipped");
  });

  it("retries after a 429 rate limit", async () => {
    state.rateLimitOnce.add("/scheduled_events/E2/invitees");
    expect(await sync()).toMatchObject({ status: "ok" });
  });

  it("refuses to follow a paging link off api.calendly.com (keeps the token safe)", async () => {
    state.badNextPage = true;
    const result = await sync();
    state.badNextPage = false;
    expect(result.status).toBe("error");
    expect(state.calls.some((c) => c.startsWith("https://evil.example"))).toBe(false);
  });

  it("rejected token: clear error, logged, nothing touched, token never shown", async () => {
    const count = await db.booking.count();
    state.rejectToken = true;
    const result = await sync();
    state.rejectToken = false;
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).toMatch(/rejected the token/);
    expect(JSON.stringify(result)).not.toContain(TOKEN);
    const run = await db.syncRun.findFirst({ orderBy: { startedAt: "desc" } });
    expect(run?.status).toBe("error");
    expect(run?.error ?? "").not.toContain(TOKEN);
    expect(await db.booking.count()).toBe(count);
  });

  it("one sync at a time; a stuck run stops blocking after 10 minutes", async () => {
    const stuck = await db.syncRun.create({ data: { source: "cron", status: "running" } });
    expect((await sync()).status).toBe("skipped");
    await db.syncRun.update({ where: { id: stuck.id }, data: { startedAt: new Date(now.getTime() - 11 * 60_000) } });
    expect((await sync()).status).toBe("ok");
  });

  describe("webhook endpoint", () => {
    const KEY = "whsec-test-key";
    const sign = (body: string) => {
      const t = Math.floor(Date.now() / 1000);
      return `t=${t},v1=${createHmac("sha256", KEY).update(`${t}.${body}`).digest("hex")}`;
    };
    const deliver = (body: string) =>
      webhookPOST(new Request("http://localhost/api/webhooks/calendly", { method: "POST", body, headers: { "calendly-webhook-signature": sign(body) } }));
    const payload = (eventName: string, extra = {}) =>
      JSON.stringify({ event: eventName, payload: { ...invitee("W1", "WI1", "Webhook Person", extra), scheduled_event: event("W1", 3, "x@example.com") } });

    it("saves a signed invitee.created, and a repeat delivery doesn't duplicate", async () => {
      process.env.CALENDLY_WEBHOOK_SIGNING_KEY = KEY;
      let response = await deliver(payload("invitee.created"));
      expect(await response.json()).toMatchObject({ ok: true, outcome: "created" });
      response = await deliver(payload("invitee.created"));
      expect(await response.json()).toMatchObject({ ok: true, outcome: "updated" });
      expect(await db.booking.count({ where: { inviteeEmail: "webhook.person@example.com" } })).toBe(1);
    });

    it("records invitee.canceled with its reason", async () => {
      process.env.CALENDLY_WEBHOOK_SIGNING_KEY = KEY;
      await deliver(payload("invitee.canceled", { status: "canceled", cancellation: { reason: "Travel", canceled_by: "Webhook Person" } }));
      expect(await row("W1", "WI1")).toMatchObject({ cancelReason: "Travel", canceledBy: "Webhook Person" });
    });
  });

  it("no token: sync is skipped and nothing is touched", async () => {
    delete process.env.CALENDLY_TOKEN;
    const count = await db.booking.count();
    expect((await sync()).status).toBe("skipped");
    expect(await db.booking.count()).toBe(count);
  });
});
