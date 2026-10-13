/* ============================================================
 * CONNECTION: Railway cron -> /api/sync
 * Required:   Optional (for automatic syncing every 15 minutes)
 * Env vars:   APP_URL, SYNC_SECRET
 * Get it:     APP_URL = your app's Railway URL. SYNC_SECRET = the same
 *             value you set on the app (npm run secret).
 * Plan:       Railway cron services are included in usage pricing.
 * If missing: The cron run fails with a message; nothing else breaks.
 * Docs:       docs/CONNECTIONS.md#railway-cron
 * ============================================================ */
// Start command for a Railway cron service (schedule: */15 * * * *). It asks the app to
// sync, prints a one-line result, and exits. Never prints the secret.
const appUrl = process.env.APP_URL?.trim().replace(/\/+$/, "");
const secret = process.env.SYNC_SECRET?.trim();

if (!appUrl || !secret) {
  console.error("Set APP_URL and SYNC_SECRET on this cron service. See docs/CONNECTIONS.md#railway-cron");
  process.exit(1);
}

const response = await fetch(`${appUrl}/api/sync`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});
const body = await response.json().catch(() => ({}));
console.log(`Sync ${response.ok ? "finished" : "failed"} (${response.status}):`, JSON.stringify(body));
process.exit(response.ok ? 0 : 1);
