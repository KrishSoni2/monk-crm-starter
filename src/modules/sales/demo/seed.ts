// AI-GUIDE: Demo data. Change the lists below to make the demo look like your business.
// Keep everything fictional (example.com emails, 555-01xx numbers) and keep the demo
// flags (source: "DEMO", isDemo: true): the first real sync deletes rows by those flags.
// To see your changes, empty the database (or delete all bookings) and reload.
// Demo data for the Sales module. Used when CALENDLY_TOKEN is not set, so a fresh
// clone works with nothing but a database.
//
// Everything here is fictional: names are made up, emails use example.com, and
// phone numbers use the 555-01xx range reserved for fiction. Every row is flagged
// (Booking.source = DEMO, Rep.isDemo = true) so it can be removed safely later
// without touching real data.
import type { PrismaClient } from "@/generated/prisma/client";
import type { BookingStatus } from "@/generated/prisma/enums";
import { zonedTimeToUtc } from "@/lib/time";

const DAY = 24 * 60 * 60 * 1000;

// Small seeded random generator so the demo looks the same every time it's created.
function random(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEMO_REPS = [
  { id: "demo-rep-1", name: "Avery Stone", email: "avery.stone@example.com", color: "blue" },
  { id: "demo-rep-2", name: "Jordan Lee", email: "jordan.lee@example.com", color: "teal" },
  { id: "demo-rep-3", name: "Sam Rivera", email: "sam.rivera@example.com", color: "amber" },
];

const FIRST = ["Maya", "Theo", "Priya", "Lucas", "Hana", "Omar", "Elena", "Noah", "Ines", "Kofi", "Zoe", "Mateo", "Aiko", "Felix", "Leila", "Ravi", "Clara", "Diego", "Nadia", "Owen"];
const LAST = ["Brightwater", "Fairbanks", "Holloway", "Kestrel", "Marlowe", "Pennington", "Quill", "Ashdown", "Whitlock", "Yardley"];
const COMPANIES = ["Bluebird Bakery Co.", "Northwind Studio", "Copperleaf Dental", "Harbor & Pine Realty", "Lumen Fitness", "Saltmarsh Logistics", "Juniper Legal", "Brightpath Tutoring", "Oakline Builders", "Tidewater Clinic", "Fernhill Coffee", "Granite Peak Insurance"];
const TIME_ZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney", "America/Sao_Paulo"];
const EVENT_TYPES = [
  { name: "Discovery Call", minutes: 30 },
  { name: "Strategy Session", minutes: 45 },
  { name: "AI Readiness Review", minutes: 60 },
];
const TOPICS = [
  "We spend hours every week copying data between our booking system and spreadsheets.",
  "Looking for help writing proposals faster with AI.",
  "Want to automate our customer support inbox.",
  "Our team keeps asking about AI tools and we don't know where to start.",
  "Need a chatbot for our website that actually knows our services.",
  "Interested in automating invoicing and follow-ups.",
];
const QUALIFIED_REASONS = ["Clear problem and budget approved", "Decision maker, wants to start this month", "Strong fit, team of 15 ready to adopt"];
const NOT_QUALIFIED_REASONS = ["Budget below our minimum", "Looking for a full-time hire, not a consultant", "Too early, just researching", "Needs a service we don't offer"];
const LOST_NOTES = ["Went with a cheaper option.", "Decided to wait until next quarter.", "Chose to build it in-house."];
const CANCEL_REASONS = ["Schedule conflict, will rebook next week", "Project put on hold", "Found another provider"];

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)];
}

// People answer more mid-morning and late afternoon. This makes the
// "call attempts by hour" chart show a realistic pattern.
const ANSWER_RATE_BY_HOUR: Record<number, number> = { 8: 0.2, 9: 0.55, 10: 0.7, 11: 0.6, 12: 0.25, 13: 0.3, 14: 0.45, 15: 0.5, 16: 0.65, 17: 0.55, 18: 0.25 };
const CALL_HOURS = Object.keys(ANSWER_RATE_BY_HOUR).map(Number);

function statusForPastBooking(rand: () => number): BookingStatus {
  const r = rand();
  if (r < 0.18) return "NO_SHOW";
  if (r < 0.32) return "NOT_QUALIFIED";
  if (r < 0.58) return "CLOSED";
  if (r < 0.76) return "LOST";
  return "SHOWED";
}

export function buildDemoData(now = new Date()) {
  const rand = random(42);
  const bookings = [];
  const callAttempts = [];
  const total = 40;

  for (let i = 0; i < total; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 7) % LAST.length];
    const company = COMPANIES[i % COMPANIES.length];
    const timeZone = TIME_ZONES[(i * 3) % TIME_ZONES.length];
    const eventType = pick(rand, EVENT_TYPES);

    // Spread meetings from ~45 days ago to ~14 days ahead, so each date filter shows
    // something different. Start times land on US business hours.
    const dayOffset = Math.round(-45 + (59 * i) / (total - 1) + (rand() - 0.5) * 2);
    const day = new Date(now.getTime() + dayOffset * DAY);
    const start = new Date(
      Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 14 + Math.floor(rand() * 8), rand() < 0.5 ? 0 : 30),
    );
    const end = new Date(start.getTime() + eventType.minutes * 60 * 1000);
    const isPast = end < now;

    const rep = i % 9 === 4 && !isPast ? null : DEMO_REPS[i % DEMO_REPS.length];
    let status: BookingStatus = isPast ? statusForPastBooking(rand) : "BOOKED";
    const canceled = i % 11 === 6;
    if (canceled) status = "BOOKED";

    let qualified: boolean | null = null;
    let qualifiedReason: string | null = null;
    if (status === "CLOSED" || status === "LOST" || status === "SHOWED") {
      qualified = true;
      qualifiedReason = pick(rand, QUALIFIED_REASONS);
    } else if (status === "NOT_QUALIFIED") {
      qualified = false;
      qualifiedReason = pick(rand, NOT_QUALIFIED_REASONS);
    }

    const id = `demo-booking-${i + 1}`;
    const slug = `${first}.${last}`.toLowerCase();
    bookings.push({
      id,
      inviteeUri: `demo:invitee:${i + 1}`,
      eventUri: `demo:event:${i + 1}`,
      eventTypeName: eventType.name,
      inviteeName: `${first} ${last}`,
      inviteeEmail: `${slug}@example.com`,
      inviteePhone: `+1 555-01${String(i % 100).padStart(2, "0")}`,
      inviteeTimeZone: timeZone,
      hostEmail: rep?.email ?? null,
      startTime: start,
      endTime: end,
      locationType: "video",
      joinUrl: `https://meet.example.com/demo-${i + 1}`,
      rescheduleUrl: `https://example.com/reschedule/demo-${i + 1}`,
      cancelUrl: `https://example.com/cancel/demo-${i + 1}`,
      questions: [
        { question: "Company name", answer: company },
        { question: "What would you like to talk about?", answer: pick(rand, TOPICS) },
        { question: "How did you hear about us?", answer: pick(rand, ["Podcast", "Referral from a friend", "LinkedIn", "Google search"]) },
      ],
      canceledAt: canceled ? new Date(start.getTime() - 2 * DAY) : null,
      cancelReason: canceled ? pick(rand, CANCEL_REASONS) : null,
      canceledBy: canceled ? `${first} ${last}` : null,
      status,
      qualified,
      qualifiedReason,
      notes: status === "LOST" ? pick(rand, LOST_NOTES) : null,
      repId: rep?.id ?? null,
      source: "DEMO" as const,
    });

    // Call attempts: confirmation calls in the days before the meeting, plus follow-up
    // calls after a no-show. Stop after the first answered call.
    if (!rep || canceled) continue;
    const attempts = status === "NO_SHOW" ? 2 + Math.floor(rand() * 3) : Math.floor(rand() * 4);
    for (let a = 0; a < attempts; a++) {
      const baseDay = status === "NO_SHOW" ? new Date(start.getTime() + (a + 1) * DAY) : new Date(start.getTime() - (attempts - a) * DAY);
      if (baseDay > now) break;
      const localDate = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
        .format(baseDay)
        .split("-")
        .map(Number);
      const hour = pick(rand, CALL_HOURS);
      const attemptedAt = zonedTimeToUtc(localDate[0], localDate[1] - 1, localDate[2], hour, Math.floor(rand() * 60), timeZone);
      if (attemptedAt > now) break;
      const answered = rand() < ANSWER_RATE_BY_HOUR[hour] * (status === "NO_SHOW" ? 0.5 : 1);
      callAttempts.push({
        id: `${id}-call-${a + 1}`,
        bookingId: id,
        attemptedAt,
        answered,
        note: answered ? pick(rand, ["Confirmed the meeting.", "Spoke briefly, sending details by email.", "Answered, asked to move to next week."]) : pick(rand, ["Voicemail.", "No answer.", "Left a message."]),
        repId: rep.id,
      });
      if (answered) break;
    }
  }

  return { reps: DEMO_REPS.map((r) => ({ ...r, isDemo: true })), bookings, callAttempts };
}

// Creates the demo data if the database has no bookings yet. Safe to call on every
// page load: it does nothing once data exists, and fixed IDs + skipDuplicates mean two
// requests racing each other can't create doubles.
export async function ensureDemoData(db: PrismaClient) {
  if ((await db.booking.count()) > 0) return;
  const { reps, bookings, callAttempts } = buildDemoData();
  await db.$transaction([
    db.rep.createMany({ data: reps, skipDuplicates: true }),
    db.booking.createMany({ data: bookings, skipDuplicates: true }),
    db.callAttempt.createMany({ data: callAttempts, skipDuplicates: true }),
  ]);
}
