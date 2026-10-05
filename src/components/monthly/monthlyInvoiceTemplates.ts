export const SUBJECT_TEMPLATES: Record<string, string> = {
  en: "AB MEDIA TEAM Invoice",
  de: "AB MEDIA TEAM Rechnung",
  nl: "AB MEDIA TEAM Factuur",
  fr: "Facture AB MEDIA TEAM",
  es: "Factura de AB MEDIA TEAM",
  da: "AB MEDIA TEAM-faktura",
  no: "AB MEDIA TEAM-faktura",
  cs: "Faktura AB MEDIA TEAM",
  pl: "Faktura AB MEDIA TEAM",
  sv: "AB MEDIA TEAM-faktura",
};

const SIGNATURE = `Annalena Klein

AB MEDIA

+49 203 7090 7262


Weseler Str. 73

47169 Duisburg`;

export const MESSAGE_TEMPLATES: Record<string, string> = {
  en: `Hello,

Thank you for your order.

Please find our current invoice attached.

Important payment information:

Please use the following bank details for payment:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

We kindly request that you settle the invoice amount within 3 days to ensure smooth and uninterrupted processing of your services.

Thank you for your attention.

Kind regards,

${SIGNATURE}`,

  de: `Hallo,

vielen Dank für Ihre Bestellung.

Anbei finden Sie unsere aktuelle Rechnung.

Wichtiger Hinweis zur Zahlung:

Bitte verwenden Sie für Ihre Zahlung die folgende Bankverbindung:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

Wir bitten Sie, den Rechnungsbetrag innerhalb von 3 Tagen zu begleichen, um eine reibungslose und ununterbrochene Bearbeitung Ihrer Dienstleistungen sicherzustellen.

Vielen Dank für Ihre Beachtung.

Mit freundlichen Grüßen

${SIGNATURE}`,

  nl: `Hallo,

Bedankt voor uw bestelling.

Bijgevoegd vindt u onze actuele factuur.

Belangrijke informatie over de betaling:

Gebruik voor uw betaling de volgende bankgegevens:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

Wij verzoeken u vriendelijk het factuurbedrag binnen 3 dagen te voldoen om een vlotte en ononderbroken verwerking van uw diensten te garanderen.

Hartelijk dank voor uw aandacht.

Met vriendelijke groet,

${SIGNATURE}`,

  fr: `Bonjour,

Merci pour votre commande.

Veuillez trouver ci-joint notre facture actuelle.

Information importante concernant le paiement :

Veuillez utiliser les coordonnées bancaires suivantes pour votre paiement :

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

Nous vous prions de bien vouloir régler le montant de la facture dans un délai de 3 jours afin d'assurer un traitement fluide et ininterrompu de vos services.

Nous vous remercions de votre attention.

Cordialement,

${SIGNATURE}`,

  es: `Hola,

Gracias por su pedido.

Adjunto encontrará nuestra factura actual.

Información importante sobre el pago:

Utilice los siguientes datos bancarios para su pago:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

Le rogamos que liquide el importe de la factura en un plazo de 3 días para garantizar un procesamiento fluido e ininterrumpido de sus servicios.

Gracias por su atención.

Un cordial saludo,

${SIGNATURE}`,

  da: `Hej,

Tak for din bestilling.

Vedlagt finder du vores aktuelle faktura.

Vigtig information om betalingen:

Brug følgende bankoplysninger til din betaling:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

Vi beder dig venligst om at betale fakturabeløbet inden for 3 dage for at sikre en problemfri og uafbrudt behandling af dine tjenester.

Tak for din opmærksomhed.

Med venlig hilsen,

${SIGNATURE}`,

  no: `Hei,

Takk for din bestilling.

Vedlagt finner du vår aktuelle faktura.

Viktig informasjon om betalingen:

Bruk følgende bankopplysninger for betalingen:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

Vi ber deg vennligst om å betale fakturabeløpet innen 3 dager for å sikre en smidig og uavbrutt behandling av dine tjenester.

Takk for at du tar hensyn til dette.

Med vennlig hilsen,

${SIGNATURE}`,

  cs: `Dobrý den,

děkujeme za Vaši objednávku.

V příloze naleznete naši aktuální fakturu.

Důležité informace k platbě:

Pro platbu použijte následující bankovní údaje:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

Žádáme Vás o uhrazení částky faktury do 3 dnů, aby bylo zajištěno plynulé a nepřerušené zpracování Vašich služeb.

Děkujeme, že této změně věnujete pozornost.

S pozdravem,

${SIGNATURE}`,

  pl: `Dzień dobry,

dziękujemy za Państwa zamówienie.

W załączeniu przesyłamy naszą aktualną fakturę.

Ważna informacja dotycząca płatności:

Do płatności prosimy użyć następujących danych bankowych:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

Uprzejmie prosimy o uregulowanie kwoty faktury w ciągu 3 dni w celu zapewnienia sprawnego i nieprzerwanego przetwarzania Państwa usług.

Dziękujemy za zwrócenie uwagi na tę zmianę.

Z poważaniem,

${SIGNATURE}`,

  sv: `Hej,

Tack för din beställning.

Bifogat finner du vår aktuella faktura.

Viktig information om betalningen:

Använd följande bankuppgifter för betalningen:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

Vi ber dig vänligen att betala fakturabeloppet inom 3 dagar för att säkerställa en smidig och oavbruten hantering av dina tjänster.

Tack för att ni uppmärksammar denna ändring.

Med vänliga hälsningar,

${SIGNATURE}`,
};

export const TEMPLATE_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "nl", label: "Nederlands" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "da", label: "Dansk" },
  { value: "no", label: "Norsk" },
  { value: "cs", label: "Čeština" },
  { value: "pl", label: "Polski" },
  { value: "sv", label: "Svenska" },
];

export const getInvoiceEmailTemplate = (language: string) => ({
  subject: SUBJECT_TEMPLATES[language] || SUBJECT_TEMPLATES.en,
  message: MESSAGE_TEMPLATES[language] || MESSAGE_TEMPLATES.en,
});
