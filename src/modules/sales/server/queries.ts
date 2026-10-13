// Database reads for the Sales module. Each returns plain JSON-safe rows for the UI.
import { getDb } from "@/lib/db";
import { isDemoMode } from "@/lib/env";
import { ensureDemoData } from "@/modules/sales/demo/seed";
import type { BookingQuestion, BookingRow, RepRow } from "@/modules/sales/types";

// Called by Sales pages before reading. In demo mode it fills an empty database with
// fictional sample data; with a Calendly token set it does nothing.
export async function prepareSalesData() {
  if (isDemoMode()) await ensureDemoData(getDb());
}

function toQuestions(value: unknown): BookingQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q): q is BookingQuestion => typeof q?.question === "string")
    .map((q) => ({ question: q.question, answer: String(q.answer ?? "") }));
}

export async function listBookings(): Promise<BookingRow[]> {
  const rows = await getDb().booking.findMany({
    orderBy: { startTime: "desc" },
    include: { callAttempts: { orderBy: { attemptedAt: "desc" } } },
  });
  return rows.map((b) => ({
    id: b.id,
    eventTypeName: b.eventTypeName,
    inviteeName: b.inviteeName,
    inviteeEmail: b.inviteeEmail,
    inviteePhone: b.inviteePhone,
    inviteeTimeZone: b.inviteeTimeZone,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    locationType: b.locationType,
    joinUrl: b.joinUrl,
    rescheduleUrl: b.rescheduleUrl,
    questions: toQuestions(b.questions),
    canceledAt: b.canceledAt?.toISOString() ?? null,
    cancelReason: b.cancelReason,
    canceledBy: b.canceledBy,
    status: b.status,
    qualified: b.qualified,
    qualifiedReason: b.qualifiedReason,
    notes: b.notes,
    repId: b.repId,
    isDemo: b.source === "DEMO",
    callAttempts: b.callAttempts.map((c) => ({
      id: c.id,
      attemptedAt: c.attemptedAt.toISOString(),
      answered: c.answered,
      note: c.note,
      repId: c.repId,
    })),
  }));
}

export async function listReps(): Promise<RepRow[]> {
  const reps = await getDb().rep.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { bookings: true } } },
  });
  return reps.map((r) => ({ id: r.id, name: r.name, email: r.email, color: r.color, bookingCount: r._count.bookings }));
}
