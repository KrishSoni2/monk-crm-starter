// Turns one Calendly event + one invitee into the Calendly-owned fields of a Booking.
// Pure function: no database, no network. Polling and webhooks both go through this,
// so a booking looks the same however it arrived.
import type { CalendlyEvent, CalendlyInvitee } from "@/modules/sales/integrations/calendly/types";
import type { BookingQuestion } from "@/modules/sales/types";

export type NormalizedInvitee = {
  inviteeUri: string;
  /** Set when this invitee replaced an earlier one (a reschedule). */
  oldInviteeUri: string | null;
  /** True for the old invitee left behind by a reschedule. */
  rescheduledAway: boolean;
  fields: {
    eventUri: string;
    eventTypeName: string | null;
    inviteeName: string;
    inviteeEmail: string;
    inviteePhone: string | null;
    inviteeTimeZone: string | null;
    hostEmail: string | null;
    startTime: Date;
    endTime: Date;
    locationType: string | null;
    joinUrl: string | null;
    rescheduleUrl: string | null;
    cancelUrl: string | null;
    questions: BookingQuestion[];
    canceledAt: Date | null;
    cancelReason: string | null;
    canceledBy: string | null;
    calendlyRaw: { event: CalendlyEvent; invitee: CalendlyInvitee };
  };
};

const isHttpUrl = (value: string | null | undefined) => (value && /^https?:\/\//i.test(value) ? value : null);

function findPhone(invitee: CalendlyInvitee): string | null {
  if (invitee.text_reminder_number) return invitee.text_reminder_number;
  const answer = invitee.questions_and_answers?.find((q) => /phone|mobile|cell/i.test(q.question))?.answer;
  return answer?.trim() || null;
}

export function normalizeInvitee(event: CalendlyEvent, invitee: CalendlyInvitee): NormalizedInvitee {
  // An invitee counts as canceled if they canceled, or the host canceled the whole event.
  const inviteeCanceled = invitee.status === "canceled";
  const eventCanceled = event.status === "canceled";
  const cancellation = inviteeCanceled ? invitee.cancellation : eventCanceled ? event.cancellation : null;
  const canceled = inviteeCanceled || eventCanceled;
  const canceledAtText = cancellation?.created_at ?? (canceled ? invitee.updated_at : null);

  const questions = [...(invitee.questions_and_answers ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((q) => ({ question: q.question, answer: q.answer ?? "" }));

  return {
    inviteeUri: invitee.uri,
    oldInviteeUri: invitee.old_invitee ?? null,
    rescheduledAway: Boolean(invitee.rescheduled),
    fields: {
      eventUri: event.uri,
      eventTypeName: event.name ?? null,
      inviteeName: invitee.name?.trim() || invitee.email,
      inviteeEmail: invitee.email.trim().toLowerCase(),
      inviteePhone: findPhone(invitee),
      inviteeTimeZone: invitee.timezone ?? null,
      hostEmail: event.event_memberships?.[0]?.user_email?.toLowerCase() ?? null,
      startTime: new Date(event.start_time),
      endTime: new Date(event.end_time),
      locationType: event.location?.type ?? null,
      joinUrl: isHttpUrl(event.location?.join_url) ?? isHttpUrl(event.location?.location),
      rescheduleUrl: isHttpUrl(invitee.reschedule_url),
      cancelUrl: isHttpUrl(invitee.cancel_url),
      questions,
      canceledAt: canceled ? new Date(canceledAtText ?? Date.now()) : null,
      cancelReason: canceled ? cancellation?.reason?.trim() || (invitee.rescheduled ? "Rescheduled" : null) : null,
      canceledBy: canceled ? cancellation?.canceled_by ?? null : null,
      calendlyRaw: { event, invitee },
    },
  };
}
