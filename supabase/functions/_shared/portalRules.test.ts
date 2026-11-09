import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { decidePortalAction } from "./portalRules.ts";

Deno.test("invalid email is skipped", () => {
  assertEquals(decidePortalAction("not-an-email", false), { action: "skip", reason: "invalid_email" });
  assertEquals(decidePortalAction("", false), { action: "skip", reason: "invalid_email" });
});
Deno.test("team email never gets a client account", () => {
  assertEquals(decidePortalAction("Invoice@MediaaMarketing.com", false), { action: "skip", reason: "team_email" });
});
Deno.test("existing account is only linked, never re-sent", () => {
  assertEquals(decidePortalAction("kunde@example.de", true), { action: "link_existing" });
});
Deno.test("new client gets account and one email", () => {
  assertEquals(decidePortalAction(" Kunde@Example.de ", false), { action: "create_and_send" });
});
