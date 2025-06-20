
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
    name: "Bankrekening België",
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
