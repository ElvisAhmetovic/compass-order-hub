
import { SUPPORTED_CURRENCIES } from "@/components/invoices/CurrencySelector";

export const getCurrencySymbol = (currencyCode: string = 'EUR'): string => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || '€';
};

export const formatCurrency = (amount: number, currencyCode: string = 'EUR'): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
};

// Mock exchange rates - in a real app, you'd fetch these from an API
const EXCHANGE_RATES: { [key: string]: number } = {
  'EUR': 1,
  'USD': 1.09,
  'GBP': 0.87,
  'JPY': 149.50,
  'CAD': 1.46,
  'AUD': 1.62,
  'CHF': 0.98,
  'SEK': 11.08,
  'NOK': 11.42,
  'DKK': 7.46,
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to EUR first, then to target currency
  const eurAmount = amount / EXCHANGE_RATES[fromCurrency];
  return eurAmount * EXCHANGE_RATES[toCurrency];
};

export const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return 1;
  return EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency];
};
