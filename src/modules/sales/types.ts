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
