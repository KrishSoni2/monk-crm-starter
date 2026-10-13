import { describe, expect, it } from "vitest";
import { normalizeInvitee } from "@/modules/sales/integrations/calendly/normalize";
import { createMockCalendly } from "./helpers/mock-calendly";

const now = new Date("2026-10-14T12:00:00Z");
const { event, invitee } = createMockCalendly(now);

describe("normalizeInvitee", () => {
  it("maps the Calendly fields the app shows", () => {
    const n = normalizeInvitee(event("E1", 2, "Host@Example.com"), invitee("E1", "A", "Alex Archer"));
    expect(n.fields.inviteeEmail).toBe("alex.archer@example.com");
    expect(n.fields.hostEmail).toBe("host@example.com");
    expect(n.fields.inviteeTimeZone).toBe("Europe/London");
    expect(n.fields.joinUrl).toBe("https://zoom.example.com/j/E1");
    expect(n.fields.inviteePhone).toBe("+1 555-0142");
    expect(n.fields.questions.map((q) => q.question)).toEqual(["Phone number", "What would you like to talk about?"]);
    expect(n.fields.canceledAt).toBeNull();
  });

  it("uses the invitee's cancellation, or the host's when the whole event was canceled", () => {
    const own = normalizeInvitee(
      event("E1", 2, "h@example.com"),
      invitee("E1", "A", "Alex", { status: "canceled", cancellation: { reason: "Conflict", canceled_by: "Alex", created_at: "2026-10-13T10:00:00Z" } }),
    );
    expect(own.fields).toMatchObject({ cancelReason: "Conflict", canceledBy: "Alex" });
    expect(own.fields.canceledAt?.toISOString()).toBe("2026-10-13T10:00:00.000Z");

    const host = normalizeInvitee(
      event("E1", 2, "h@example.com", { status: "canceled", cancellation: { reason: "Host is sick", canceled_by: "Host" } }),
      invitee("E1", "A", "Alex"),
    );
    expect(host.fields).toMatchObject({ cancelReason: "Host is sick", canceledBy: "Host" });
  });

  it("ignores join links that aren't web addresses (e.g. a phone number location)", () => {
    const n = normalizeInvitee(event("E1", 2, "h@example.com", { location: { type: "outbound_call", location: "+1 555-0100" } }), invitee("E1", "A", "Alex"));
    expect(n.fields.joinUrl).toBeNull();
  });
});
