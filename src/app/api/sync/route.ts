/* ============================================================
 * CONNECTION: Sync endpoint (called by the Railway cron)
 * Required:   Optional. Needed for automatic syncing every 15 minutes.
 * Env vars:   SYNC_SECRET (plus CALENDLY_TOKEN for there to be anything to sync)
 * Get it:     Make one yourself: npm run secret
 * Plan:       Free
 * If missing: This endpoint returns 503. "Sync now" still works.
 * Docs:       docs/CONNECTIONS.md#sync-secret
 * ============================================================ */
// Public endpoint (no password): protected by SYNC_SECRET instead.
// Call it with:  POST /api/sync   Authorization: Bearer <SYNC_SECRET>
import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { runSync } from "@/modules/sales/integrations/calendly/sync";

export const dynamic = "force-dynamic";

function secretMatches(header: string | null, secret: string) {
  const given = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(secret).digest();
  return given.length > 0 && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = env.syncSecret();
  if (!secret) return Response.json({ error: "SYNC_SECRET is not set" }, { status: 503 });
  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Wrong or missing sync secret" }, { status: 401 });
  }

  const result = await runSync({ source: "cron" });
  return Response.json(result, { status: result.status === "error" ? 502 : 200 });
}
