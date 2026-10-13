/* ============================================================
 * CONNECTION: Calendly webhooks (instant updates)
 * Required:   Optional. Off unless CALENDLY_WEBHOOK_SIGNING_KEY is set.
 * Env vars:   CALENDLY_WEBHOOK_SIGNING_KEY
 * Get it:     openssl rand -hex 32, then `npm run calendly:webhook -- create`
 * Plan:       Paid Calendly plans only.
 * If missing: This endpoint returns 404. Polling still keeps data fresh.
 * Docs:       docs/CONNECTIONS.md#calendly-webhooks
 * ============================================================ */
// Public endpoint (no password): it's protected by Calendly's signature instead.
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizeInvitee } from "@/modules/sales/integrations/calendly/normalize";
import { loadRepEmails, removeDemoData, saveInvitee } from "@/modules/sales/integrations/calendly/store";
import type { CalendlyWebhookBody } from "@/modules/sales/integrations/calendly/types";
import { verifyCalendlySignature } from "@/modules/sales/integrations/calendly/webhook";

export const dynamic = "force-dynamic";

const HANDLED = new Set(["invitee.created", "invitee.canceled"]);

export async function POST(request: Request) {
  const signingKey = env.webhookSigningKey();
  if (!signingKey) return new Response("Not found", { status: 404 });

  // Verify against the exact bytes Calendly sent, before parsing anything.
  const rawBody = await request.text();
  const check = verifyCalendlySignature(request.headers.get("calendly-webhook-signature"), rawBody, signingKey);
  if (!check.ok) return Response.json({ error: check.reason }, { status: 401 });

  let body: CalendlyWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!HANDLED.has(body.event)) return Response.json({ ok: true, ignored: body.event });

  const invitee = body.payload;
  if (!invitee?.uri || !invitee.scheduled_event?.uri) {
    return Response.json({ error: "Missing invitee or event" }, { status: 400 });
  }

  const db = getDb();
  const run = await db.syncRun.create({ data: { source: "webhook", status: "running" } });
  try {
    await removeDemoData(db);
    const outcome = await saveInvitee(db, normalizeInvitee(invitee.scheduled_event, invitee), await loadRepEmails(db));
    await db.syncRun.update({
      where: { id: run.id },
      data: { status: "ok", finishedAt: new Date(), [outcome]: 1 },
    });
    return Response.json({ ok: true, outcome });
  } catch (error) {
    await db.syncRun.update({
      where: { id: run.id },
      data: { status: "error", finishedAt: new Date(), error: (error instanceof Error ? error.message : "Unknown error").slice(0, 500) },
    });
    // A 500 makes Calendly retry the delivery later.
    return Response.json({ error: "Could not save" }, { status: 500 });
  }
}
