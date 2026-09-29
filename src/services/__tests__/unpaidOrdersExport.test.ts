import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { isOnlyInvoiceSent } from "../unpaidOrdersExport";

describe("isOnlyInvoiceSent", () => {
  it("includes invoice sent + created", () => {
    expect(isOnlyInvoiceSent({ status_invoice_sent: true, status_created: true })).toBe(true);
  });
  it("excludes when paid or other labels", () => {
    expect(isOnlyInvoiceSent({ status_invoice_sent: true, status_invoice_paid: true })).toBe(false);
    expect(isOnlyInvoiceSent({ status_invoice_sent: true, status_resolved: true })).toBe(false);
    expect(isOnlyInvoiceSent({ status_invoice_sent: false })).toBe(false);
    expect(isOnlyInvoiceSent({ status_invoice_sent: true, deleted_at: "2026-01-01" })).toBe(false);
  });
});
