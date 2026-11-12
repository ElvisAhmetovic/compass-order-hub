import { describe, it, expect } from "vitest";
import { stripeStatusLabel, contractLinkState, paidProgress } from "./stripeBillingService";

describe("monthly package Stripe rules", () => {
  it("planned end of a 12-month package shows Ends, not Cancels", () => {
    expect(stripeStatusLabel({ payment_method: "stripe", stripe_status: "active", cancel_at: "2027-11-12T09:00:00Z", stripe_ends_at: "2027-11-12T09:00:00Z" })).toBe("Ends");
    expect(stripeStatusLabel({ payment_method: "stripe", stripe_status: "active", cancel_at: "2027-01-12T09:00:00Z", stripe_ends_at: "2027-11-12T09:00:00Z" })).toBe("Cancels");
  });
  it("a link older than 24 hours is expired", () => {
    const now = Date.UTC(2026, 10, 12);
    expect(contractLinkState({ stripe_checkout_url: "x", stripe_checkout_created_at: new Date(now - 25 * 3600e3).toISOString() }, now)).toBe("expired");
    expect(contractLinkState({ stripe_checkout_url: "x", stripe_checkout_created_at: new Date(now - 3600e3).toISOString() }, now)).toBe("waiting");
  });
  it("12 months monthly = 12 payments, quarterly = 4", () => {
    expect(paidProgress(4, 12, 1)).toEqual({ paid: 4, total: 12 });
    expect(paidProgress(1, 12, 3)).toEqual({ paid: 1, total: 4 });
    expect(paidProgress(1, 0, 1).total).toBeNull();
  });
});
