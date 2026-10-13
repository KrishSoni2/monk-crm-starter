# BUILD: Sales Dashboard (Calendly)

> This is the build doc for the first module in this CRM. It's also the template for
> your own modules: copy its headings, fill them in for your idea, and hand it to
> Claude Code or Codex along with `docs/ADDING-A-MODULE.md`.

---

## 1. Goal

**The problem.** Sales calls get booked through Calendly, but there's no single place to
manage them. The sales lead can't easily see who was called, who picked up, what time
of day people answer, who's qualified (and why not), or how each meeting ended.

**The outcome.** One screen where the team sees every booking, works it from "Booked"
to "Closed" or "Lost", logs every call attempt, and sees at a glance how the pipeline
is doing.

**Who uses it.** The sales lead (oversight, stats, assigning reps) and sales reps
(working their bookings, logging calls, adding notes).

**Done means:**
- A fresh clone with only a database runs on realistic demo data.
- With a Calendly token added, real bookings show up within 15 minutes (or instantly
  with webhooks on a paid plan), and syncing twice never creates a duplicate.
- Every change (status, rep, qualified, notes, call attempt) shows on screen instantly
  and saves in the background.

---

## 2. Data model

Four tables. Every Calendly field we store is copied onto the booking so the screen
never has to call Calendly to render.

### Rep
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| email | string, unique | Matched against the Calendly host email to auto-assign bookings |
| color | string | One of a fixed set of soft colors (dot next to the rep's name) |
| isDemo | boolean | True for seeded reps, so they're removed when real data arrives |

### Booking (one row per Calendly invitee)
| Field | Type | Notes |
|---|---|---|
| id | string | |
| inviteeUri | string, **unique** | Calendly's invitee URI. **The dedupe key**: sync and webhooks both upsert on it |
| previousInviteeUris | string[] | Old invitee URIs this booking was rescheduled from (see "Reschedules") |
| eventUri | string | Calendly scheduled event URI |
| eventTypeName | string | e.g. "Discovery Call" |
| inviteeName, inviteeEmail | string | |
| inviteePhone | string? | From the SMS reminder number or a "phone" question |
| inviteeTimeZone | string? | IANA name, e.g. `Europe/London` |
| hostEmail | string? | Calendly host, used to auto-assign a rep |
| startTime, endTime | datetime | Stored in UTC |
| locationType | string? | zoom, google_conference, phone, etc. |
| joinUrl | string? | Video link, if any |
| rescheduleUrl, cancelUrl | string? | Calendly's own links for the invitee |
| questions | json | Booking form answers: `[{ question, answer }]` |
| canceledAt | datetime? | Set when Calendly reports a cancellation |
| cancelReason, canceledBy | string? | |
| status | enum | `BOOKED`, `SHOWED`, `NO_SHOW`, `NOT_QUALIFIED`, `CLOSED`, `LOST`. Default `BOOKED` |
| qualified | boolean? | null = not decided yet |
| qualifiedReason | string? | Why (or why not) |
| notes | string? | Free text |
| repId | string? | Assigned rep |
| source | enum | `CALENDLY` or `DEMO` |
| calendlyRaw | json? | The last raw payload, for debugging and future fields |
| createdAt, updatedAt | datetime | |

### CallAttempt
| Field | Type | Notes |
|---|---|---|
| id | string | |
| bookingId | string | Cascade-deletes with the booking |
| attemptedAt | datetime | Defaults to now; editable |
| answered | boolean | |
| note | string? | |
| repId | string? | Who made the call |

### SyncRun
| Field | Type | Notes |
|---|---|---|
| id | string | |
| source | string | `manual`, `cron` or `webhook` |
| startedAt, finishedAt | datetime | |
| status | string | `running`, `ok`, `error` |
| created, updated, skipped | int | Counts |
| error | string? | Short message, never a secret |

### Rules the data follows
- **Cancel is not a status.** A canceled booking keeps whatever status it had and gets
  `canceledAt` + reason. It's shown with a "Canceled" tag and is excluded from stats.
- **Calendly owns Calendly fields; the team owns CRM fields.** Sync overwrites times,
  links, answers and cancel info. It never touches status, rep, qualified, notes or
  call attempts.
- **Reschedules keep the history.** When Calendly reschedules, the new invitee points
  at the old one (`old_invitee`). We move the existing booking to the new invitee URI
  and push the old URI into `previousInviteeUris`, so the rep, notes and call attempts
  carry over. The old invitee is then ignored on every later sync.

---

## 3. Screens

### Sales (`/sales`)
- **Header:** title, view switch (Table / Board), "Sync now" button (the one accent
  button on the page) with "Last synced 4 min ago" next to it. A "Demo data" badge
  shows when no Calendly token is set.
- **Filters:** date range (This week, Last 30 days, All time) and rep (All reps or one).
  Filters apply to the stats, the list and the chart.
- **Stats row:** Total bookings, No-shows, Closed, Lost, Close rate.
  - Total bookings = non-canceled bookings in range.
  - Close rate = Closed / Showed, where Showed = Showed + Closed + Lost.
  - Each card says how it's calculated in a small subtitle, e.g. the Close rate card
    reads "Closed ÷ showed (showed + closed + lost)", so the number is never ambiguous.
- **Table view:** 48px rows, sticky first column (invitee name), scrolls sideways
  instead of squeezing. Columns: Invitee, Start time, Event type, Rep, Status,
  Qualified, Call attempts, Time zone.
- **Board view:** six columns: Booked, Showed, No-show, Not qualified, Closed, Lost.
  Drag a card to change its status. Cards show name, time, rep dot, attempt count.
- **Call attempts by hour:** bar chart, 24 hours, answered vs not answered, so the team
  sees when people pick up. Hours are shown in the invitee's local time by default,
  with a toggle for "My time".

### Booking side panel (slides in from the right, from either view)
- Invitee name, email, phone, event type, start time.
- Time zones side by side: "Their time 9:00 AM (Europe/London)" and
  "Your time 4:00 AM (America/New_York)".
- Buttons: **Join call** (if there's a join link) and **Reschedule** (Calendly
  reschedule link).
- Cancel status and reason, if canceled.
- Assign rep (dropdown), Status (dropdown, same as dragging on the board).
- Qualified: Yes / No / Not yet, plus a reason.
- Call attempts log: list of (time, answered yes/no, note) plus a quick "Log a call"
  form that defaults to now.
- Booking form answers (question and answer pairs).
- Notes (saves as you type, debounced).

### Settings (`/settings`)
- **Sales reps:** add (name, email, color), remove. Removing a rep unassigns their
  bookings; it doesn't delete them.
- **Calendly connection:** shows whether the token and webhook key are set (never their
  values), last sync result, and links to `docs/CONNECTIONS.md`.

### Login (`/login`)
- One password field. Correct `APP_PASSWORD` sets a session cookie.

---

## 4. Integrations

### Calendly polling (default, works on the free plan)
- Env: `CALENDLY_TOKEN` (personal access token).
- Steps: `GET /users/me` to get the user (and organization) URI, then
  `GET /scheduled_events` for 60 days back to 60 days ahead, all statuses, paging with
  `page_token`. For each event, `GET /scheduled_events/{uuid}/invitees`. Each
  invitee is normalized and **upserted by invitee URI**.
- Team accounts: tries organization scope first so every host's events come in, and
  falls back to the token owner's events if the token can't read the organization.
- Auto-assign: if a booking has no rep and its Calendly host email matches a rep's
  email, it's assigned to that rep.
- Triggers: "Sync now" button, and `POST /api/sync` with
  `Authorization: Bearer <SYNC_SECRET>` (called by a Railway cron every 15 minutes).
- Only one sync runs at a time; a sync stuck for over 10 minutes is treated as dead.
- The first real sync deletes **only rows flagged as demo data** (`source = DEMO`
  bookings and `isDemo` reps, plus their call attempts). It never touches anything else.

### Calendly webhooks (optional, paid Calendly plans only)
- Env: `CALENDLY_WEBHOOK_SIGNING_KEY`. If not set, `/api/webhooks/calendly` returns
  404 and nothing else changes.
- Events: `invitee.created`, `invitee.canceled`.
- Signature check: header `Calendly-Webhook-Signature: t=<timestamp>,v1=<hmac>`.
  Recompute HMAC-SHA256 of `"<t>.<raw body>"` with the signing key, compare in
  constant time, and reject anything older than 3 minutes. Always enforced, in every
  environment.
- The webhook goes through exactly the same normalize + upsert code as polling, so
  both paths produce identical rows.
- `npm run calendly:webhook` registers the subscription (and lists or deletes
  existing ones) using `CALENDLY_TOKEN`, `APP_URL` and the signing key.

### Demo mode
- On when `CALENDLY_TOKEN` is missing. If the database has no bookings, about 40 demo
  bookings across 3 fictional reps are created automatically: every status, mixed
  time zones, cancellations, booking answers and call attempts. Dates are relative to
  today, so "This week" always has data. Every seeded row is flagged as demo data.
- "Sync now" explains what to set instead of failing.

### App password and health
- `APP_PASSWORD` gates every page and server action.
  - Not set, running locally: the app is open, with a warning banner saying so.
  - Not set, in production: every page shows a "Set APP_PASSWORD" screen with
    instructions, and nothing else works until it's set. `/api/health`, `/api/sync`
  (own secret) and `/api/webhooks/calendly` (own signature) are open.
- `/api/health` returns `{ ok: true }` without touching the database, so Railway's
  healthcheck only checks that the server is up.

---

## 5. Out of scope (for this module)

- Creating, rescheduling or canceling bookings from inside the CRM (we link to
  Calendly's own pages).
- Marking no-shows back in Calendly.
- Email or SMS sending, reminders, sequences.
- Per-user logins, roles or permissions (one shared password).
- Deals, invoices, revenue amounts.
- Routing forms, round-robin logic, multiple Calendly accounts.
- Importing history older than 60 days.
