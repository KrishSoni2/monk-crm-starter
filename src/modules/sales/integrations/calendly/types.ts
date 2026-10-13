// The parts of Calendly's API responses this app reads. Calendly sends more fields;
// the full payload is kept in Booking.calendlyRaw if you need one later.
// Reference: https://developer.calendly.com/api-docs

export type CalendlyUser = {
  uri: string;
  name: string;
  email: string;
  current_organization: string;
};

export type CalendlyCancellation = {
  canceled_by?: string | null;
  reason?: string | null;
  canceler_type?: string | null;
  created_at?: string | null;
};

export type CalendlyEvent = {
  uri: string;
  name?: string | null;
  status: "active" | "canceled";
  start_time: string;
  end_time: string;
  location?: { type?: string | null; join_url?: string | null; location?: string | null } | null;
  event_memberships?: { user?: string; user_email?: string | null; user_name?: string | null }[];
  cancellation?: CalendlyCancellation | null;
};

export type CalendlyInvitee = {
  uri: string;
  name: string;
  email: string;
  status: "active" | "canceled";
  timezone?: string | null;
  questions_and_answers?: { question: string; answer: string; position?: number }[] | null;
  text_reminder_number?: string | null;
  reschedule_url?: string | null;
  cancel_url?: string | null;
  rescheduled?: boolean | null;
  old_invitee?: string | null;
  new_invitee?: string | null;
  cancellation?: CalendlyCancellation | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** A webhook delivers the invitee with its event nested inside. */
export type CalendlyWebhookBody = {
  event: "invitee.created" | "invitee.canceled" | string;
  created_at?: string;
  payload: CalendlyInvitee & { scheduled_event: CalendlyEvent };
};
