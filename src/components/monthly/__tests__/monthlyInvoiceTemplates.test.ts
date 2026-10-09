import { describe, expect, it } from "vitest";
import {
  getInvoiceEmailTemplate,
  MESSAGE_TEMPLATES,
  SUBJECT_TEMPLATES,
  TEMPLATE_LANGUAGES,
} from "../monthlyInvoiceTemplates";

const GERMAN_IBAN = "IBAN: DE91 2407 0368 0071 5722 00";
const GERMAN_BIC = "SWIFT/BIC: DEUTDE2HP22";

describe("invoice email templates", () => {
  it("uses the German account in the German invoice message", () => {
    expect(SUBJECT_TEMPLATES.de).toBe(
      "Media Marketing Limited Rechnung",
    );
    expect(MESSAGE_TEMPLATES.de).toBe(`Hallo,

vielen Dank für Ihre Bestellung.

Anbei finden Sie unsere aktuelle Rechnung.

Wichtiger Hinweis zur Zahlung:

Bitte verwenden Sie für Ihre Zahlung die folgende Bankverbindung:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Wir bitten Sie, den Rechnungsbetrag innerhalb von 3 Tagen zu begleichen, um eine reibungslose und ununterbrochene Bearbeitung Ihrer Dienstleistungen sicherzustellen.

Vielen Dank für Ihre Beachtung.

Mit freundlichen Grüßen

Annalena Klein

AB MEDIA

+49 203 7090 7262


Düsseldorfer Str. 32

47051 Duisburg`);
  });

  it("provides only the German account in every selectable language", () => {
    expect(TEMPLATE_LANGUAGES).toHaveLength(10);

    for (const { value } of TEMPLATE_LANGUAGES) {
      expect(SUBJECT_TEMPLATES[value]).toContain("Media Marketing Limited");
      expect(MESSAGE_TEMPLATES[value]).toContain(GERMAN_IBAN);
      expect(MESSAGE_TEMPLATES[value]).toContain(GERMAN_BIC);
      expect(MESSAGE_TEMPLATES[value]).toContain("Bank: Postbank/DSL Ndl of Deutsche Bank");
      expect(MESSAGE_TEMPLATES[value]).toMatch(/3 (days|Tagen|dagen|jours|días|dage|dnů|dni|dagar)/i);
      expect(MESSAGE_TEMPLATES[value]).toContain("Annalena Klein");
      expect(MESSAGE_TEMPLATES[value]).toContain("+49 203 7090 7262");
      expect(MESSAGE_TEMPLATES[value]).not.toMatch(/BE54|GB61|TRWIBEB|TRWIGB|belgisch|belgian|belgiskt/i);
    }
  });

  it("loads a matching subject and message and safely falls back to English", () => {
    expect(getInvoiceEmailTemplate("nl")).toEqual({
      subject: SUBJECT_TEMPLATES.nl,
      message: MESSAGE_TEMPLATES.nl,
    });
    expect(getInvoiceEmailTemplate("unsupported")).toEqual({
      subject: SUBJECT_TEMPLATES.en,
      message: MESSAGE_TEMPLATES.en,
    });
  });
});