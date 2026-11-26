import { describe, it, expect } from "vitest";
import { isInactive, inCooldown, remainingDailyQuota, isSendWindow, isWinBack } from "../../../supabase/functions/_shared/outreachRules";

const now = new Date("2026-11-04T10:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

describe("AI outreach rules", () => {
  it("client is inactive only after 3 months (90 days) without an order", () => {
    expect(isInactive(daysAgo(89), now)).toBe(false);
    expect(isInactive(daysAgo(90), now)).toBe(true);
  });
  it("no new offer within 90 days of the last one", () => {
    expect(inCooldown(daysAgo(30), now)).toBe(true);
    expect(inCooldown(daysAgo(91), now)).toBe(false);
    expect(inCooldown(null, now)).toBe(false);
  });
  it("at most 50 offer emails per day", () => {
    expect(remainingDailyQuota(0)).toBe(50);
    expect(remainingDailyQuota(49)).toBe(1);
    expect(remainingDailyQuota(50)).toBe(0);
  });
  it("sends only weekdays 09:00-17:00 Sarajevo", () => {
    expect(isSendWindow(new Date("2026-11-04T10:00:00Z"))).toBe(true); // Wed 11:00
    expect(isSendWindow(new Date("2026-11-07T10:00:00Z"))).toBe(false); // Sat
    expect(isSendWindow(new Date("2026-11-04T17:00:00Z"))).toBe(false); // 18:00
  });
  it("won back = new order within 60 days after the offer was sent", () => {
    const sent = daysAgo(70);
    expect(isWinBack(sent, daysAgo(71))).toBe(false);
    expect(isWinBack(sent, daysAgo(10))).toBe(true);
    expect(isWinBack(sent, daysAgo(9))).toBe(false);
  });
});

import { outreachReplyTo, withSubjectRef } from "../../../supabase/functions/_shared/outreachRules";
describe("AI outreach replies", () => {
  it("replies go to the shared mailbox labelled with the sender, plus the sender", () => {
    expect(outreachReplyTo("Johann Nowak", "Johann@x.com")).toEqual(['"Johann Nowak (AI Outreach)" <invoice@mediaamarketing.com>', "johann@x.com"]);
  });
  it("subject carries the sender's initials once", () => {
    expect(withSubjectRef("Offer", "Johann Nowak")).toBe("Offer [Ref JN-AO]");
    expect(withSubjectRef("Offer [Ref JN-AO]", "Johann Nowak")).toBe("Offer [Ref JN-AO]");
  });
});

import { draftIdFromAddresses } from "../../../supabase/functions/_shared/outreachRules";
describe("AI outreach reply inbox", () => {
  const id = "0f8fad5b-d9cb-469f-a165-70867728950e";
  it("with the reply domain set, replies go to an offer-specific address plus the sender", () => {
    expect(outreachReplyTo("Johann Nowak", "johann@x.com", id, "replies.mediaamarketing.com"))
      .toEqual([`"Johann Nowak (AI Outreach)" <reply+${id}@replies.mediaamarketing.com>`, "johann@x.com"]);
  });
  it("without the reply domain, replies still go to invoice@", () => {
    expect(outreachReplyTo("Johann Nowak", null, id, null)).toEqual(['"Johann Nowak (AI Outreach)" <invoice@mediaamarketing.com>']);
  });
  it("a reply is matched to its offer, other addresses are not", () => {
    expect(draftIdFromAddresses([`Reply+${id}@replies.mediaamarketing.com`])).toBe(id);
    expect(draftIdFromAddresses(["reply+notanid@replies.mediaamarketing.com", "invoice@mediaamarketing.com"])).toBeNull();
  });
});
