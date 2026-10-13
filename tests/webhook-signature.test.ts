import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/webhooks/calendly/route";
import { verifyCalendlySignature } from "@/modules/sales/integrations/calendly/webhook";

const KEY = "whsec-test-key";
const now = Math.floor(Date.now() / 1000);
const sign = (body: string, t = now, key = KEY) => `t=${t},v1=${createHmac("sha256", key).update(`${t}.${body}`).digest("hex")}`;
const body = JSON.stringify({ event: "invitee.created", payload: { uri: "x" } });
const request = (raw: string, signature?: string) =>
  new Request("http://localhost/api/webhooks/calendly", {
    method: "POST",
    body: raw,
    headers: signature ? { "calendly-webhook-signature": signature } : {},
  });

afterEach(() => {
  delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
});

describe("verifyCalendlySignature", () => {
  it("accepts a correct, fresh signature", () => {
    expect(verifyCalendlySignature(sign(body), body, KEY, now)).toEqual({ ok: true });
  });
  it.each([
    ["missing", null],
    ["malformed", "garbage"],
    ["wrong key", sign(body, now, "other-key")],
    ["too old (replay)", sign(body, now - 600)],
    ["from the future", sign(body, now + 600)],
  ])("rejects a %s signature", (_label, header) => {
    expect(verifyCalendlySignature(header, body, KEY, now).ok).toBe(false);
  });
  it("rejects a tampered body", () => {
    expect(verifyCalendlySignature(sign(body), body.replace("x", "y"), KEY, now).ok).toBe(false);
  });
});

describe("POST /api/webhooks/calendly (no database needed)", () => {
  it("is off (404) when no signing key is set", async () => {
    expect((await POST(request(body, sign(body)))).status).toBe(404);
  });
  it("rejects unsigned and badly signed requests with 401", async () => {
    process.env.CALENDLY_WEBHOOK_SIGNING_KEY = KEY;
    expect((await POST(request(body))).status).toBe(401);
    expect((await POST(request(body, sign(body, now, "wrong")))).status).toBe(401);
    expect((await POST(request(body, sign(body, now - 600)))).status).toBe(401);
  });
  it("answers 200 and ignores event types it doesn't handle", async () => {
    process.env.CALENDLY_WEBHOOK_SIGNING_KEY = KEY;
    const other = JSON.stringify({ event: "routing_form_submission.created", payload: {} });
    const response = await POST(request(other, sign(other)));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ignored: "routing_form_submission.created" });
  });
});
