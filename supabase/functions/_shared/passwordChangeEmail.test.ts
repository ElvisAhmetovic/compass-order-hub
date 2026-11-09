import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { passwordChangeEmail } from "./passwordChangeEmail.ts";

Deno.test("password-change notice never includes the password, even if one is passed", () => {
  const input = { userEmail: "a@b.de", userName: "Anna", companyName: "Acme", newPassword: "Secret123X" } as Parameters<typeof passwordChangeEmail>[0];
  const { subject, html } = passwordChangeEmail(input);
  assert(!html.includes("Secret123X"));
  assert(!subject.includes("Secret123X"));
  assert(html.includes("a@b.de"));
  assertEquals(subject, "Client Password Changed - Acme");
});
