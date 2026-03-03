export const SUBJECT_TEMPLATES: Record<string, string> = {
  en: "Invoice & Quick Payment Option AB MEDIA TEAM",
  de: "Rechnung & Schnelle Zahlungsoption AB MEDIA TEAM",
  nl: "Factuur & Snelle Betaaloptie AB MEDIA TEAM",
  fr: "Facture & Option de Paiement Rapide AB MEDIA TEAM",
  es: "Factura & Opción de Pago Rápido AB MEDIA TEAM",
  da: "Faktura & Hurtig Betalingsmulighed AB MEDIA TEAM",
  no: "Faktura & Rask Betalingsalternativ AB MEDIA TEAM",
  cs: "Faktura & Rychlá Platební Možnost AB MEDIA TEAM",
  pl: "Faktura & Szybka Opcja Płatności AB MEDIA TEAM",
  sv: "Faktura & Snabb Betalningsalternativ AB MEDIA TEAM",
};

const SIGNATURE = `Annalena Klein

AB MEDIA

+49 203 7090 7262


Weseler Str. 73

47169 Duisburg`;

export const MESSAGE_TEMPLATES: Record<string, string> = {
  en: `Hello,

Thank you for your order.

Please find enclosed our invoice.

We kindly request that you settle the invoice amount within 3 days to ensure smooth and uninterrupted processing of your services.



Kind regards,

${SIGNATURE}`,

  de: `Hallo,

vielen Dank für Ihre Bestellung.

Anbei finden Sie unsere Rechnung.

Wir bitten Sie, den Rechnungsbetrag innerhalb von 3 Tagen zu begleichen, um eine reibungslose und ununterbrochene Bearbeitung Ihrer Dienstleistungen sicherzustellen.



Mit freundlichen Grüßen,

${SIGNATURE}`,

  nl: `Hallo,

Bedankt voor uw bestelling.

Bijgevoegd vindt u onze factuur.

Wij verzoeken u vriendelijk het factuurbedrag binnen 3 dagen te voldoen om een vlotte en ononderbroken verwerking van uw diensten te garanderen.



Met vriendelijke groet,

${SIGNATURE}`,

  fr: `Bonjour,

Merci pour votre commande.

Veuillez trouver ci-joint notre facture.

Nous vous prions de bien vouloir régler le montant de la facture dans un délai de 3 jours afin d'assurer un traitement fluide et ininterrompu de vos services.



Cordialement,

${SIGNATURE}`,

  es: `Hola,

Gracias por su pedido.

Adjunto encontrará nuestra factura.

Le rogamos que liquide el importe de la factura en un plazo de 3 días para garantizar un procesamiento fluido e ininterrumpido de sus servicios.



Un cordial saludo,

${SIGNATURE}`,

  da: `Hej,

Tak for din bestilling.

Vedlagt finder du vores faktura.

Vi beder dig venligst om at betale fakturabeløbet inden for 3 dage for at sikre en problemfri og uafbrudt behandling af dine tjenester.



Med venlig hilsen,

${SIGNATURE}`,

  no: `Hei,

Takk for din bestilling.

Vedlagt finner du vår faktura.

Vi ber deg vennligst om å betale fakturabeløpet innen 3 dager for å sikre en smidig og uavbrutt behandling av dine tjenester.



Med vennlig hilsen,

${SIGNATURE}`,

  cs: `Dobrý den,

děkujeme za Vaši objednávku.

V příloze naleznete naši fakturu.

Žádáme Vás o uhrazení částky faktury do 3 dnů, aby bylo zajištěno plynulé a nepřerušené zpracování Vašich služeb.



S pozdravem,

${SIGNATURE}`,

  pl: `Dzień dobry,

dziękujemy za Państwa zamówienie.

W załączeniu przesyłamy naszą fakturę.

Uprzejmie prosimy o uregulowanie kwoty faktury w ciągu 3 dni w celu zapewnienia sprawnego i nieprzerwanego przetwarzania Państwa usług.



Z poważaniem,

${SIGNATURE}`,

  sv: `Hej,

Tack för din beställning.

Bifogat finner du vår faktura.

Vi ber dig vänligen att betala fakturabeloppet inom 3 dagar för att säkerställa en smidig och oavbruten hantering av dina tjänster.



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
