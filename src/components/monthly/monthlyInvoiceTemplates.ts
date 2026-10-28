export const SUBJECT_TEMPLATES: Record<string, string> = {
  en: "Media Marketing Invoice",
  de: "Media Marketing Rechnung",
  nl: "Media Marketing Factuur",
  fr: "Facture Media Marketing",
  es: "Factura de Media Marketing",
  da: "Media Marketing-faktura",
  no: "Media Marketing-faktura",
  cs: "Faktura Media Marketing",
  pl: "Faktura Media Marketing",
  sv: "Media Marketing-faktura",
};

const SIGNATURE = `Annalena Klein

Media Marketing

+49 203 7090 7262

invoice@mediaamarketing.com

Düsseldorfer Str. 32

47051 Duisburg`;

export const MESSAGE_TEMPLATES: Record<string, string> = {
  en: `Hello,

Thank you for your order.

Please find our current invoice attached.

Important payment information:

Please use the following bank details for payment:

IBAN: DE91 2407 0368 0071 5722 00

SWIFT/BIC: DEUTDE2HP22

Bank: Postbank/DSL Ndl of Deutsche Bank

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

We kindly request that you settle the invoice amount by the due date stated on the invoice to ensure smooth and uninterrupted processing of your services.

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

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Wir bitten Sie, den Rechnungsbetrag bis zu dem auf der Rechnung angegebenen Fälligkeitsdatum zu begleichen, um eine reibungslose und ununterbrochene Bearbeitung Ihrer Dienstleistungen sicherzustellen.

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

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Wij verzoeken u vriendelijk het factuurbedrag uiterlijk op de op de factuur vermelde vervaldatum te voldoen om een vlotte en ononderbroken verwerking van uw diensten te garanderen.

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

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Nous vous prions de bien vouloir régler le montant de la facture au plus tard à la date d'échéance indiquée sur la facture afin d'assurer un traitement fluide et ininterrompu de vos services.

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

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Le rogamos que liquide el importe de la factura a más tardar en la fecha de vencimiento indicada en la factura para garantizar un procesamiento fluido e ininterrumpido de sus servicios.

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

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Vi beder dig venligst om at betale fakturabeløbet senest på den forfaldsdato, der er angivet på fakturaen for at sikre en problemfri og uafbrudt behandling af dine tjenester.

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

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Vi ber deg vennligst om å betale fakturabeløpet innen forfallsdatoen som er angitt på fakturaen for å sikre en smidig og uavbrutt behandling av dine tjenester.

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

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Žádáme Vás o uhrazení částky faktury do data splatnosti uvedeného na faktuře, aby bylo zajištěno plynulé a nepřerušené zpracování Vašich služeb.

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

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Uprzejmie prosimy o uregulowanie kwoty faktury do terminu płatności wskazanego na fakturze w celu zapewnienia sprawnego i nieprzerwanego przetwarzania Państwa usług.

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

IBAN: GB40 REVO 2301 2083 3444 14

SWIFT/BIC: REVOGB21

Bank: Revolut Ltd

Vi ber dig vänligen att betala fakturabeloppet senast på det förfallodatum som anges på fakturan för att säkerställa en smidig och oavbruten hantering av dina tjänster.

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

/** Removes the bank-details block (heading, intro and IBAN/BIC/Bank lines) from a message. */
export const stripBankDetails = (message: string): string => {
  const lines = message.split("\n");
  const first = lines.findIndex((l) => l.trim().startsWith("IBAN:"));
  if (first === -1) return message;
  let last = first;
  lines.forEach((l, i) => { if (/^(IBAN|SWIFT\/BIC|BIC|Bank|Banka|Banque|Banco|Bankas)\s*:/i.test(l.trim())) last = Math.max(last, i); });
  // Walk back over the intro sentence and the "payment information" heading (two non-empty lines).
  let start = first, found = 0;
  for (let i = first - 1; i >= 0 && found < 2; i--) {
    if (lines[i].trim()) { start = i; found++; }
  }
  const out = [...lines.slice(0, start), ...lines.slice(last + 1)].join("\n");
  return out.replace(/\n{3,}/g, "\n\n");
};

/** Templates for the invoice "Send to Client" email: no bank details (the PDF carries them). */
export const CLIENT_MESSAGE_TEMPLATES: Record<string, string> = Object.fromEntries(
  Object.entries(MESSAGE_TEMPLATES).map(([k, v]) => [k, stripBankDetails(v)])
);

export const getClientInvoiceEmailTemplate = (language: string) => ({
  subject: CLIENT_SUBJECT_TEMPLATES[language] || SUBJECT_TEMPLATES.en,
  message: CLIENT_MESSAGE_TEMPLATES[language] || CLIENT_MESSAGE_TEMPLATES.en,
});

// Extra "Send to Client" languages (invoice languages beyond the monthly-package set). No bank details.
type ClientCopy = { subject: string; hello: string; thanks: string; attached: string; pay: string; closing: string; regards: string };
const EXTRA_CLIENT_COPY: Record<string, ClientCopy & { label: string }> = {
  it: { label: "Italiano", subject: "Fattura Media Marketing", hello: "Buongiorno,", thanks: "La ringraziamo per il Suo ordine.", attached: "In allegato trova la nostra fattura attuale.", pay: "La preghiamo gentilmente di saldare l'importo della fattura entro la data di scadenza indicata sulla fattura, per garantire un'elaborazione regolare e senza interruzioni dei Suoi servizi.", closing: "Grazie per la Sua attenzione.", regards: "Cordiali saluti," },
  ru: { label: "Русский", subject: "Счёт Media Marketing", hello: "Здравствуйте,", thanks: "Благодарим Вас за заказ.", attached: "Во вложении Вы найдёте наш текущий счёт.", pay: "Просим Вас оплатить сумму счёта до срока оплаты, указанного в счёте, чтобы обеспечить бесперебойное оказание Ваших услуг.", closing: "Благодарим за внимание.", regards: "С уважением," },
  uk: { label: "Українська", subject: "Рахунок Media Marketing", hello: "Добрий день,", thanks: "Дякуємо за Ваше замовлення.", attached: "У вкладенні Ви знайдете наш поточний рахунок.", pay: "Просимо Вас сплатити суму рахунку до терміну оплати, зазначеного в рахунку, щоб забезпечити безперебійне надання Ваших послуг.", closing: "Дякуємо за увагу.", regards: "З повагою," },
  ro: { label: "Română", subject: "Factură Media Marketing", hello: "Bună ziua,", thanks: "Vă mulțumim pentru comanda dumneavoastră.", attached: "Atașat găsiți factura noastră curentă.", pay: "Vă rugăm să achitați suma facturii până la data scadenței menționată pe factură, pentru a asigura procesarea fără întreruperi a serviciilor dumneavoastră.", closing: "Vă mulțumim pentru atenție.", regards: "Cu stimă," },
  tr: { label: "Türkçe", subject: "Media Marketing Faturası", hello: "Merhaba,", thanks: "Siparişiniz için teşekkür ederiz.", attached: "Güncel faturamızı ekte bulabilirsiniz.", pay: "Hizmetlerinizin sorunsuz ve kesintisiz devam etmesi için fatura tutarını faturada belirtilen vade tarihine kadar ödemenizi rica ederiz.", closing: "İlginiz için teşekkür ederiz.", regards: "Saygılarımızla," },
  pt: { label: "Português", subject: "Fatura Media Marketing", hello: "Olá,", thanks: "Obrigado pela sua encomenda.", attached: "Em anexo encontra a nossa fatura atual.", pay: "Pedimos que efetue o pagamento do valor da fatura até à data de vencimento indicada na fatura, para garantir o processamento regular e ininterrupto dos seus serviços.", closing: "Obrigado pela sua atenção.", regards: "Com os melhores cumprimentos," },
  hu: { label: "Magyar", subject: "Media Marketing számla", hello: "Jó napot kívánunk!", thanks: "Köszönjük megrendelését.", attached: "Mellékelten küldjük aktuális számlánkat.", pay: "Kérjük, hogy szolgáltatásai zavartalan teljesítése érdekében a számla összegét a számlán feltüntetett fizetési határidőig egyenlítse ki.", closing: "Köszönjük figyelmét.", regards: "Üdvözlettel," },
  el: { label: "Ελληνικά", subject: "Τιμολόγιο Media Marketing", hello: "Γεια σας,", thanks: "Σας ευχαριστούμε για την παραγγελία σας.", attached: "Επισυνάπτεται το τρέχον τιμολόγιό μας.", pay: "Παρακαλούμε να εξοφλήσετε το ποσό του τιμολογίου έως την ημερομηνία λήξης που αναγράφεται στο τιμολόγιο, ώστε να διασφαλιστεί η ομαλή και αδιάκοπη παροχή των υπηρεσιών σας.", closing: "Σας ευχαριστούμε για την προσοχή σας.", regards: "Με εκτίμηση," },
  bg: { label: "Български", subject: "Фактура от Media Marketing", hello: "Здравейте,", thanks: "Благодарим Ви за поръчката.", attached: "Приложено ще намерите нашата текуща фактура.", pay: "Молим да заплатите сумата по фактурата до датата на падежа, посочена във фактурата, за да осигурим безпроблемното обслужване на Вашите услуги.", closing: "Благодарим Ви за вниманието.", regards: "С уважение," },
  fi: { label: "Suomi", subject: "Media Marketing -lasku", hello: "Hei,", thanks: "Kiitos tilauksestasi.", attached: "Liitteenä on ajankohtainen laskumme.", pay: "Pyydämme ystävällisesti maksamaan laskun summan laskussa mainittuun eräpäivään mennessä, jotta palvelujesi käsittely sujuu keskeytyksettä.", closing: "Kiitos huomiostasi.", regards: "Ystävällisin terveisin," },
  sk: { label: "Slovenčina", subject: "Faktúra Media Marketing", hello: "Dobrý deň,", thanks: "ďakujeme za Vašu objednávku.", attached: "V prílohe nájdete našu aktuálnu faktúru.", pay: "Prosíme Vás o uhradenie sumy faktúry do dátumu splatnosti uvedeného na faktúre, aby bolo zabezpečené plynulé a neprerušené spracovanie Vašich služieb.", closing: "Ďakujeme za Vašu pozornosť.", regards: "S pozdravom," },
  sl: { label: "Slovenščina", subject: "Račun Media Marketing", hello: "Pozdravljeni,", thanks: "zahvaljujemo se vam za naročilo.", attached: "V prilogi vam pošiljamo naš trenutni račun.", pay: "Prosimo, da znesek računa poravnate do datuma zapadlosti, navedenega na računu, da zagotovimo nemoteno in neprekinjeno izvajanje vaših storitev.", closing: "Hvala za vašo pozornost.", regards: "Lep pozdrav," },
  mk: { label: "Македонски", subject: "Фактура од Media Marketing", hello: "Здраво,", thanks: "Ви благодариме за нарачката.", attached: "Во прилог ќе ја најдете нашата тековна фактура.", pay: "Ве молиме износот на фактурата да го платите до датумот на доспевање наведен на фактурата, за да се обезбеди непречена обработка на вашите услуги.", closing: "Ви благодариме за вниманието.", regards: "Со почит," },
};

for (const [k, c] of Object.entries(EXTRA_CLIENT_COPY)) {
  CLIENT_MESSAGE_TEMPLATES[k] = `${c.hello}\n\n${c.thanks}\n\n${c.attached}\n\n${c.pay}\n\n${c.closing}\n\n${c.regards}\n\n${SIGNATURE}`;
}

export const CLIENT_SUBJECT_TEMPLATES: Record<string, string> = {
  ...SUBJECT_TEMPLATES,
  ...Object.fromEntries(Object.entries(EXTRA_CLIENT_COPY).map(([k, c]) => [k, c.subject])),
};

/** All languages available in the invoice "Send to Client" email. */
export const CLIENT_TEMPLATE_LANGUAGES = [
  ...TEMPLATE_LANGUAGES,
  ...Object.entries(EXTRA_CLIENT_COPY).map(([value, c]) => ({ value, label: c.label })),
];
