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
