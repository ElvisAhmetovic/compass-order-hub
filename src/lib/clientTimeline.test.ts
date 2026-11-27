import { describe, it, expect } from "vitest";
import { buildClientTimeline, filterTimeline } from "./clientTimeline";

const src = {
  offers: [{ id: "1", sent_at: "2026-11-01T10:00:00Z", subject: "Offer", body: "Hi", approved_by_name: "Jo" }, { id: "2", sent_at: null, subject: "Draft", body: "x", approved_by_name: null }],
  replies: [{ id: "3", received_at: "2026-11-02T10:00:00Z", subject: "Re: Offer", text_body: "Yes", from_name: null, from_email: "a@b.de" }],
  messages: [{ id: "4", created_at: "2026-11-03T10:00:00Z", subject: "Re", body: "Great", sent_by_name: "Jo", status: "sent" },
    { id: "5", created_at: "2026-11-04T10:00:00Z", subject: "Re", body: "x", sent_by_name: "Jo", status: "failed" }],
  orderEmails: [{ id: "6", created_at: "2026-10-01T10:00:00Z", email_subject: null, template_name: null, custom_message: null, sent_by_name: null, invoice_number: "INV-1" }],
  statusEmails: [{ id: "7", created_at: "2026-10-02T10:00:00Z", sent_at: null, email_subject: null, new_status: "Done", changed_by_name: null, email_sent: false }],
};

describe("buildClientTimeline", () => {
  it("merges newest first and skips unsent offers, failed answers and unsent status emails", () => {
    expect(buildClientTimeline(src).map((e) => e.key)).toEqual(["m4", "r3", "o1", "e6"]);
  });
  it("marks client replies as received and names the sender", () => {
    const r = buildClientTimeline(src).find((e) => e.key === "r3")!;
    expect(r.direction).toBe("received"); expect(r.who).toBe("a@b.de");
  });
  it("filters by direction and type", () => {
    const t = buildClientTimeline(src);
    expect(filterTimeline(t, "received").map((e) => e.key)).toEqual(["r3"]);
    expect(filterTimeline(t, "orders").map((e) => e.key)).toEqual(["e6"]);
    expect(filterTimeline(t, "outreach")).toHaveLength(3);
  });
});
