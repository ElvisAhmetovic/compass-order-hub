import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { stripeStatusLabel } from "../stripeBillingService";

describe("stripeStatusLabel", () => {
  it("bank-transfer packages show no Stripe badge", () => {
    expect(stripeStatusLabel({ payment_method: "bank_transfer", stripe_status: "active" })).toBeNull();
  });
  it("failed charge shows Payment failed", () => {
    expect(stripeStatusLabel({ payment_method: "stripe", stripe_status: "past_due" })).toBe("Payment failed");
  });
  it("scheduled cancellation wins over active", () => {
    expect(stripeStatusLabel({ payment_method: "stripe", stripe_status: "active", cancel_at: "2026-12-01" })).toBe("Cancels");
  });
  it("link sent but not paid shows Awaiting payment", () => {
    expect(stripeStatusLabel({ payment_method: "stripe", stripe_status: "pending" })).toBe("Awaiting payment");
  });
});
