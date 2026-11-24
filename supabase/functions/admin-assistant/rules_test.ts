import { assertEquals } from "jsr:@std/assert@1";
import { needsConfirmation, moneyBlocked, safeColumns } from "../_shared/assistantRules.ts";

Deno.test("every change tool needs confirmation, reads do not", () => {
  assertEquals(needsConfirmation("create_order"), true);
  assertEquals(needsConfirmation("set_order_status"), true);
  assertEquals(needsConfirmation("create_portal_account"), true);
  assertEquals(needsConfirmation("create_invoice"), true);
  assertEquals(needsConfirmation("create_support_ticket"), true);
  assertEquals(needsConfirmation("stop_stripe_package"), true);
  assertEquals(needsConfirmation("count_records"), false);
});
Deno.test("money sums are owner-only", () => {
  assertEquals(moneyBlocked("orders", "price", "someone@x.de"), true);
  assertEquals(moneyBlocked("orders", "price", "business@team-abmedia.com"), false);
  assertEquals(moneyBlocked("clients", undefined, "someone@x.de"), false);
});
Deno.test("unknown columns are dropped", () => {
  assertEquals(safeColumns("clients", ["email", "password"]), ["email"]);
  assertEquals(safeColumns("secret_table", ["x"]), []);
});
