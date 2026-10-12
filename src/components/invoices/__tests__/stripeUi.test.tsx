import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn(async (..._a: any[]) => ({ data: { success: true }, error: null })) }));
vi.mock("@/integrations/supabase/client", () => {
  const q: any = { select: () => q, eq: () => q, single: async () => ({ data: null }), update: () => q };
  return { supabase: { functions: { invoke }, from: () => q } };
});
vi.mock("@/utils/invoicePdfGenerator", () => ({ generateInvoicePDFBase64: async () => "data:application/pdf;base64,AAA" }));

import InvoicePreview from "../InvoicePreview";
import SendInvoicePDFDialog from "../SendInvoicePDFDialog";

const ts = { language: "en", currency: "EUR", vatEnabled: true, vatRate: 0, selectedPaymentAccount: ["germany"], companyInfo: { name: "Media Marketing Limited" } };
const base: any = { id: "1", invoice_number: "INV-1", issue_date: "2026-10-12", due_date: "2026-11-11", currency: "EUR" };
const LINK = "https://buy.stripe.com/test_ABC";

describe("Invoice preview Stripe button", () => {
  it("shows the button linking to the Stripe page", () => {
    render(<InvoicePreview invoice={{ ...base, stripe_payment_link: LINK }} lineItems={[]} templateSettings={ts} />);
    expect(screen.getByRole("link", { name: "Pay online with Stripe" })).toHaveAttribute("href", LINK);
  });
  it.each(["", "http://buy.stripe.com/x", "javascript:alert(1)"])("hides the button for %j", (link) => {
    render(<InvoicePreview invoice={{ ...base, stripe_payment_link: link }} lineItems={[]} templateSettings={ts} />);
    expect(screen.queryByRole("link", { name: /Stripe/ })).toBeNull();
  });
});

describe("Send to Client with a Stripe link", () => {
  it("adds the hint, shows the note and passes the link to the email", async () => {
    render(<SendInvoicePDFDialog open onOpenChange={() => {}} invoice={{ ...base, stripe_payment_link: LINK, bill_to_email: "c@x.de" }} lineItems={[]} templateSettings={{ ...ts, language: "de" }} />);
    const msg = screen.getByLabelText("Message") as HTMLTextAreaElement;
    expect(msg.value).toContain("bequem online");
    expect(screen.getByText(/button will be added to this email/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(invoke).toHaveBeenCalled());
    const body = (invoke.mock.calls[0] as any)[1].body;
    expect(body.stripe_payment_link).toBe(LINK);
    expect(body.stripe_button_label).toBe("Jetzt online bezahlen mit Stripe");
  });
  it("sends no link when the invoice has none", async () => {
    invoke.mockClear();
    render(<SendInvoicePDFDialog open onOpenChange={() => {}} invoice={{ ...base, bill_to_email: "c@x.de" }} lineItems={[]} templateSettings={ts} />);
    expect((screen.getByLabelText("Message") as HTMLTextAreaElement).value).not.toContain("button below");
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect((invoke.mock.calls[0] as any)[1].body.stripe_payment_link).toBeUndefined();
  });
});
