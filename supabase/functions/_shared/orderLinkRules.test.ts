import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { canMarkLinkPaid, orderLinkAmountCents } from "./orderLinkRules.ts";

Deno.test("€399,99 + 19% VAT = €475,99", () => assertEquals(orderLinkAmountCents(399.99, true, 19), 47599));
Deno.test("VAT off charges the net €399,99", () => assertEquals(orderLinkAmountCents(399.99, false, 19), 39999));
Deno.test("replaced or paid link cannot be marked paid again", () => {
  assertEquals(canMarkLinkPaid("pending"), true);
  assertEquals(canMarkLinkPaid("replaced"), false);
  assertEquals(canMarkLinkPaid("paid"), false);
});
