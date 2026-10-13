/* ============================================================
 * CONNECTION: Calendly sync (polling, works on the free plan)
 * Required:   Optional (app runs in demo mode without it)
 * Env vars:   CALENDLY_TOKEN (and SYNC_SECRET for the cron endpoint)
 * Get it:     Calendly > Integrations & apps > API & webhooks
 *             > Personal access tokens
 * Plan:       Free plan works.
 * If missing: Sync is skipped and the app stays on demo data.
 * Docs:       docs/CONNECTIONS.md#calendly
 * ============================================================ */
// AI-GUIDE: The Calendly sync. Runs on "Sync now", on the 15-minute cron (/api/sync),
// and shares its save logic with the webhook (store.ts).
// How it works:
//   1. GET /users/me with the token.
//   2. List scheduled events from 60 days ago to 60 days ahead. Tries the whole
//      organization first (team accounts), falls back to the token owner's events.
//   3. List each event's invitees and save each one (store.ts saveInvitee).
//   4. Record the run in SyncRun (shown as "Last synced" and on Settings).
// To change the window, edit WINDOW_DAYS. To read a new Calendly field, add it in
// normalize.ts and the Prisma schema; nothing else here needs to change.
// Safe to run twice: rows are keyed by invitee URI, so nothing duplicates.
import type { PrismaClient } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { CalendlyError, createCalendlyClient } from "@/modules/sales/integrations/calendly/client";
import { normalizeInvitee, type NormalizedInvitee } from "@/modules/sales/integrations/calendly/normalize";
import { loadRepEmails, removeDemoData, saveInvitee } from "@/modules/sales/integrations/calendly/store";
import type { CalendlyEvent } from "@/modules/sales/integrations/calendly/types";

const WINDOW_DAYS = 60;
const DAY = 24 * 60 * 60 * 1000;
// A run still marked "running" after this long died part-way (e.g. a redeploy), so it
// no longer blocks new runs.
const STALE_RUN_MS = 10 * 60 * 1000;
// How many events' invitees to fetch from Calendly at once. Kept low to stay well inside rate limits.
const CONCURRENCY = 4;

export type SyncSource = "manual" | "cron" | "webhook";

export type SyncResult =
  | { status: "ok" | "partial"; created: number; updated: number; skipped: number; events: number; errors: string[] }
  | { status: "skipped"; reason: string }
  | { status: "error"; error: string };

type Options = { source: SyncSource; db?: PrismaClient; fetchImpl?: typeof fetch; now?: Date };

async function inBatches<T>(items: T[], size: number, work: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(work));
}

export async function runSync({ source, db = getDb(), fetchImpl, now = new Date() }: Options): Promise<SyncResult> {
  const token = env.calendlyToken();
  if (!token) return { status: "skipped", reason: "CALENDLY_TOKEN is not set, so the app is using demo data." };

  const running = await db.syncRun.findFirst({
    where: { status: "running", source: { not: "webhook" }, startedAt: { gt: new Date(now.getTime() - STALE_RUN_MS) } },
  });
  if (running) return { status: "skipped", reason: "A sync is already running. Try again in a minute." };

  const run = await db.syncRun.create({ data: { source, status: "running" } });
  const counts = { created: 0, updated: 0, skipped: 0 };
  const errors: string[] = [];

  try {
    const calendly = createCalendlyClient(token, fetchImpl);
    const me = await calendly.getCurrentUser();
    const from = new Date(now.getTime() - WINDOW_DAYS * DAY);
    const to = new Date(now.getTime() + WINDOW_DAYS * DAY);

    let events: CalendlyEvent[];
    try {
      events = await calendly.listScheduledEvents({ organization: me.current_organization }, from, to);
    } catch (error) {
      // Not an organization admin (or a solo account): read the token owner's events.
      if (!(error instanceof CalendlyError && error.status === 403)) throw error;
      events = await calendly.listScheduledEvents({ user: me.uri }, from, to);
    }

    // The token works and real data is here, so the demo data goes (demo rows only).
    await removeDemoData(db);
    const repByEmail = await loadRepEmails(db);

    // Fetch invitees a few events at a time...
    const found: NormalizedInvitee[] = [];
    await inBatches(events, CONCURRENCY, async (event) => {
      try {
        for (const invitee of await calendly.listInvitees(event.uri)) found.push(normalizeInvitee(event, invitee));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Unknown error");
      }
    });
    // ...then save one at a time: plain bookings first, reschedules last, so a
    // rescheduled booking always finds the original row to move.
    found.sort((a, b) => Number(Boolean(a.oldInviteeUri)) - Number(Boolean(b.oldInviteeUri)));
    for (const invitee of found) {
      try {
        counts[await saveInvitee(db, invitee, repByEmail)]++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Unknown error");
      }
    }

    const status = errors.length > 0 ? "partial" : "ok";
    await db.syncRun.update({
      where: { id: run.id },
      data: {
        status,
        finishedAt: new Date(),
        ...counts,
        error: errors.length ? `${errors.length} event(s) failed: ${errors[0]}`.slice(0, 500) : null,
      },
    });
    return { status, ...counts, events: events.length, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db.syncRun.update({
      where: { id: run.id },
      data: { status: "error", finishedAt: new Date(), ...counts, error: message.slice(0, 500) },
    });
    return { status: "error", error: message };
  }
}

/** The most recent finished run, for "Last synced" and the Settings page. */
export async function getLastSyncRun(db: PrismaClient = getDb()) {
  return db.syncRun.findFirst({ where: { finishedAt: { not: null } }, orderBy: { finishedAt: "desc" } });
}
