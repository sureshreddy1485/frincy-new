/**
 * Format a number as a currency string
 * @param amount The numerical amount
 * @param currencyCode The ISO 4217 currency code (e.g., 'USD', 'EUR', 'INR')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};
