import { describe, expect, it } from "vitest";
import {
  getInvoiceEmailTemplate,
  MESSAGE_TEMPLATES,
  SUBJECT_TEMPLATES,
  TEMPLATE_LANGUAGES,
} from "../monthlyInvoiceTemplates";

const NEW_IBAN = "IBAN: BE54 90 59 97 86 7497";
const NEW_BIC = "SWIFT/BIC: TRWIBEB1XXX";
const RETIRED_IBAN = "BE79967023897833";

describe("invoice email templates", () => {
  it("uses the exact approved German subject and message", () => {
    expect(SUBJECT_TEMPLATES.de).toBe(
      "AB MEDIA TEAM Rechnung – Bitte neue Bankverbindung beachten",
    );
    expect(MESSAGE_TEMPLATES.de).toBe(`Hallo,

vielen Dank für Ihre Bestellung.

Anbei finden Sie unsere aktuelle Rechnung.

Wichtiger Hinweis zur Zahlung:

Wir verwenden ab sofort eine neue belgische Bankverbindung. Bitte verwenden Sie für diese und alle zukünftigen Zahlungen ausschließlich die folgende neue Bankverbindung:

IBAN: BE54 90 59 97 86 7497

SWIFT/BIC: TRWIBEB1XXX

Bitte überweisen Sie den Rechnungsbetrag nicht auf unsere bisherige Bankverbindung, auch wenn diese bei Ihnen bereits als Zahlungsempfänger gespeichert ist.

Wir bitten Sie, den Rechnungsbetrag innerhalb von 3 Tagen zu begleichen, um eine reibungslose und ununterbrochene Bearbeitung Ihrer Dienstleistungen sicherzustellen.

Vielen Dank für Ihre Beachtung.

Mit freundlichen Grüßen

Annalena Klein

AB MEDIA

+49 203 7090 7262


Weseler Str. 73

47169 Duisburg`);
  });

  it("provides the new bank notice in every selectable language", () => {
    expect(TEMPLATE_LANGUAGES).toHaveLength(10);

    for (const { value } of TEMPLATE_LANGUAGES) {
      expect(SUBJECT_TEMPLATES[value]).toContain("AB MEDIA TEAM");
      expect(MESSAGE_TEMPLATES[value]).toContain(NEW_IBAN);
      expect(MESSAGE_TEMPLATES[value]).toContain(NEW_BIC);
      expect(MESSAGE_TEMPLATES[value]).toMatch(/3 (days|Tagen|dagen|jours|días|dage|dnů|dni|dagar)/i);
      expect(MESSAGE_TEMPLATES[value]).toContain("Annalena Klein");
      expect(MESSAGE_TEMPLATES[value]).toContain("+49 203 7090 7262");
      expect(MESSAGE_TEMPLATES[value]).not.toContain(RETIRED_IBAN);
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