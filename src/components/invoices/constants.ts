import abTeamLogo from "@/assets/ab-team-symbol.png";
import mediaMarketingSymbol from "@/assets/media-marketing-symbol.png.asset.json";

export interface PaymentAccount {
  id: string;
  country: string;
  name: string;
  iban: string;
  bic?: string;
  bank?: string;
  blz?: string;
  account?: string;
  sortCode?: string;
  accountNumber?: string;
  address?: string;
  accountHolder?: string;
}

export const PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    id: "germany",
    country: "Germany",
    name: "German Bank Account",
    iban: "DE91240703680071572200",
    bic: "DEUTDE2HP22",
    bank: "Postbank/DSL Ndl of Deutsche Bank"
  },
  {
    id: "revolut",
    country: "United Kingdom",
    name: "Revolut Account",
    iban: "GB40REVO23012083344414",
    bic: "REVOGB21",
    bank: "Revolut Ltd"
  },
  {
    id: "wise",
    country: "Belgium",
    name: "Media Marketing LTD WISE",
    iban: "BE75903030215751",
    bic: "TRWIBEB1XXX",
    bank: "Wise"
  }
];

export const LANGUAGES = [
  { code: 'ru', name: 'Русский' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' },
  { code: 'pl', name: 'Polski' },
  { code: 'uk', name: 'Українська' },
  { code: 'ro', name: 'Română' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'pt', name: 'Português' },
  { code: 'hu', name: 'Magyar' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'cs', name: 'Čeština' },
  { code: 'sv', name: 'Svenska' },
  { code: 'bg', name: 'Български' },
  { code: 'da', name: 'Dansk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'no', name: 'Norsk' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'sl', name: 'Slovenščina' },
  { code: 'mk', name: 'Македонски' }
];

export const CURRENCIES = [
  { code: 'EUR', name: 'EUR (€)', symbol: '€' },
  { code: 'USD', name: 'USD ($)', symbol: '$' },
  { code: 'GBP', name: 'GBP (£)', symbol: '£' },
  { code: 'JPY', name: 'JPY (¥)', symbol: '¥' },
  { code: 'CAD', name: 'CAD (C$)', symbol: 'C$' },
  { code: 'AUD', name: 'AUD (A$)', symbol: 'A$' },
  { code: 'CHF', name: 'CHF (₣)', symbol: '₣' },
  { code: 'SEK', name: 'SEK (kr)', symbol: 'kr' },
  { code: 'NOK', name: 'NOK (kr)', symbol: 'kr' },
  { code: 'DKK', name: 'DKK (kr)', symbol: 'kr' }
];

export const DEFAULT_COMPANY_LOGO = mediaMarketingSymbol.url;
export const LEGACY_COMPANY_LOGOS = ["/lovable-uploads/f7433a5f-4a36-45f5-a9c0-0609818523fe.png", abTeamLogo];

export const DEFAULT_PAYMENT_ACCOUNT_IDS = ["germany", "revolut"];

/** Checkbox labels only (owner in brackets) — never printed on invoices. */
export const PAYMENT_ACCOUNT_OPTIONS = [
  { id: "germany", label: "German Bank Account (Media Marketing LTD)" },
  { id: "revolut", label: "Revolut Account (Media Marketing LTD)" },
  { id: "wise", label: "Wise Account (Web Workers LTD)" },
];

/** Turns saved settings (array, or older single-choice strings) into a list of account ids. */
/** Monthly package invoices always list German + Revolut, never Wise. */
export const MONTHLY_PAYMENT_ACCOUNT_IDS = ["germany", "revolut"] as const;

export const normalizePaymentAccountIds = (choice?: unknown): string[] => {
  const valid = PAYMENT_ACCOUNT_OPTIONS.map((o) => o.id);
  if (Array.isArray(choice)) {
    const ids = valid.filter((id) => choice.includes(id));
    return ids.length ? ids : [...DEFAULT_PAYMENT_ACCOUNT_IDS];
  }
  if (choice === "germany_only") return ["germany"];
  if (choice === "revolut_only") return ["revolut"];
  return [...DEFAULT_PAYMENT_ACCOUNT_IDS];
};

/** Returns the accounts to show for the saved selection. */
export const filterAccountsByChoice = <T extends { id: string }>(accounts: T[], choice?: unknown): T[] => {
  const ids = normalizePaymentAccountIds(choice);
  const picked = accounts.filter((a) => ids.includes(a.id));
  return picked.length ? picked : accounts.filter((a) => DEFAULT_PAYMENT_ACCOUNT_IDS.includes(a.id));
};

/** Previous default notes (contradictory 3-day term + tax claim); saved copies are reset on load. */
export const LEGACY_DEFAULT_TERMS: Record<string, string> = {
  en: "We request that our invoiced services are credited/transferred within 3 days. All taxes and social contributions are declared and paid by us to the authorities.",
  nl: "Wij verzoeken dat de door ons gefactureerde diensten binnen 3 dagen worden gecrediteerd/overgemaakt. Alle belastingen en sociale premies worden door ons aangegeven en afgedragen aan de autoriteiten.",
  de: "Wir bitten darum, dass unsere in Rechnung gestellten Leistungen innerhalb von 3 Tagen gutgeschrieben/überwiesen werden. Alle Steuern und Sozialabgaben werden von uns bei den Behörden angemeldet und abgeführt.",
  fr: "Nous demandons que nos services facturés soient crédités/transférés dans un délai de 3 jours. Toutes les taxes et cotisations sociales sont déclarées et versées par nos soins aux autorités.",
  es: "Solicitamos que nuestros servicios facturados sean acreditados/transferidos en un plazo de 3 días. Todos los impuestos y contribuciones sociales son declarados y pagados por nosotros a las autoridades.",
  da: "Vi anmoder om, at vores fakturerede ydelser krediteres/overføres inden for 3 dage. Alle skatter og sociale bidrag angives og afregnes af os til myndighederne.",
  no: "Vi ber om at våre fakturerte tjenester krediteres/overføres innen 3 dager. Alle skatter og sosiale avgifter oppgis og betales av oss til myndighetene.",
  cs: "Žádáme, aby naše fakturované služby byly připsány/převedeny do 3 dnů. Všechny daně a sociální odvody jsou námi přiznány a odvedeny příslušným úřadům.",
  pl: "Prosimy o zaksięgowanie/przelanie naszych zafakturowanych usług w ciągu 3 dni. Wszystkie podatki i składki na ubezpieczenia społeczne są przez nas deklarowane i odprowadzane do odpowiednich organów.",
  sv: "Vi ber om att våra fakturerade tjänster krediteras/överförs inom 3 dagar. Alla skatter och sociala avgifter deklareras och betalas av oss till myndigheterna.",
  ru: "Просим зачислить/перевести оплату по выставленным нами счетам в течение 3 дней. Все налоги и социальные взносы декларируются и уплачиваются нами в соответствующие органы.",
  it: "Chiediamo che i nostri servizi fatturati vengano accreditati/trasferiti entro 3 giorni. Tutte le tasse e i contributi sociali sono dichiarati e versati da noi alle autorità competenti.",
  uk: "Просимо зарахувати/перерахувати оплату за наші виставлені послуги протягом 3 днів. Усі податки та соціальні внески декларуються та сплачуються нами відповідним органам.",
  ro: "Vă rugăm ca serviciile noastre facturate să fie creditate/transferate în termen de 3 zile. Toate taxele și contribuțiile sociale sunt declarate și plătite de noi autorităților.",
  tr: "Faturalandırdığımız hizmetlerin 3 gün içinde hesabımıza geçirilmesini/aktarılmasını rica ederiz. Tüm vergiler ve sosyal katkı payları tarafımızca beyan edilip ilgili makamlara ödenmektedir.",
  pt: "Solicitamos que os nossos serviços faturados sejam creditados/transferidos no prazo de 3 dias. Todos os impostos e contribuições sociais são declarados e pagos por nós às autoridades.",
  hu: "Kérjük, hogy a kiszámlázott szolgáltatásaink ellenértékét 3 napon belül szíveskedjenek jóváírni/átutalni. Minden adót és társadalombiztosítási járulékot mi vallunk be és fizetünk be a hatóságoknak.",
  el: "Παρακαλούμε όπως τα τιμολογημένα μας υπηρεσίες πιστωθούν/μεταφερθούν εντός 3 ημερών. Όλοι οι φόροι και οι εισφορές κοινωνικής ασφάλισης δηλώνονται και καταβάλλονται από εμάς στις αρχές.",
  bg: "Моля, фактурираните от нас услуги да бъдат кредитирани/преведени в рамките на 3 дни. Всички данъци и социални осигуровки се декларират и плащат от нас на компетентните органи.",
  fi: "Pyydämme, että laskuttamamme palvelut hyvitetään/siirretään 3 päivän kuluessa. Kaikki verot ja sosiaalimaksut ilmoitamme ja maksamme viranomaisille itse.",
  sk: "Žiadame, aby boli naše fakturované služby pripísané/prevedené do 3 dní. Všetky dane a sociálne odvody priznávame a odvádzame príslušným orgánom my.",
  sl: "Prosimo, da se naše zaračunane storitve nakažejo/preknjižijo v 3 dneh. Vse davke in socialne prispevke prijavljamo in plačujemo pristojnim organom sami.",
  mk: "Ве молиме нашите фактурирани услуги да бидат уплатени/префрлени во рок од 3 дена. Сите даноци и социјални придонеси ги пријавуваме и ги плаќаме ние на соодветните органи.",
};

export const DEFAULT_TERMS: Record<string, string> = {
  en: "Please pay the invoice amount by the due date stated above, without deduction.",
  de: "Bitte überweisen Sie den Rechnungsbetrag ohne Abzug bis zum oben genannten Fälligkeitsdatum.",
  nl: "Gelieve het factuurbedrag zonder aftrek vóór de hierboven vermelde vervaldatum te betalen.",
  fr: "Veuillez régler le montant de la facture sans déduction avant la date d'échéance indiquée ci-dessus.",
  es: "Por favor, pague el importe de la factura sin deducciones antes de la fecha de vencimiento indicada arriba.",
  da: "Betal venligst fakturabeløbet uden fradrag senest på den ovenfor angivne forfaldsdato.",
  no: "Vennligst betal fakturabeløpet uten fradrag innen forfallsdatoen angitt ovenfor.",
  cs: "Uhraďte prosím částku faktury bez srážek do výše uvedeného data splatnosti.",
  pl: "Prosimy o zapłatę kwoty faktury bez potrąceń do podanego powyżej terminu płatności.",
  sv: "Vänligen betala fakturabeloppet utan avdrag senast på det förfallodatum som anges ovan.",
  ru: "Просим оплатить сумму счёта без вычетов до указанной выше даты оплаты.",
  it: "Si prega di pagare l'importo della fattura senza detrazioni entro la data di scadenza sopra indicata.",
  uk: "Просимо сплатити суму рахунку без вирахувань до зазначеної вище дати оплати.",
  ro: "Vă rugăm să achitați suma facturii fără deduceri până la data scadentă menționată mai sus.",
  tr: "Lütfen fatura tutarını kesinti yapmadan yukarıda belirtilen vade tarihine kadar ödeyiniz.",
  pt: "Por favor, pague o valor da fatura sem deduções até à data de vencimento indicada acima.",
  hu: "Kérjük, a számla összegét levonás nélkül a fent megadott fizetési határidőig fizesse meg.",
  el: "Παρακαλούμε να εξοφλήσετε το ποσό του τιμολογίου χωρίς έκπτωση έως την ανωτέρω ημερομηνία λήξης.",
  bg: "Моля, платете сумата по фактурата без удръжки до посочения по-горе падеж.",
  fi: "Maksathan laskun summan ilman vähennyksiä yllä mainittuun eräpäivään mennessä.",
  sk: "Uhraďte prosím sumu faktúry bez zrážok do vyššie uvedeného dátumu splatnosti.",
  sl: "Prosimo, poravnajte znesek računa brez odbitkov do zgoraj navedenega datuma zapadlosti.",
  mk: "Ве молиме платете го износот на фактурата без одбивања до погоре наведениот датум на доспевање.",
};

export const getDefaultTerms = (language: string): string => {
  return DEFAULT_TERMS[language] || DEFAULT_TERMS.en;
};

/** True when saved custom notes are just an old default text (so the new default should be used). */
export const isLegacyDefaultTerms = (text?: string): boolean =>
  !!text && Object.values(LEGACY_DEFAULT_TERMS).some((t) => t.trim() === text.trim());
