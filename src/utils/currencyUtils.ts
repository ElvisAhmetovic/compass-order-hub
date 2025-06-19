
import { SUPPORTED_CURRENCIES } from "@/components/invoices/CurrencySelector";

export const getCurrencySymbol = (currencyCode: string = 'EUR'): string => {
  const currencyMap: { [key: string]: string } = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': '₣',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr'
  };
  
  return currencyMap[currencyCode] || '€';
};

export const formatCurrency = (amount: number, currencyCode: string = 'EUR'): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
};

// Enhanced exchange rates with fallback
let cachedRates: { [key: string]: number } = {
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

// Fetch live exchange rates (you can integrate with a real API later)
export const fetchExchangeRates = async (): Promise<{ [key: string]: number }> => {
  try {
    // For now, return cached rates. In production, you'd call a real API like:
    // const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    // const data = await response.json();
    // return data.rates;
    
    console.log('Using cached exchange rates. Consider integrating with a live API.');
    return cachedRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return cachedRates;
  }
};

export const updateExchangeRates = async () => {
  const rates = await fetchExchangeRates();
  cachedRates = { ...cachedRates, ...rates };
  return cachedRates;
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to EUR first, then to target currency
  const eurAmount = amount / cachedRates[fromCurrency];
  return eurAmount * cachedRates[toCurrency];
};

export const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return 1;
  return cachedRates[toCurrency] / cachedRates[fromCurrency];
};

export const getCurrentRates = () => ({ ...cachedRates });
