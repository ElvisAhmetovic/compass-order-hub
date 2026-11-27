import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { verifySvix, signSvixForTest } from "../_shared/svixVerify.ts";
import { draftIdFromAddresses, parseFromHeader, outreachReplyTo } from "../_shared/outreachRules.ts";

const secret = "whsec_" + btoa("test-secret-for-inbound-1234567");
const now = 1_800_000_000_000;
const ts = String(now / 1000);

Deno.test("valid signature passes", async () => {
  const sig = await signSvixForTest(secret, "msg_1", ts, "{}");
  assertEquals(await verifySvix(secret, { id: "msg_1", timestamp: ts, signature: sig }, "{}", now), true);
});
Deno.test("wrong or missing signature is rejected", async () => {
  const sig = await signSvixForTest(secret, "msg_1", ts, "{}");
  assertEquals(await verifySvix(secret, { id: "msg_1", timestamp: ts, signature: sig }, '{"x":1}', now), false);
  assertEquals(await verifySvix(secret, { id: "msg_1", timestamp: ts, signature: null }, "{}", now), false);
  assertEquals(await verifySvix("", { id: "msg_1", timestamp: ts, signature: sig }, "{}", now), false);
});
Deno.test("old timestamp is rejected", async () => {
  const sig = await signSvixForTest(secret, "msg_1", ts, "{}");
  assertEquals(await verifySvix(secret, { id: "msg_1", timestamp: ts, signature: sig }, "{}", now + 600_000), false);
});
Deno.test("unsigned request to the endpoint gets 401", async () => {
  const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
  if (!url) return;
  const r = await fetch(`${url}/functions/v1/outreach-inbound`, { method: "POST", body: '{"type":"email.received"}' });
  await r.text();
  assertEquals(r.status, 401);
});
Deno.test("reply address links to the offer", () => {
  const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
  assertEquals(draftIdFromAddresses([`reply+${id}@replies.mediaamarketing.com`]), id);
  assertEquals(draftIdFromAddresses(["invoice@mediaamarketing.com"]), null);
  assertEquals(outreachReplyTo("Johann Nowak", null, id, "replies.mediaamarketing.com"), [`"Johann Nowak (AI Outreach)" <reply+${id}@replies.mediaamarketing.com>`]);
  assertEquals(parseFromHeader('"Jane Doe" <Jane@X.com>'), { name: "Jane Doe", email: "jane@x.com" });
});

import { isOfficeInbox, officeSender, shouldForwardReply as sfr } from "../_shared/outreachRules.ts";
Deno.test("Given mail to office@ on the inbound domain, When checked, Then it is office inbox", () => {
  assertEquals(isOfficeInbox(["Office <office@replies.mediaamarketing.com>"], "replies.mediaamarketing.com"), true);
  assertEquals(isOfficeInbox(["reply+abc@replies.mediaamarketing.com"], "replies.mediaamarketing.com"), false);
  assertEquals(isOfficeInbox(["office@replies.mediaamarketing.com"], null), false);
});
Deno.test("Given an auto-forward keeping the client sender, Then the client is the sender", () => {
  assertEquals(officeSender({ email: "kunde@praxis.de", name: "Kunde" }, null)?.email, "kunde@praxis.de");
});
Deno.test("Given a manual forward from office@, Then Reply-To is used or the mail is dropped", () => {
  assertEquals(officeSender({ email: "office@mediaamarketing.com", name: null }, "Anna <anna@x.de>")?.email, "anna@x.de");
  assertEquals(officeSender({ email: "office@mediaamarketing.com", name: null }, null), null);
});
Deno.test("Given an office inbox mail (no linked offer), Then it is never forwarded to a team inbox", () => {
  assertEquals(sfr({ linked: false, bulk: false, autoReply: false, fromTeam: false, alreadyForwarded: false, to: "a@b.de" }), false);
});
