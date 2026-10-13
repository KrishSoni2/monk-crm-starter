import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/sync/route";

const call = (authorization?: string) =>
  POST(new Request("http://localhost/api/sync", { method: "POST", headers: authorization ? { authorization } : {} }));

afterEach(() => {
  delete process.env.SYNC_SECRET;
});

describe("POST /api/sync", () => {
  it("returns 503 when SYNC_SECRET isn't set", async () => {
    expect((await call("Bearer anything")).status).toBe(503);
  });
  it("returns 401 without the right secret", async () => {
    process.env.SYNC_SECRET = "s3cret";
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect((await call("s3cret")).status).toBe(401);
  });
  it("runs with the right secret (skipped in demo mode, no Calendly token)", async () => {
    process.env.SYNC_SECRET = "s3cret";
    const response = await call("Bearer s3cret");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "skipped" });
  });
});
