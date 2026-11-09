import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
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
