import type { BookingStatus } from "@/generated/prisma/enums";

// AI-GUIDE: Board columns. The board shows one column per entry, in this order, and
// dragging a card into a column sets that status. Labels are what users see.
// To add a column: add the status to the BookingStatus enum in prisma/schema.prisma,
// run a migration, then add it here. To rename one, change only the label.
export const BOARD_COLUMNS: { status: BookingStatus; label: string }[] = [
  { status: "BOOKED", label: "Booked" },
  { status: "SHOWED", label: "Showed" },
  { status: "NO_SHOW", label: "No-show" },
  { status: "NOT_QUALIFIED", label: "Not qualified" },
  { status: "CLOSED", label: "Closed" },
  { status: "LOST", label: "Lost" },
];

export const STATUS_LABELS = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.status, c.label])) as Record<
  BookingStatus,
  string
>;

// Rep colors are stored as one of these keys. The actual colors live in
// src/theme/theme.css (--rep-<key>) so they adapt to dark mode.
export const REP_COLORS = ["slate", "blue", "teal", "green", "amber", "orange", "pink", "violet"] as const;
export type RepColor = (typeof REP_COLORS)[number];

export const repColorVar = (color: string) =>
  `var(--rep-${(REP_COLORS as readonly string[]).includes(color) ? color : "slate"})`;

export type BookingQuestion = { question: string; answer: string };

export const BOOKING_STATUSES = BOARD_COLUMNS.map((c) => c.status);

// What the browser receives: plain JSON (dates as ISO strings), shaped for the UI.
export type CallAttemptRow = {
  id: string;
  attemptedAt: string;
  answered: boolean;
  note: string | null;
  repId: string | null;
};

export type BookingRow = {
  id: string;
  eventTypeName: string | null;
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone: string | null;
  inviteeTimeZone: string | null;
  startTime: string;
  endTime: string;
  locationType: string | null;
  joinUrl: string | null;
  rescheduleUrl: string | null;
  questions: BookingQuestion[];
  canceledAt: string | null;
  cancelReason: string | null;
  canceledBy: string | null;
  status: BookingStatus;
  qualified: boolean | null;
  qualifiedReason: string | null;
  notes: string | null;
  repId: string | null;
  isDemo: boolean;
  callAttempts: CallAttemptRow[];
};

export type RepRow = {
  id: string;
  name: string;
  email: string;
  color: string;
  bookingCount: number;
};

// The fields the team can change on a booking. Sync never touches these.
export type BookingPatch = Partial<Pick<BookingRow, "status" | "repId" | "qualified" | "qualifiedReason" | "notes">>;

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
