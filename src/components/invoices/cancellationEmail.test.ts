import { describe, it, expect } from "vitest";
import { shouldOfferCancellationEmail, cancellationRecipient } from "./cancellationEmail";

describe("storno email offer", () => {
  it("offers for an invoice already sent to the client", () => {
    expect(shouldOfferCancellationEmail("sent")).toBe(true);
    expect(shouldOfferCancellationEmail("overdue")).toBe(true);
    expect(shouldOfferCancellationEmail("paid")).toBe(true);
  });
  it("does not offer for drafts (client never saw them)", () => {
    expect(shouldOfferCancellationEmail("draft")).toBe(false);
  });
  it("does not offer twice for an already cancelled invoice", () => {
    expect(shouldOfferCancellationEmail("cancelled")).toBe(false);
  });
  it("uses bill-to email, falls back to client email, rejects invalid", () => {
    expect(cancellationRecipient({ bill_to_email: "a@b.de", client: { email: "c@d.de" } })).toBe("a@b.de");
    expect(cancellationRecipient({ bill_to_email: "", client: { email: "c@d.de" } })).toBe("c@d.de");
    expect(cancellationRecipient({ bill_to_email: "nope" })).toBeNull();
  });
});
