import { describe, it, expect } from "vitest";
import { CLIENT_MESSAGE_TEMPLATES, MESSAGE_TEMPLATES } from "../monthlyInvoiceTemplates";

describe("Send to Client email templates", () => {
  it.each(Object.keys(CLIENT_MESSAGE_TEMPLATES))("%s has no bank details", (lang) => {
    const m = CLIENT_MESSAGE_TEMPLATES[lang];
    for (const bad of ["IBAN", "BIC", "DE91", "REVO"]) expect(m).not.toContain(bad);
  });
  it.each(Object.keys(CLIENT_MESSAGE_TEMPLATES))("%s keeps greeting and signature", (lang) => {
    const m = CLIENT_MESSAGE_TEMPLATES[lang];
    expect(m.split("\n")[0]).toBe(MESSAGE_TEMPLATES[lang].split("\n")[0]);
    expect(m).toContain("Annalena Klein");
  });
  it("monthly templates still list the bank details", () => {
    expect(MESSAGE_TEMPLATES.de).toContain("DE91 2407 0368 0071 5722 00");
  });
});
