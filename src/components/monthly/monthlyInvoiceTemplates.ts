export const SUBJECT_TEMPLATES: Record<string, string> = {
  en: "AB MEDIA TEAM Invoice – Please note our new bank details",
  de: "AB MEDIA TEAM Rechnung – Bitte neue Bankverbindung beachten",
  nl: "AB MEDIA TEAM Factuur – Let op onze nieuwe bankgegevens",
  fr: "Facture AB MEDIA TEAM – Veuillez noter nos nouvelles coordonnées bancaires",
  es: "Factura de AB MEDIA TEAM – Tenga en cuenta nuestros nuevos datos bancarios",
  da: "AB MEDIA TEAM-faktura – Bemærk venligst vores nye bankoplysninger",
  no: "AB MEDIA TEAM-faktura – Vennligst merk våre nye bankopplysninger",
  cs: "Faktura AB MEDIA TEAM – Věnujte prosím pozornost našim novým bankovním údajům",
  pl: "Faktura AB MEDIA TEAM – Prosimy zwrócić uwagę na nowe dane bankowe",
  sv: "AB MEDIA TEAM-faktura – Observera våra nya bankuppgifter",
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

We are now using a new Belgian bank account. Please use only the following new bank details for this and all future payments:

IBAN: BE54 90 59 97 86 7497

SWIFT/BIC: TRWIBEB1XXX

Please do not transfer the invoice amount to our previous bank account, even if it is already saved as a payee in your records.

We kindly request that you settle the invoice amount within 3 days to ensure smooth and uninterrupted processing of your services.

Thank you for your attention.

Kind regards,

${SIGNATURE}`,

  de: `Hallo,

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

${SIGNATURE}`,

  nl: `Hallo,

Bedankt voor uw bestelling.

Bijgevoegd vindt u onze actuele factuur.

Belangrijke informatie over de betaling:

Vanaf nu gebruiken wij een nieuwe Belgische bankrekening. Gebruik voor deze en alle toekomstige betalingen uitsluitend de volgende nieuwe bankgegevens:

IBAN: BE54 90 59 97 86 7497

SWIFT/BIC: TRWIBEB1XXX

Maak het factuurbedrag niet over naar onze vorige bankrekening, ook niet als deze al als begunstigde bij u is opgeslagen.

Wij verzoeken u vriendelijk het factuurbedrag binnen 3 dagen te voldoen om een vlotte en ononderbroken verwerking van uw diensten te garanderen.

Hartelijk dank voor uw aandacht.

Met vriendelijke groet,

${SIGNATURE}`,

  fr: `Bonjour,

Merci pour votre commande.

Veuillez trouver ci-joint notre facture actuelle.

Information importante concernant le paiement :

Nous utilisons désormais un nouveau compte bancaire belge. Pour ce paiement et tous les paiements futurs, veuillez utiliser exclusivement les nouvelles coordonnées bancaires suivantes :

IBAN : BE54 90 59 97 86 7497

SWIFT/BIC : TRWIBEB1XXX

Veuillez ne pas virer le montant de la facture sur notre ancien compte bancaire, même si celui-ci est déjà enregistré comme bénéficiaire dans votre système.

Nous vous prions de bien vouloir régler le montant de la facture dans un délai de 3 jours afin d'assurer un traitement fluide et ininterrompu de vos services.

Nous vous remercions de votre attention.

Cordialement,

${SIGNATURE}`,

  es: `Hola,

Gracias por su pedido.

Adjunto encontrará nuestra factura actual.

Información importante sobre el pago:

A partir de ahora utilizamos una nueva cuenta bancaria belga. Para este y todos los pagos futuros, utilice exclusivamente los siguientes datos bancarios nuevos:

IBAN: BE54 90 59 97 86 7497

SWIFT/BIC: TRWIBEB1XXX

No transfiera el importe de la factura a nuestra cuenta bancaria anterior, aunque ya la tenga guardada como beneficiario.

Le rogamos que liquide el importe de la factura en un plazo de 3 días para garantizar un procesamiento fluido e ininterrumpido de sus servicios.

Gracias por su atención.

Un cordial saludo,

${SIGNATURE}`,

  da: `Hej,

Tak for din bestilling.

Vedlagt finder du vores aktuelle faktura.

Vigtig information om betalingen:

Vi bruger fra nu af en ny belgisk bankkonto. Brug udelukkende følgende nye bankoplysninger til denne og alle fremtidige betalinger:

IBAN: BE54 90 59 97 86 7497

SWIFT/BIC: TRWIBEB1XXX

Overfør venligst ikke fakturabeløbet til vores tidligere bankkonto, selv om den allerede er gemt som betalingsmodtager hos jer.

Vi beder dig venligst om at betale fakturabeløbet inden for 3 dage for at sikre en problemfri og uafbrudt behandling af dine tjenester.

Tak for din opmærksomhed.

Med venlig hilsen,

${SIGNATURE}`,

  no: `Hei,

Takk for din bestilling.

Vedlagt finner du vår aktuelle faktura.

Viktig informasjon om betalingen:

Fra nå av bruker vi en ny belgisk bankkonto. Bruk kun følgende nye bankopplysninger for denne og alle fremtidige betalinger:

IBAN: BE54 90 59 97 86 7497

SWIFT/BIC: TRWIBEB1XXX

Ikke overfør fakturabeløpet til vår tidligere bankkonto, selv om den allerede er lagret som betalingsmottaker hos dere.

Vi ber deg vennligst om å betale fakturabeløpet innen 3 dager for å sikre en smidig og uavbrutt behandling av dine tjenester.

Takk for at du tar hensyn til dette.

Med vennlig hilsen,

${SIGNATURE}`,

  cs: `Dobrý den,

děkujeme za Vaši objednávku.

V příloze naleznete naši aktuální fakturu.

Důležité informace k platbě:

Od této chvíle používáme nový belgický bankovní účet. Pro tuto a všechny budoucí platby používejte výhradně následující nové bankovní údaje:

IBAN: BE54 90 59 97 86 7497

SWIFT/BIC: TRWIBEB1XXX

Částku faktury prosím neposílejte na náš předchozí bankovní účet, i když jej již máte uložený jako příjemce platby.

Žádáme Vás o uhrazení částky faktury do 3 dnů, aby bylo zajištěno plynulé a nepřerušené zpracování Vašich služeb.

Děkujeme, že této změně věnujete pozornost.

S pozdravem,

${SIGNATURE}`,

  pl: `Dzień dobry,

dziękujemy za Państwa zamówienie.

W załączeniu przesyłamy naszą aktualną fakturę.

Ważna informacja dotycząca płatności:

Od teraz korzystamy z nowego belgijskiego rachunku bankowego. Do tej oraz wszystkich przyszłych płatności prosimy używać wyłącznie następujących nowych danych bankowych:

IBAN: BE54 90 59 97 86 7497

SWIFT/BIC: TRWIBEB1XXX

Prosimy nie przelewać kwoty faktury na nasz dotychczasowy rachunek bankowy, nawet jeśli jest on już zapisany u Państwa jako odbiorca płatności.

Uprzejmie prosimy o uregulowanie kwoty faktury w ciągu 3 dni w celu zapewnienia sprawnego i nieprzerwanego przetwarzania Państwa usług.

Dziękujemy za zwrócenie uwagi na tę zmianę.

Z poważaniem,

${SIGNATURE}`,

  sv: `Hej,

Tack för din beställning.

Bifogat finner du vår aktuella faktura.

Viktig information om betalningen:

Från och med nu använder vi ett nytt belgiskt bankkonto. Använd endast följande nya bankuppgifter för denna och alla framtida betalningar:

IBAN: BE54 90 59 97 86 7497

SWIFT/BIC: TRWIBEB1XXX

Överför inte fakturabeloppet till vårt tidigare bankkonto, även om det redan finns sparat som betalningsmottagare hos er.

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
