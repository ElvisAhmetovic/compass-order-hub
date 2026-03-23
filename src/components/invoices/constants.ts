
export interface PaymentAccount {
  id: string;
  country: string;
  name: string;
  iban: string;
  bic: string;
  bank?: string;
  blz?: string;
  account?: string;
}

export const PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    id: "belgium",
    country: "Belgium",
    name: "Belgian Bank Account",
    iban: "BE79967023897833",
    bic: "TRWIBEB1XXX",
    blz: "967",
    account: "967023897833"
  },
  {
    id: "germany", 
    country: "Germany",
    name: "German Bank Account",
    iban: "DE91240703680071572200",
    bic: "DEUTDE2HP22",
    bank: "Postbank/DSL Ndl of Deutsche Bank"
  }
];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'da', name: 'Dansk' },
  { code: 'no', name: 'Norsk' },
  { code: 'cs', name: 'Čeština' },
  { code: 'pl', name: 'Polski' },
  { code: 'sv', name: 'Svenska' }
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

export const DEFAULT_COMPANY_LOGO = "/lovable-uploads/f7433a5f-4a36-45f5-a9c0-0609818523fe.png";

const DEFAULT_TERMS: Record<string, string> = {
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
};

export const getDefaultTerms = (language: string): string => {
  return DEFAULT_TERMS[language] || DEFAULT_TERMS.en;
};
