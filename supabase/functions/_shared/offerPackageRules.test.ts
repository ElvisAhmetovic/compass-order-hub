import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseOfferPackage, shouldSendStripeLink } from "./offerPackageRules.ts";

const ok = { enabled: true, monthly_amount: 399.99, billing_frequency: 1, duration_months: 12, start_date: "2026-12-01", use_stripe: true };

Deno.test("offer without the switch creates no package", () => {
  assertEquals(parseOfferPackage({ ...ok, enabled: false }), null);
  assertEquals(parseOfferPackage(undefined), null);
});

Deno.test("invalid terms are rejected", () => {
  assertEquals(parseOfferPackage({ ...ok, monthly_amount: 0 }), null);
  assertEquals(parseOfferPackage({ ...ok, billing_frequency: 2 }), null);
  assertEquals(parseOfferPackage({ ...ok, duration_months: 0 }), null);
  assertEquals(parseOfferPackage({ ...ok, start_date: "next month" }), null);
});

Deno.test("valid €399,99 monthly package for 12 months", () => {
  const p = parseOfferPackage(ok)!;
  assertEquals(p.monthly_amount, 399.99);
  assertEquals(p.duration_months, 12);
});

Deno.test("second accept sends no second Stripe link; Stripe off sends none", () => {
  const p = parseOfferPackage(ok);
  assertEquals(shouldSendStripeLink(p, true), true);
  assertEquals(shouldSendStripeLink(p, false), false);
  assertEquals(shouldSendStripeLink(parseOfferPackage({ ...ok, use_stripe: false }), true), false);
});
