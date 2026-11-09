import { assert, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { credentialsSubject, portalLineHtml, PORTAL_LOGIN_URL } from "./portalEmailCopy.ts";

Deno.test("portal line has German and English text and the login link", () => {
  const html = portalLineHtml();
  assertStringIncludes(html, "Kundenportal");
  assertStringIncludes(html, "client portal");
  assertStringIncludes(html, "https://www.empriatech.com/client/login");
  assert(PORTAL_LOGIN_URL.startsWith("https://www.empriatech.com"));
});

Deno.test("welcome subject is bilingual, German first", () => {
  const s = credentialsSubject(false);
  assert(s.indexOf("Willkommen") < s.indexOf("Welcome"));
  assertStringIncludes(s, "Media Marketing");
});
