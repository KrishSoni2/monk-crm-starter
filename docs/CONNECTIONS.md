# Connections

Everything this app connects to, what it costs, and what happens if it's missing.
Every file that uses one of these starts with a `CONNECTION:` banner pointing back here.

Values go in `.env` on your computer and in **Variables** on Railway. Never commit them,
never paste them into chats or screenshots. To make a random secret, run `npm run secret`.

| Connection | Required? | Env vars | Where to get it | Cost / plan | If it's missing |
|---|---|---|---|---|---|
| [Railway Postgres](#railway-postgres) | **Yes** | `DATABASE_URL` | Railway > Postgres service > Variables | Railway Hobby plan (usage-based, a few dollars a month for a small CRM) | The app shows "Connect a database to get started" |
| [Calendly token](#calendly) | Optional | `CALENDLY_TOKEN` | Calendly > Integrations & apps > API & webhooks > Personal access tokens | Free plan works | Demo data is shown; "Sync now" explains what to set |
| [Calendly webhooks](#calendly-webhooks) | Optional | `CALENDLY_WEBHOOK_SIGNING_KEY` | You make it (`npm run secret`), then `npm run calendly:webhook -- create` | Calendly Standard plan or higher | `/api/webhooks/calendly` returns 404; polling still works |
| [App password](#app-password) | **Yes in production** | `APP_PASSWORD` | You choose it | Free | Local: open, with a warning bar. Production: locked behind a "Set APP_PASSWORD" screen |
| [Sync secret](#sync-secret) | Optional | `SYNC_SECRET` | You make it (`npm run secret`) | Free | `/api/sync` returns 503, so the cron can't sync. "Sync now" still works |
| [Railway cron](#railway-cron) | Optional | `APP_URL`, `SYNC_SECRET` (on the cron service) | A second Railway service using `railway.cron.toml` | Included in Railway usage (seconds per run) | No automatic sync every 15 minutes |
| [Test database](#test-database) | Optional | `TEST_DATABASE_URL` | A second, empty Postgres database | Free locally, or a small Railway Postgres | `npm test` skips the database tests |

---

## Railway Postgres

The database that stores bookings, reps, call attempts and sync history.

- **On Railway:** in your app service's Variables, set
  `DATABASE_URL` to `${{Postgres.DATABASE_URL}}` (type it exactly like that). Railway
  fills in the private address, which is faster and never leaves Railway's network.
- **On your computer:** open the Postgres service > **Variables**, copy the value of
  `DATABASE_PUBLIC_URL`, and paste it as `DATABASE_URL` in your `.env`. (The private
  address only works inside Railway.)
- **First run locally:** `npm run db:deploy` creates the tables. On Railway this runs
  automatically every time the app starts (`railway.toml`).
- **If it's missing or wrong:** the app shows "Connect a database to get started", or
  "Something went wrong loading this page" if the address is set but unreachable. The
  health check (`/api/health`) keeps working either way, on purpose.
- Files: `src/lib/db.ts`, `prisma.config.ts`, `prisma/schema.prisma`, `railway.toml`.

## Calendly

Brings your Calendly bookings into the CRM by polling. Works on Calendly's **free** plan.

1. In Calendly, go to **Integrations & apps > API & webhooks > Personal access tokens**
   and create a token. Copy it right away (Calendly shows it once).
2. Put it in `.env` as `CALENDLY_TOKEN` (and in Railway variables when you deploy).
3. Restart the app and click **Sync now** on the Sales page.

What a sync does: reads bookings from 60 days ago to 60 days ahead, including canceled
ones, with each invitee's time zone, booking form answers, join link, reschedule link and
cancel reason. Syncing twice never creates duplicates. Your team's work (status, notes,
qualified, call attempts, an assigned rep) is never overwritten.

- On a team account, the token owner should be a Calendly **admin** to sync everyone's
  bookings. Otherwise only the token owner's own bookings come in.
- Bookings are auto-assigned to a rep when the Calendly host's email matches the rep's
  email in Settings.
- **The first real sync deletes the demo data**: only rows created as demo data, never
  anything you added.
- **If it's missing:** the app runs on demo data with a "Demo data" badge, and Sync now
  explains what to set.
- **If the token is wrong or expired:** Sync now says "Calendly rejected the token", and
  Settings shows the last error. The token itself is never shown or logged.
- Files: `src/modules/sales/integrations/calendly/` (client, normalize, store, sync).

## Calendly webhooks

Optional instant updates: Calendly tells the app about new and canceled bookings within
seconds instead of waiting for the next sync. **Needs a paid Calendly plan** (Standard or
higher). If you're on the free plan, skip this. Polling covers you.

1. Make a signing key: `npm run secret`. Put it in `.env` **and** in your Railway app
   variables as `CALENDLY_WEBHOOK_SIGNING_KEY`. Redeploy.
2. Set `APP_URL` in `.env` to your app's public address (e.g.
   `https://your-app.up.railway.app`).
3. Run `npm run calendly:webhook -- create` on your computer. It registers
   `<APP_URL>/api/webhooks/calendly` with Calendly.
4. Check it: `npm run calendly:webhook -- list`. To remove it:
   `npm run calendly:webhook -- delete <uri from the list>`.

Every delivery is checked against its signature, and anything unsigned, altered or more
than 3 minutes old is rejected. Keep polling (the cron) running too: it catches anything
a webhook missed.

- **If it's missing:** the webhook address returns 404 and nothing else changes.
- Files: `src/app/api/webhooks/calendly/route.ts`, `src/modules/sales/integrations/calendly/webhook.ts`,
  `scripts/calendly-webhook.mjs`.

## App password

One shared password for your team.

- Pick a long passphrase and set `APP_PASSWORD` (in `.env` locally, in Railway variables
  in production). Signing in keeps you signed in for 30 days.
- Changing the password signs everyone out.
- **If it's missing:** with `npm run dev` the app is open and shows a yellow warning bar.
  In production (`npm start` or Railway) every page is locked behind a "Set
  APP_PASSWORD" screen, so a fresh deploy is never left open.
- Files: `src/lib/auth.ts`, `src/proxy.ts`, `src/app/api/auth/`.

## Sync secret

Protects the `/api/sync` address so only your cron (not strangers) can trigger a sync.

- Make one with `npm run secret` and set it as `SYNC_SECRET` on the app service.
- The cron calls `POST /api/sync` with the header `Authorization: Bearer <SYNC_SECRET>`.
- **If it's missing:** `/api/sync` returns 503 and the cron can't sync. Sync now still works.
- File: `src/app/api/sync/route.ts`.

## Railway cron

Runs a sync every 15 minutes, so bookings stay fresh without anyone clicking Sync now.
It's a second, tiny Railway service built from the same GitHub repo.

1. In your Railway project: **+ New > GitHub Repo** and pick this repo again.
2. Open the new service > **Settings** > **Config-as-code** > **Railway Config File**,
   and enter `/railway.cron.toml`. That file sets the start command
   (`npm run cron:sync`) and the schedule (`*/15 * * * *`).
3. In the new service's **Variables**, add:
   - `APP_URL` = your app's public address, e.g. `https://your-app.up.railway.app`
   - `SYNC_SECRET` = `${{<your app service name>.SYNC_SECRET}}` (or paste the same value)
4. Deploy. Each run prints one line, e.g. `Sync finished (200): {"status":"ok",...}`,
   in that service's logs.

- **If it's missing:** no automatic sync. Sync now and webhooks still work.
- Files: `railway.cron.toml`, `scripts/cron-sync.mjs`.

## Test database

Only for `npm test`. The database tests erase everything in the database they use, so
this must be a **separate, empty** database, never your real one.

- Locally with Postgres installed: `createdb crm_test`, then
  `TEST_DATABASE_URL=postgresql://localhost:5432/crm_test` in `.env`.
- Or add a second Postgres service on Railway and use its public URL.
- The tests refuse to run if `TEST_DATABASE_URL` is the same as `DATABASE_URL`.
- **If it's missing:** `npm test` runs every other test and skips the database ones.
- Files: `tests/global-setup.ts`, `tests/setup.ts`, `tests/calendly-sync.db.test.ts`.
