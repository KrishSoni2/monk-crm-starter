"use server";

// Server actions (writes) for the Sales module. The UI updates first and calls these
// in the background; if one returns ok: false, the UI puts the old value back.
//
// Rules for every action here:
// - Call requireSession() first (server actions can be called directly).
// - Validate input: never trust what the browser sends.
// - Return { ok, data } or { ok: false, error }. Don't throw: thrown errors become a
//   generic message in production and the UI can't explain what went wrong.
// - Only touch team-owned fields. Calendly-owned fields belong to the sync.
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { runSync } from "@/modules/sales/integrations/calendly/sync";
import {
  BOOKING_STATUSES,
  REP_COLORS,
  type ActionResult,
  type BookingPatch,
  type CallAttemptRow,
  type RepRow,
} from "@/modules/sales/types";

const MAX_SHORT = 500;
const MAX_NOTES = 10_000;

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

async function guard(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return "Your session expired. Refresh the page and sign in again.";
  }
}

function cleanText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new Error("Invalid text");
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`Keep it under ${max} characters`);
  return trimmed || null;
}

export async function updateBooking(id: string, patch: BookingPatch): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return fail(denied);

  const data: BookingPatch = {};
  try {
    if (patch.status !== undefined) {
      if (!BOOKING_STATUSES.includes(patch.status)) return fail("Unknown status");
      data.status = patch.status;
    }
    if (patch.repId !== undefined) {
      if (patch.repId !== null && typeof patch.repId !== "string") return fail("Invalid rep");
      data.repId = patch.repId;
    }
    if (patch.qualified !== undefined) {
      if (patch.qualified !== null && typeof patch.qualified !== "boolean") return fail("Invalid qualified value");
      data.qualified = patch.qualified;
    }
    if (patch.qualifiedReason !== undefined) data.qualifiedReason = cleanText(patch.qualifiedReason, MAX_SHORT);
    if (patch.notes !== undefined) data.notes = cleanText(patch.notes, MAX_NOTES);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid input");
  }

  try {
    await getDb().booking.update({ where: { id }, data });
    return { ok: true, data: undefined };
  } catch {
    return fail("Couldn't save that change.");
  }
}

export async function addCallAttempt(
  bookingId: string,
  input: { attemptedAt: string; answered: boolean; note: string | null; repId: string | null },
): Promise<ActionResult<CallAttemptRow>> {
  const denied = await guard();
  if (denied) return fail(denied);

  const attemptedAt = new Date(input.attemptedAt);
  if (Number.isNaN(attemptedAt.getTime())) return fail("Pick a valid date and time");
  if (typeof input.answered !== "boolean") return fail("Choose whether they answered");

  try {
    const note = cleanText(input.note, MAX_SHORT) ?? null;
    const created = await getDb().callAttempt.create({
      data: { bookingId, attemptedAt, answered: input.answered, note, repId: input.repId },
    });
    return {
      ok: true,
      data: {
        id: created.id,
        attemptedAt: created.attemptedAt.toISOString(),
        answered: created.answered,
        note: created.note,
        repId: created.repId,
      },
    };
  } catch (error) {
    return fail(error instanceof Error && error.message.startsWith("Keep") ? error.message : "Couldn't log that call.");
  }
}

export async function deleteCallAttempt(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return fail(denied);
  try {
    await getDb().callAttempt.delete({ where: { id } });
    return { ok: true, data: undefined };
  } catch {
    return fail("Couldn't remove that call.");
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createRep(input: { name: string; email: string; color: string }): Promise<ActionResult<RepRow>> {
  const denied = await guard();
  if (denied) return fail(denied);

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!name || name.length > 100) return fail("Add a name");
  if (!EMAIL_PATTERN.test(email) || email.length > 200) return fail("Add a valid email");
  if (!(REP_COLORS as readonly string[]).includes(input.color)) return fail("Pick a color");

  try {
    const rep = await getDb().rep.create({ data: { name, email, color: input.color } });
    return { ok: true, data: { id: rep.id, name: rep.name, email: rep.email, color: rep.color, bookingCount: 0 } };
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
    return fail(duplicate ? "A rep with that email already exists" : "Couldn't add that rep.");
  }
}

// Removing a rep unassigns their bookings and call attempts (the database sets
// repId to null). It never deletes bookings.
export async function deleteRep(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return fail(denied);
  try {
    await getDb().rep.delete({ where: { id } });
    return { ok: true, data: undefined };
  } catch {
    return fail("Couldn't remove that rep.");
  }
}

// "Sync now" button. In demo mode it explains what to set instead of failing.
export async function syncNow(): Promise<ActionResult<{ message: string }>> {
  const denied = await guard();
  if (denied) return fail(denied);
  const result = await runSync({ source: "manual" });
  if (result.status === "skipped") return fail(result.reason);
  if (result.status === "error") return fail(result.error);
  const parts = [`${result.created} new`, `${result.updated} updated`];
  if (result.errors.length) parts.push(`${result.errors.length} failed`);
  return { ok: true, data: { message: `Synced ${result.events} Calendly events: ${parts.join(", ")}.` } };
}
