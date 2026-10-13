import { describe, it, expect } from "vitest";
import { getClientInvoiceEmailTemplate, CLIENT_TEMPLATE_LANGUAGES } from "../monthlyInvoiceTemplates";
import { getStripeEmailCopy } from "@/components/invoices/stripePaymentLink";

const INVOICE_LANGS = ["en","de","fr","nl","es","da","no","cs","pl","sv","ru","it","uk","ro","tr","pt","hu","el","bg","fi","sk","sl","mk"];
const en = getClientInvoiceEmailTemplate("en");

describe("Send to Client languages", () => {
  it("Italian opens with Italian subject and message", () => {
    const t = getClientInvoiceEmailTemplate("it");
    expect(t.subject).toBe("Fattura Media Marketing Limited");
    expect(t.message).toContain("entro la data di scadenza indicata sulla fattura");
    expect(t.message).not.toContain("IBAN");
  });
  it.each(INVOICE_LANGS.filter(l => l !== "en"))("%s has its own text, not English", (l) => {
    const t = getClientInvoiceEmailTemplate(l);
    expect(t.message).not.toBe(en.message);
    expect(getStripeEmailCopy(l).hint).not.toBe(getStripeEmailCopy("en").hint);
    expect(CLIENT_TEMPLATE_LANGUAGES.some(x => x.value === l)).toBe(true);
  });
});
