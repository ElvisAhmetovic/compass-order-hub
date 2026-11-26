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
