import { describe, it, expect } from "vitest";
import { hasUnpaidInvoice, isLapsedContract, isMonthlyScanWindow, testRecipient } from "../../../supabase/functions/_shared/outreachRules";

describe("AI outreach client rules", () => {
  it("skips clients with a sent, unpaid invoice", () => {
    expect(hasUnpaidInvoice([{ status: "paid", paid_at: "2026-10-01" }, { status: "sent", paid_at: null }])).toBe(true);
  });
  it("paid, draft and cancelled invoices do not block an offer", () => {
    expect(hasUnpaidInvoice([{ status: "paid", paid_at: "2026-10-01" }, { status: "draft", paid_at: null }, { status: "cancelled", paid_at: null }])).toBe(false);
  });
  it("stopped and completed packages count as older contracts; active ones do not", () => {
    expect(isLapsedContract({ status: "stopped", stopped_at: null, updated_at: null })).toBe(true);
    expect(isLapsedContract({ status: "completed", stopped_at: null, updated_at: null })).toBe(true);
    expect(isLapsedContract({ status: "active", stopped_at: null, updated_at: null })).toBe(false);
  });
  it("automatic scan runs only in the first 7 days of the month", () => {
    expect(isMonthlyScanWindow(new Date("2026-12-01T08:00:00Z"))).toBe(true);
    expect(isMonthlyScanWindow(new Date("2026-12-07T08:00:00Z"))).toBe(true);
    expect(isMonthlyScanWindow(new Date("2026-12-08T08:00:00Z"))).toBe(false);
  });
  it("test email goes to the person who clicked", () => {
    expect(testRecipient(" Max@Example.com ")).toBe("max@example.com");
    expect(testRecipient(null)).toBeNull();
  });
});
