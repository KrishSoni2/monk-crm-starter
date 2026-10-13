/* ============================================================
 * CONNECTION: PostgreSQL (writes Calendly data into bookings)
 * Required:   Yes (DATABASE_URL)
 * Env vars:   DATABASE_URL
 * Get it:     Railway > Postgres > Variables
 * Plan:       Railway usage-based pricing
 * If missing: Sync and webhooks fail with a clear error.
 * Docs:       docs/CONNECTIONS.md#railway-postgres
 * ============================================================ */
// AI-GUIDE: The save rules for Calendly data. Change these carefully: they decide what
// sync may overwrite. Any change here needs a test in tests/calendly-sync.db.test.ts.
// Saves Calendly data into the database. Used by BOTH the polling sync and the webhook,
// so every booking is saved the same way.
//
// The rules (see BUILD.md "Rules the data follows"):
// - One row per Calendly invitee, keyed by invitee URI. Saving twice never duplicates.
// - Only Calendly-owned fields are written. Status, qualified, notes and call attempts
//   belong to the team and are never touched. The rep is set only if it's empty and the
//   Calendly host email matches a rep.
// - Reschedule: the new invitee points at the old one. The existing row moves to the
//   new invitee URI (keeping rep, notes and calls) and remembers the old URI, which is
//   then ignored forever.
// - The one exception to "never touch team fields": a booking in No-show that gets
//   rescheduled goes back to Booked, with a note saying so. Any other status stays.
import type { PrismaClient } from "@/generated/prisma/client";
import type { NormalizedInvitee } from "@/modules/sales/integrations/calendly/normalize";

// e.g. "Tue, Oct 6, 2026, 10:00 AM (America/New_York)". Uses the invitee's time zone
// when we know it, so the note reads the same for everyone.
function formatOldDate(date: Date, timeZone: string | null) {
  const zone = timeZone ?? "UTC";
  const text = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${text} (${zone})`;
}

export type SaveOutcome = "created" | "updated" | "skipped";

/** Rep ids by lowercase email, for auto-assigning bookings. */
export async function loadRepEmails(db: PrismaClient) {
  const reps = await db.rep.findMany({ select: { id: true, email: true } });
  return new Map(reps.map((r) => [r.email.toLowerCase(), r.id]));
}

export async function saveInvitee(
  db: PrismaClient,
  invitee: NormalizedInvitee,
  repByEmail: Map<string, string>,
): Promise<SaveOutcome> {
  const { inviteeUri, oldInviteeUri, fields } = invitee;
  const autoRepId = fields.hostEmail ? (repByEmail.get(fields.hostEmail) ?? null) : null;

  // An old invitee left behind by a reschedule that we've already moved on from.
  const replaced = await db.booking.findFirst({
    where: { previousInviteeUris: { has: inviteeUri } },
    select: { id: true },
  });
  if (replaced) return "skipped";

  const existing = await db.booking.findUnique({ where: { inviteeUri }, select: { id: true, repId: true } });

  if (!existing && oldInviteeUri) {
    const previous = await db.booking.findUnique({
      where: { inviteeUri: oldInviteeUri },
      select: { id: true, repId: true, status: true, notes: true, startTime: true, inviteeTimeZone: true },
    });
    if (previous) {
      // They didn't show, then booked a new time: back to Booked, and say why in the notes.
      const wasNoShow = previous.status === "NO_SHOW";
      const note = `Rescheduled from ${formatOldDate(previous.startTime, previous.inviteeTimeZone)}, was No-show`;
      await db.booking.update({
        where: { id: previous.id },
        data: {
          ...fields,
          inviteeUri,
          previousInviteeUris: { push: oldInviteeUri },
          repId: previous.repId ?? autoRepId,
          ...(wasNoShow ? { status: "BOOKED", notes: previous.notes ? `${previous.notes}\n\n${note}` : note } : {}),
        },
      });
      return "updated";
    }
  }

  if (existing) {
    await db.booking.update({
      where: { id: existing.id },
      data: { ...fields, ...(existing.repId === null && autoRepId ? { repId: autoRepId } : {}) },
    });
    return "updated";
  }

  try {
    await db.booking.create({
      data: {
        ...fields,
        inviteeUri,
        repId: autoRepId,
        source: "CALENDLY",
        // A reschedule whose original we never saw: remember the old URI so it's ignored.
        previousInviteeUris: oldInviteeUri ? [oldInviteeUri] : [],
      },
    });
    return "created";
  } catch (error) {
    // A webhook and a sync saved the same new invitee at the same moment: update instead.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      await db.booking.update({ where: { inviteeUri }, data: fields });
      return "updated";
    }
    throw error;
  }
}

/**
 * Removes the demo data once real Calendly data is coming in. Deletes ONLY rows flagged
 * as demo (Booking.source = DEMO, Rep.isDemo = true); their call attempts go with them.
 * Nothing else is ever deleted here.
 */
export async function removeDemoData(db: PrismaClient) {
  const [bookings, reps] = await db.$transaction([
    db.booking.deleteMany({ where: { source: "DEMO" } }),
    db.rep.deleteMany({ where: { isDemo: true } }),
  ]);
  return { bookings: bookings.count, reps: reps.count };
}
