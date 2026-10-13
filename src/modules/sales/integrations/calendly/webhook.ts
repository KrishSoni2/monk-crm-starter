/* ============================================================
 * CONNECTION: Calendly webhooks (instant updates)
 * Required:   Optional. Off unless CALENDLY_WEBHOOK_SIGNING_KEY is set.
 * Env vars:   CALENDLY_WEBHOOK_SIGNING_KEY
 * Get it:     Make one yourself (npm run secret), then run
 *             `npm run calendly:webhook -- create` to register it.
 * Plan:       Paid Calendly plans only (Standard and up).
 * If missing: The webhook endpoint returns 404; polling still works.
 * Docs:       docs/CONNECTIONS.md#calendly-webhooks
 * ============================================================ */
import { createHmac, timingSafeEqual } from "node:crypto";

// Calendly signs each delivery: header "Calendly-Webhook-Signature: t=<unix>,v1=<hex>",
// where v1 = HMAC-SHA256(signing key, "<t>.<raw body>"). We recompute it and compare in
// constant time, and reject anything older than this so a captured request can't be
// replayed later. Always enforced: there is no "skip in development" switch.
export const SIGNATURE_TOLERANCE_SECONDS = 180;

export function verifyCalendlySignature(
  header: string | null,
  rawBody: string,
  signingKey: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): { ok: true } | { ok: false; reason: string } {
  if (!header) return { ok: false, reason: "Missing signature" };
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!Number.isFinite(timestamp) || !signature) return { ok: false, reason: "Malformed signature" };
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return { ok: false, reason: "Signature too old" };

  const expected = createHmac("sha256", signingKey).update(`${parts.t}.${rawBody}`).digest("hex");
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "Bad signature" };
  return { ok: true };
}
