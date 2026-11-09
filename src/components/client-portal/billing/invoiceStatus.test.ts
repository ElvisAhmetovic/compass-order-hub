import { describe, it, expect } from "vitest";
import { invoiceStatus, invoiceSummary } from "./invoiceStatus";

const today = "2026-11-09";
describe("invoiceStatus", () => {
  it("paid invoice is paid even if past due", () => expect(invoiceStatus({ status: "paid", due_date: "2026-01-01" }, today)).toBe("paid"));
  it("cancelled invoice is cancelled", () => expect(invoiceStatus({ status: "canceled", due_date: "2026-01-01" }, today)).toBe("cancelled"));
  it("unpaid past due date is overdue", () => expect(invoiceStatus({ status: "sent", due_date: "2026-11-08" }, today)).toBe("overdue"));
  it("unpaid due today is unpaid", () => expect(invoiceStatus({ status: "sent", due_date: "2026-11-09" }, today)).toBe("unpaid"));
  it("summary excludes cancelled from owed", () => {
    const s = invoiceSummary([
      { status: "paid", due_date: null, total_amount: 100 },
      { status: "sent", due_date: null, total_amount: 50 },
      { status: "cancelled", due_date: null, total_amount: 999 },
    ], today);
    expect(s).toEqual({ paidCount: 1, paidTotal: 100, unpaidCount: 1, unpaidTotal: 50 });
  });
});
