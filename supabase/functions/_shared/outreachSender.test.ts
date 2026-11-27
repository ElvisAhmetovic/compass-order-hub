import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { OUTREACH_FROM, outreachReplyTo } from "./outreachRules.ts";

Deno.test("Given an outreach send, then the sender is the office address, not noreply", () => {
  assertEquals(OUTREACH_FROM, "Media Marketing <office@mediaamarketing.com>");
});

Deno.test("Given an inbound domain, when replying, then reply_to still holds the per-offer address", () => {
  const r = outreachReplyTo("Max", "max@example.com", "abc", "replies.mediaamarketing.com");
  assertEquals(r[0].includes("<reply+abc@replies.mediaamarketing.com>"), true);
});
