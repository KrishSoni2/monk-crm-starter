/* ============================================================
 * CONNECTION: Calendly webhooks (registration script)
 * Required:   Optional. Only for paid Calendly plans.
 * Env vars:   CALENDLY_TOKEN, CALENDLY_WEBHOOK_SIGNING_KEY, APP_URL
 * Get it:     Token: Calendly > Integrations & apps > API & webhooks.
 *             Signing key: openssl rand -hex 32. APP_URL: your Railway URL.
 * Plan:       Calendly Standard plan or higher (webhooks aren't on Free).
 * If missing: The script stops and says which variable to set.
 * Docs:       docs/CONNECTIONS.md#calendly-webhooks
 * ============================================================ */
// Registers, lists or deletes the Calendly webhook that sends instant updates to
// <APP_URL>/api/webhooks/calendly.
//
//   npm run calendly:webhook -- list
//   npm run calendly:webhook -- create
//   npm run calendly:webhook -- delete <subscription-uri>
//
// Reads .env if present. Never prints the token or signing key.
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");

const API = "https://api.calendly.com";
const token = process.env.CALENDLY_TOKEN?.trim();
const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY?.trim();
const appUrl = process.env.APP_URL?.trim().replace(/\/+$/, "");
const [command = "list", arg] = process.argv.slice(2);

function stop(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

async function calendly(path, options = {}) {
  const response = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = body?.message || body?.title || response.statusText;
    if (response.status === 401) stop("Calendly rejected CALENDLY_TOKEN (401). Check it's current and copied in full.");
    if (response.status === 403 && /upgrade|plan/i.test(JSON.stringify(body))) {
      stop("Calendly says webhooks need a paid plan. On the free plan, polling (Sync now + the 15-minute cron) is all you need.");
    }
    const error = new Error(`Calendly error ${response.status}: ${detail}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

if (!token) stop("Set CALENDLY_TOKEN in .env first. See docs/CONNECTIONS.md#calendly");

const me = (await calendly("/users/me")).resource;

// Organization scope covers every host on a team. If the token owner isn't an org admin,
// fall back to just their own bookings.
async function withScope(run) {
  try {
    return await run({ scope: "organization", organization: me.current_organization });
  } catch (error) {
    if (error.status !== 403) throw error;
    return run({ scope: "user", organization: me.current_organization, user: me.uri });
  }
}

if (command === "list") {
  const subs = await withScope(async (scope) => {
    const params = new URLSearchParams(scope);
    return (await calendly(`/webhook_subscriptions?${params}`)).collection;
  });
  if (!subs.length) console.log("\nNo webhook subscriptions yet. Run: npm run calendly:webhook -- create\n");
  for (const s of subs) {
    console.log(`\n${s.callback_url}\n  events: ${s.events.join(", ")}\n  state:  ${s.state}\n  scope:  ${s.scope}\n  uri:    ${s.uri}`);
  }
  console.log("");
} else if (command === "create") {
  if (!appUrl?.startsWith("https://")) stop("Set APP_URL to your app's public https address, e.g. https://your-app.up.railway.app");
  if (!signingKey) stop("Set CALENDLY_WEBHOOK_SIGNING_KEY first (make one with: openssl rand -hex 32), in .env AND in Railway variables.");
  const url = `${appUrl}/api/webhooks/calendly`;
  const sub = await withScope(async (scope) =>
    (
      await calendly("/webhook_subscriptions", {
        method: "POST",
        body: JSON.stringify({ ...scope, url, events: ["invitee.created", "invitee.canceled"], signing_key: signingKey }),
      })
    ).resource,
  );
  console.log(`\nWebhook created (${sub.scope} scope).\n  sends to: ${sub.callback_url}\n  uri:      ${sub.uri}`);
  console.log("\nMake sure CALENDLY_WEBHOOK_SIGNING_KEY in Railway matches the one in your .env.\n");
} else if (command === "delete") {
  if (!arg?.startsWith(`${API}/webhook_subscriptions/`)) stop("Pass the subscription uri from `list`, e.g. npm run calendly:webhook -- delete https://api.calendly.com/webhook_subscriptions/...");
  await calendly(arg, { method: "DELETE" });
  console.log("\nWebhook deleted.\n");
} else {
  stop("Usage: npm run calendly:webhook -- list | create | delete <uri>");
}
