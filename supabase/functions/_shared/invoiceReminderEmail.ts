// --- Language detection from address ---
export const detectLanguageFromAddress = (address: string | null | undefined): string => {
  if (!address) return "en";
  const lower = address.toLowerCase();
  const map: [RegExp, string][] = [
    [/deutschland|germany/i, "de"],
    [/nederland|netherlands|holland/i, "nl"],
    [/france|frankreich|français/i, "fr"],
    [/españa|spain|spanien/i, "es"],
    [/danmark|denmark|dänemark/i, "da"],
    [/norge|norway|norwegen/i, "no"],
    [/česko|czech|tschech/i, "cs"],
    [/polska|poland|polen/i, "pl"],
    [/sverige|sweden|schweden/i, "sv"],
  ];
  for (const [regex, lang] of map) {
    if (regex.test(lower)) return lang;
  }
  return "en";
};

// --- Translations for client-facing emails ---
interface ReminderTranslations {
  subjectPrefix: string;
  invoiceLabel: string;
  urgency: [string, string, string]; // [normal, follow-up, urgent]
  greeting: string; // {name} placeholder
  amountDue: string;
  orderDescription: string;
  footer: string;
}

const translations: Record<string, ReminderTranslations> = {
  en: {
    subjectPrefix: "Payment Reminder",
    invoiceLabel: "Invoice",
    urgency: ["Payment Reminder", "Payment Reminder Follow-Up", "Urgent Payment Reminder"],
    greeting: "Dear {name}, this is a friendly reminder that your invoice is still pending payment.",
    amountDue: "Amount Due",
    orderDescription: "Order Description",
    footer: "This is an automated payment reminder from",
  },
  de: {
    subjectPrefix: "Zahlungserinnerung",
    invoiceLabel: "Rechnung",
    urgency: ["Zahlungserinnerung", "Zahlungserinnerung – Folgemahnung", "Dringende Zahlungserinnerung"],
    greeting: "Sehr geehrte/r {name}, wir möchten Sie freundlich daran erinnern, dass Ihre Rechnung noch zur Zahlung aussteht.",
    amountDue: "Offener Betrag",
    orderDescription: "Auftragsbeschreibung",
    footer: "Dies ist eine automatische Zahlungserinnerung von",
  },
  nl: {
    subjectPrefix: "Betalingsherinnering",
    invoiceLabel: "Factuur",
    urgency: ["Betalingsherinnering", "Betalingsherinnering – Opvolging", "Dringende Betalingsherinnering"],
    greeting: "Beste {name}, dit is een vriendelijke herinnering dat uw factuur nog openstaat.",
    amountDue: "Openstaand Bedrag",
    orderDescription: "Bestelbeschrijving",
    footer: "Dit is een automatische betalingsherinnering van",
  },
  fr: {
    subjectPrefix: "Rappel de paiement",
    invoiceLabel: "Facture",
    urgency: ["Rappel de paiement", "Rappel de paiement – Suivi", "Rappel de paiement urgent"],
    greeting: "Cher/Chère {name}, nous vous rappelons aimablement que votre facture est toujours en attente de paiement.",
    amountDue: "Montant dû",
    orderDescription: "Description de la commande",
    footer: "Ceci est un rappel de paiement automatique de",
  },
  es: {
    subjectPrefix: "Recordatorio de pago",
    invoiceLabel: "Factura",
    urgency: ["Recordatorio de pago", "Recordatorio de pago – Seguimiento", "Recordatorio de pago urgente"],
    greeting: "Estimado/a {name}, le recordamos amablemente que su factura aún está pendiente de pago.",
    amountDue: "Importe pendiente",
    orderDescription: "Descripción del pedido",
    footer: "Este es un recordatorio de pago automático de",
  },
  da: {
    subjectPrefix: "Betalingspåmindelse",
    invoiceLabel: "Faktura",
    urgency: ["Betalingspåmindelse", "Betalingspåmindelse – Opfølgning", "Hastende betalingspåmindelse"],
    greeting: "Kære {name}, dette er en venlig påmindelse om, at din faktura stadig afventer betaling.",
    amountDue: "Udestående beløb",
    orderDescription: "Bestillingsbeskrivelse",
    footer: "Dette er en automatisk betalingspåmindelse fra",
  },
  no: {
    subjectPrefix: "Betalingspåminnelse",
    invoiceLabel: "Faktura",
    urgency: ["Betalingspåminnelse", "Betalingspåminnelse – Oppfølging", "Haster – Betalingspåminnelse"],
    greeting: "Kjære {name}, dette er en vennlig påminnelse om at din faktura fortsatt venter på betaling.",
    amountDue: "Utestående beløp",
    orderDescription: "Bestillingsbeskrivelse",
    footer: "Dette er en automatisk betalingspåminnelse fra",
  },
  cs: {
    subjectPrefix: "Upomínka k platbě",
    invoiceLabel: "Faktura",
    urgency: ["Upomínka k platbě", "Upomínka k platbě – připomenutí", "Naléhavá upomínka k platbě"],
    greeting: "Vážený/á {name}, dovolujeme si Vám připomenout, že Vaše faktura stále čeká na úhradu.",
    amountDue: "Dlužná částka",
    orderDescription: "Popis objednávky",
    footer: "Toto je automatická upomínka k platbě od",
  },
  pl: {
    subjectPrefix: "Przypomnienie o płatności",
    invoiceLabel: "Faktura",
    urgency: ["Przypomnienie o płatności", "Przypomnienie o płatności – kontynuacja", "Pilne przypomnienie o płatności"],
    greeting: "Szanowny/a {name}, uprzejmie przypominamy, że Państwa faktura wciąż oczekuje na płatność.",
    amountDue: "Kwota do zapłaty",
    orderDescription: "Opis zamówienia",
    footer: "To jest automatyczne przypomnienie o płatności od",
  },
  sv: {
    subjectPrefix: "Betalningspåminnelse",
    invoiceLabel: "Faktura",
    urgency: ["Betalningspåminnelse", "Betalningspåminnelse – Uppföljning", "Brådskande betalningspåminnelse"],
    greeting: "Bäste {name}, detta är en vänlig påminnelse om att din faktura fortfarande väntar på betalning.",
    amountDue: "Utestående belopp",
    orderDescription: "Orderbeskrivning",
    footer: "Detta är en automatisk betalningspåminnelse från",
  },
};

export const getTranslations = (lang: string): ReminderTranslations => translations[lang] || translations.en;

const approvedClientCopy: Record<string, string> = {
  en: `<p>Hello,</p><p>We would like to kindly remind you that we have not yet received your payment!</p><p>Your payment means a lot to us as motivation for continuing our work on your project, and it also covers our costs, as we have substantial investments that compel us to remind you about payments.</p><p>It would be nice if you could let us know when you were planning to pay our invoice.</p><p>Kind regards,<br>Annalena Klein<br>Media Marketing<br>+49 203 7090 7262</p>`,
  de: `<p>Hallo,</p><p>Wir möchten Sie freundlich daran erinnern, dass wir Ihre Zahlung noch nicht erhalten haben!</p><p>Ihre Zahlung bedeutet uns viel als Motivation für die weitere Arbeit an Ihrem Projekt, und sie deckt auch unsere Kosten, da wir hohe Investitionen haben, aufgrund derer wir gezwungen sind, Sie an die Zahlungen zu erinnern.</p><p>Es wäre schön, wenn Sie uns mitteilen würden, wann Sie vorhatten, unsere Rechnung zu bezahlen.</p><p>Herzliche Grüße<br>Annalena Klein<br>Media Marketing<br>+49 203 7090 7262</p>`,
};

// Mirrors RESOLVED_SERVICE_NOTICE in src/services/paymentReminderCopy.ts (en/de).
const resolvedNotice: Record<string, string> = {
  en: "We are pleased to confirm that the service for this order has been fully completed and resolved. As all work has now been delivered, the outstanding invoice amount of {amount} is due for payment. We kindly ask you to settle it as soon as possible.",
  de: "Wir freuen uns, Ihnen mitzuteilen, dass die Leistung zu diesem Auftrag vollständig erbracht und abgeschlossen wurde. Da alle Arbeiten nun geliefert sind, ist der offene Rechnungsbetrag von {amount} zur Zahlung fällig. Wir bitten Sie, diesen so bald wie möglich zu begleichen.",
  nl: "Wij bevestigen graag dat de dienstverlening voor deze opdracht volledig is afgerond. Aangezien alle werkzaamheden nu zijn geleverd, is het openstaande factuurbedrag van {amount} verschuldigd. Wij verzoeken u vriendelijk dit zo spoedig mogelijk te voldoen.",
  fr: "Nous avons le plaisir de vous confirmer que la prestation pour cette commande a été entièrement réalisée et finalisée. L'ensemble des travaux ayant été livré, le montant restant dû de {amount} est désormais exigible. Nous vous prions de bien vouloir le régler dans les meilleurs délais.",
  es: "Nos complace confirmarle que el servicio de este pedido se ha completado y finalizado en su totalidad. Dado que todo el trabajo ya ha sido entregado, el importe pendiente de la factura de {amount} es exigible. Le rogamos que lo abone lo antes posible.",
  da: "Vi kan med glæde bekræfte, at ydelsen for denne ordre er fuldt udført og afsluttet. Da alt arbejde nu er leveret, forfalder det udestående fakturabeløb på {amount} til betaling. Vi beder Dem venligst betale det hurtigst muligt.",
  no: "Vi bekrefter gjerne at tjenesten for denne ordren er fullført og avsluttet. Siden alt arbeid nå er levert, forfaller det utestående fakturabeløpet på {amount} til betaling. Vi ber deg vennligst betale så snart som mulig.",
  cs: "S potěšením potvrzujeme, že služba k této objednávce byla zcela dokončena a uzavřena. Vzhledem k tomu, že veškerá práce byla dodána, je dlužná částka faktury {amount} nyní splatná. Prosíme o její úhradu co nejdříve.",
  pl: "Z przyjemnością potwierdzamy, że usługa dla tego zamówienia została w pełni zrealizowana i zakończona. Ponieważ wszystkie prace zostały dostarczone, zaległa kwota faktury w wysokości {amount} jest teraz wymagalna. Uprzejmie prosimy o jej uregulowanie jak najszybciej.",
  sv: "Vi bekräftar gärna att tjänsten för denna beställning är helt slutförd och avslutad. Eftersom allt arbete nu har levererats förfaller det utestående fakturabeloppet på {amount} till betalning. Vi ber er vänligen betala så snart som möjligt.",
};

export const formatPrice = (amount: number, currency: string) => {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${Number(amount).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const buildReminderEmailHtml = (data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  companyAddress: string;
  companyName: string;
  description: string;
  invoiceNumber: string;
  amount: string;
  reminderNumber: number;
  isClientEmail: boolean;
  language: string;
  isResolved?: boolean;
}) => {
  const t = getTranslations(data.isClientEmail ? data.language : 'en');
  const initial = (data.clientName || 'C').charAt(0).toUpperCase();
  const urgencyColor = data.reminderNumber >= 3 ? '#dc2626' : data.reminderNumber >= 2 ? '#f59e0b' : '#1e3a5f';
  const urgencyIdx = data.reminderNumber >= 3 ? 2 : data.reminderNumber >= 2 ? 1 : 0;
  const urgencyLabel = t.urgency[urgencyIdx];

  const subtitleText = data.isClientEmail
    ? (approvedClientCopy[data.language] ? '' : t.greeting.replace('{name}', data.clientName))
    : `Payment reminder #${data.reminderNumber} for invoice ${data.invoiceNumber} — follow up required.`;

  return `<!DOCTYPE html>
<html lang="${data.isClientEmail ? data.language : 'en'}">
<head><meta charset="UTF-8"><title>${urgencyLabel} - Media Marketing</title></head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff; padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; background-color:#ffffff;">
        <!-- Header -->
        <tr><td style="padding:22px 32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td align="left" style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:${urgencyColor}; font-weight:bold;">${urgencyLabel} #${data.reminderNumber}</td>
            <td align="right" style="font-family:Roboto,Arial,sans-serif; font-size:18px; font-weight:bold; color:#1e3a5f;">Media Marketing</td>
          </tr></table>
        </td></tr>

        <!-- Stars -->
        <tr><td style="text-align:center; padding:32px 24px 0px;">
          <div style="font-size:48px; color:#fbbc05; letter-spacing:8px; line-height:1;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        </td></tr>

        <!-- Illustration -->
        <tr><td style="text-align:center; padding:8px 24px 0px;">
          <img src="https://www.gstatic.com/gumdrop/files/gmb-migration-transparent-w726-h298-2x.png" width="363" height="auto" border="0" alt="" style="display:inline-block; max-width:363px; width:100%;">
        </td></tr>

        <!-- Title -->
        <tr><td style="text-align:center; padding:20px 32px 8px;">
          <h1 style="font-family:Roboto,Arial,sans-serif; font-size:22px; font-weight:700; color:#0f1b3d; margin:0;">
            💰 ${urgencyLabel}
          </h1>
          <p style="font-family:Roboto,Arial,sans-serif; font-size:14px; color:#5f6368; margin:8px 0 0;">
            ${subtitleText}
          </p>
          ${(() => {
            if (!data.isClientEmail) return '';
            const notice = data.isResolved ? `<p>${(resolvedNotice[data.language] || resolvedNotice.en).replace('{amount}', data.amount)}</p>` : '';
            const copy = approvedClientCopy[data.language];
            const inner = copy ? copy.replace('</p>', `</p>${notice}`) : notice;
            return inner ? `<div style="font-family:Roboto,Arial,sans-serif; font-size:14px; color:#0f1b3d; line-height:1.7; text-align:left; margin:20px 0 0;">${inner}</div>` : '';
          })()}
        </td></tr>

        <!-- Invoice Details Card -->
        <tr><td style="padding:16px 32px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa; border-radius:12px; border:1px solid #e8eaed;">
            <tr><td style="padding:20px 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr><td colspan="2" style="padding-bottom:12px; border-bottom:1px solid #e8eaed;">
                  <span style="font-family:Roboto,Arial,sans-serif; font-size:16px; font-weight:700; color:#0f1b3d;">${t.invoiceLabel} ${data.invoiceNumber}</span>
                </td></tr>
                <tr><td style="padding-top:12px; font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368;">${t.amountDue}</td>
                    <td style="padding-top:12px; font-family:Roboto,Arial,sans-serif; font-size:16px; font-weight:700; color:${urgencyColor}; text-align:right;">${data.amount}</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Client Details Card -->
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa; border-radius:12px; border:1px solid #e8eaed;">
            <tr><td style="padding:20px 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="44" valign="top">
                    <div style="width:40px; height:40px; border-radius:50%; background-color:#1e3a5f; color:#ffffff; font-family:Roboto,Arial,sans-serif; font-size:18px; font-weight:700; text-align:center; line-height:40px;">${initial}</div>
                  </td>
                  <td style="padding-left:12px; vertical-align:top;">
                    <div style="font-family:Roboto,Arial,sans-serif; font-size:15px; font-weight:700; color:#0f1b3d;">${data.companyName}</div>
                    <div style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368; margin-top:2px;">${data.clientName}</div>
                  </td>
                </tr>
                ${data.clientEmail ? `<tr><td colspan="2" style="padding-top:10px;"><div style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368;">📧 ${data.clientEmail}</div></td></tr>` : ''}
                ${data.clientPhone ? `<tr><td colspan="2" style="padding-top:4px;"><div style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368;">📱 ${data.clientPhone}</div></td></tr>` : ''}
                ${data.companyAddress ? `<tr><td colspan="2" style="padding-top:4px;"><div style="font-family:Roboto,Arial,sans-serif; font-size:13px; color:#5f6368;">📍 ${data.companyAddress}</div></td></tr>` : ''}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Order Description -->
        ${data.description ? `
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#e8f0fe; border-radius:12px; border:1px solid #e8edf3;">
            <tr><td style="padding:16px 24px;">
              <div style="font-family:Roboto,Arial,sans-serif; font-size:12px; color:#1e3a5f; font-weight:700; text-transform:uppercase; margin-bottom:6px;">${t.orderDescription}</div>
              <div style="font-family:Roboto,Arial,sans-serif; font-size:14px; color:#0f1b3d;">${data.description}</div>
            </td></tr>
          </table>
        </td></tr>
        ` : ''}

        <!-- Bank Payment Details -->
        <tr><td style="padding:0 32px 16px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0f7ff; border-radius:12px; border:1px solid #e8edf3;">
            <tr><td style="padding:20px 24px;">
              <div style="font-family:Roboto,Arial,sans-serif; font-size:16px; font-weight:700; color:#1e3a5f; margin-bottom:15px;">🏦 Payment Information</div>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                <tr><td colspan="2" style="font-weight:bold; padding:8px 0 4px; color:#0f1b3d; font-family:Roboto,Arial,sans-serif; font-size:14px;">German Bank Account</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">IBAN:</td><td style="color:#0f1b3d; font-family:Roboto,Arial,sans-serif; font-size:13px;">DE91240703680071572200</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">BIC:</td><td style="color:#0f1b3d; font-family:Roboto,Arial,sans-serif; font-size:13px;">DEUTDE2HP22</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">Bank:</td><td style="color:#0f1b3d; font-family:Roboto,Arial,sans-serif; font-size:13px;">Postbank/DSL Ndl of Deutsche Bank</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">IBAN:</td><td style="color:#0f1b3d; font-family:Roboto,Arial,sans-serif; font-size:13px;">GB40REVO23012083344414</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">BIC:</td><td style="color:#0f1b3d; font-family:Roboto,Arial,sans-serif; font-size:13px;">REVOGB21</td></tr>
                <tr><td style="color:#5f6368; padding:3px 0; font-family:Roboto,Arial,sans-serif; font-size:13px;">Bank:</td><td style="color:#0f1b3d; font-family:Roboto,Arial,sans-serif; font-size:13px;">Revolut Ltd</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 32px; border-top:1px solid #e8eaed;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
            <td style="font-family:Roboto,Arial,sans-serif; font-size:11px; color:#9aa0a6; text-align:center;">
              ${t.footer} <strong>Media Marketing</strong><br>
              ${data.isClientEmail ? `${urgencyLabel}` : `Reminder`} #${data.reminderNumber} • ${new Date().toLocaleDateString('de-DE')}
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

