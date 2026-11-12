import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { productNameFor } from "./stripeRules.ts";
Deno.test("product name: typed > saved > default", () => {
  assertEquals(productNameFor("SEO Paket Premium", "Old", "ACME", "acme.de"), "SEO Paket Premium");
  assertEquals(productNameFor("  ", "Saved name", "ACME", "acme.de"), "Saved name");
  assertEquals(productNameFor(null, null, "ACME", "acme.de"), "ACME – acme.de");
  assertEquals(productNameFor(null, null, "ACME", null), "ACME – Paket");
});
import { cycleAmountCents, recurringFor, dueDateFromPeriodStart, monthNumberFor, stripeBillsContract, verifyStripeSignature, signForTest } from "./stripeRules.ts";

Deno.test("monthly package €399,99 without VAT charges 39999 cents", () => {
  assertEquals(cycleAmountCents(399.99, 1, false, 19), 39999);
});
Deno.test("installment €300 with VAT stored as 0.19 charges €357 per cycle (not ×frequency)", () => {
  assertEquals(cycleAmountCents(300, 3, true, 0.19), 35700);
  assertEquals(cycleAmountCents(300, 3, true, 19), 35700);
});
Deno.test("billing frequency maps to Stripe intervals", () => {
  assertEquals(recurringFor(1), { interval: "month", interval_count: 1 });
  assertEquals(recurringFor(3), { interval: "month", interval_count: 3 });
  assertEquals(recurringFor(12), { interval: "year", interval_count: 1 });
});
Deno.test("period start maps to first-of-month due date", () => {
  assertEquals(dueDateFromPeriodStart(Date.UTC(2026, 10, 9) / 1000), "2026-11-01");
});
Deno.test("month number counts from package start", () => {
  assertEquals(monthNumberFor("2026-09-15", "2026-11-01"), 3);
});
Deno.test("only live Stripe subscriptions block bank-transfer invoices", () => {
  assertEquals(stripeBillsContract("stripe", "active"), true);
  assertEquals(stripeBillsContract("stripe", "pending"), false);
  assertEquals(stripeBillsContract("stripe", "canceled"), false);
  assertEquals(stripeBillsContract("bank_transfer", "active"), false);
});
Deno.test("valid signature accepted, tampered or stale rejected", async () => {
  const secret = "whsec_test", body = '{"id":"evt_1"}', t = 1_700_000_000;
  const sig = await signForTest(secret, `${t}.${body}`);
  assertEquals(await verifyStripeSignature(body, `t=${t},v1=${sig}`, secret, t), true);
  assertEquals(await verifyStripeSignature(body + " ", `t=${t},v1=${sig}`, secret, t), false);
  assertEquals(await verifyStripeSignature(body, `t=${t},v1=${sig}`, secret, t + 1000), false);
  assertEquals(await verifyStripeSignature(body, null, secret, t), false);
});

import { chargesFor, subscriptionEndUnix, checkoutLinkState, paymentMethodLabel } from "./stripeRules.ts";

Deno.test("12 months monthly = 12 charges", () => { if (chargesFor(12, 1) !== 12) throw new Error(); });
Deno.test("12 months quarterly = 4 charges", () => { if (chargesFor(12, 3) !== 4) throw new Error(); });
Deno.test("no length = unlimited", () => { if (chargesFor(0, 1) !== null || chargesFor(null, 1) !== null) throw new Error(); });
Deno.test("12 monthly charges from 12 Nov 2026 stop before 12 Nov 2027", () => {
  const start = Date.UTC(2026, 10, 12, 10, 0) / 1000;
  const end = subscriptionEndUnix(start, 12, 1)!;
  const e = new Date(end * 1000);
  if (e.toISOString() !== "2027-11-12T09:00:00.000Z") throw new Error(e.toISOString());
});
Deno.test("link older than 24h is expired", () => {
  const now = Date.UTC(2026, 10, 12);
  if (checkoutLinkState("u", new Date(now - 25 * 3600e3).toISOString(), false, now) !== "expired") throw new Error();
  if (checkoutLinkState("u", new Date(now - 1 * 3600e3).toISOString(), false, now) !== "waiting") throw new Error();
  if (checkoutLinkState(null, null, true, now) !== "paid") throw new Error();
});
Deno.test("card label", () => { if (paymentMethodLabel({ card: { brand: "visa", last4: "4242" } }) !== "Visa •••• 4242") throw new Error(); });

import { refundStatus, sessionIsPaid, useStripeTestMode } from "./stripeRules.ts";
Deno.test("refundStatus full / partial / none", () => {
  if (refundStatus(39999, 39999) !== "refunded") throw new Error("full");
  if (refundStatus(39999, 10000) !== "partially_refunded") throw new Error("partial");
  if (refundStatus(39999, 0) !== "paid") throw new Error("none");
});
Deno.test("sessionIsPaid ignores unpaid SEPA sessions", () => {
  if (sessionIsPaid("unpaid")) throw new Error("unpaid counted");
  if (!sessionIsPaid("paid")) throw new Error("paid not counted");
});
Deno.test("test mode needs flag and key", () => {
  if (useStripeTestMode("true", undefined)) throw new Error("no key");
  if (useStripeTestMode(undefined, "sk_test")) throw new Error("no flag");
  if (!useStripeTestMode("true", "sk_test")) throw new Error("both");
});
