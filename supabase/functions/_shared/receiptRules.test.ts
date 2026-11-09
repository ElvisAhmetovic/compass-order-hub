import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isSessionId, toReceipt } from "./receiptRules.ts";

Deno.test("accepts only Stripe checkout session ids", () => {
  assertEquals(isSessionId("cs_live_a1B2c3D4e5F6g7"), true);
  assertEquals(isSessionId("cs_test_a1B2c3D4e5F6g7"), true);
  assertEquals(isSessionId("pi_123"), false);
  assertEquals(isSessionId("cs_live_../../customers"), false);
  assertEquals(isSessionId(undefined), false);
});

Deno.test("receipt reveals no personal data and maps paid state", () => {
  const r = toReceipt({ mode: "payment", payment_status: "paid", amount_total: 39999, currency: "eur", created: 1762700000,
    customer_details: { email: "x@y.de", name: "Max" } } as never, "cs_live_abcdefghijKLMNOP", "INV-1");
  assertEquals(r.paid, true);
  assertEquals(r.amount, 399.99);
  assertEquals(r.kind, "order");
  assertEquals(JSON.stringify(r).includes("x@y.de"), false);
  assertEquals(JSON.stringify(r).includes("Max"), false);
});

Deno.test("unpaid session is not shown as paid", () => {
  assertEquals(toReceipt({ mode: "payment", payment_status: "unpaid" }, "cs_test_abcdefghijk", null).paid, false);
});
