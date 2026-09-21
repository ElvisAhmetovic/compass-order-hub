import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { isTeamEmail } from "./teamEmails.ts";

Deno.test("recognises listed team addresses regardless of case/space", () => {
  assertEquals(isTeamEmail(" Angelina@abmedia-team.com "), true);
  assertEquals(isTeamEmail("invoice@team-abmedia.com"), true);
  assertEquals(isTeamEmail("someone@abm-team.com"), true);
});

Deno.test("treats outside addresses (clients) as non-team", () => {
  assertEquals(isTeamEmail("client@sievers-bestattungen.de"), false);
  assertEquals(isTeamEmail("random@gmail.com"), false);
  assertEquals(isTeamEmail(""), false);
  assertEquals(isTeamEmail(null), false);
});
