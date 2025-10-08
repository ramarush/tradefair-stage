// Currency utility functions for TradeFair

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Exchange rate relative to USD
}

// Supported currencies with their exchange rates
export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 1.0 // Base currency
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rate: 83.0 // Approximate rate: 1 USD = 83 INR
  }
};

/**
 * Convert amount from USD to target currency
 */
export function convertFromUSD(amountUSD: number, targetCurrency: string): number {
  const currency = CURRENCIES[targetCurrency];
  if (!currency) {
    throw new Error(`Unsupported currency: ${targetCurrency}`);
  }
  return amountUSD * currency.rate;
}

/**
 * Convert amount from source currency to USD
 */
export function convertToUSD(amount: number, sourceCurrency: string): number {
  const currency = CURRENCIES[sourceCurrency];
  if (!currency) {
    throw new Error(`Unsupported currency: ${sourceCurrency}`);
  }
  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round((amount / currency.rate) * 100) / 100;
}

/**
 * Convert amount between two currencies
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Convert to USD first, then to target currency
  const usdAmount = convertToUSD(amount, fromCurrency);
  return convertFromUSD(usdAmount, toCurrency);
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencyInfo = CURRENCIES[currency];
  if (!currencyInfo) {
    return `${amount.toFixed(2)} ${currency}`;
  }
  
  // Format with appropriate decimal places
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${currencyInfo.symbol}${formattedAmount}`;
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(currencyCode: string): CurrencyInfo | null {
  return CURRENCIES[currencyCode] || null;
}

/**
 * Get user's currency from localStorage
 */
export function getUserCurrency(): string {
  if (typeof window === 'undefined') {
    return 'USD'; // Default for server-side rendering
  }
  
  try {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      console.log("userData",userData.currency);
      return userData.currency || 'USD';
    }
  } catch (error) {
    console.error('Error getting user currency:', error);
  }
  
  return 'USD'; // Default fallback
}

/**
 * Display amount in user's preferred currency
 */
export function displayAmount(amountUSD: number, userCurrency?: string): string {
  const currency = userCurrency || getUserCurrency();
  const convertedAmount = convertFromUSD(amountUSD, currency);
  return formatCurrency(convertedAmount, currency);
}
