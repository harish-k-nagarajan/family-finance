/**
 * Format a Unix timestamp to DD/MM/YYYY or DD/MM
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {string} format - Format type: 'full' (default) or 'short' (no year)
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp, format = 'full') {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  if (format === 'short') {
    return `${day}/${month}`;
  }

  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a date for chart x-axis based on time range
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {string} timeRange - Time range filter ('1M', '3M', '6M', '1Y', 'ALL')
 * @param {number} rangeStartDate - Start date of the range (for week calculations)
 * @returns {string} Formatted label for x-axis
 */
export function formatChartAxisDate(timestamp, timeRange, rangeStartDate) {
  if (!timestamp) return '';

  const date = new Date(timestamp);

  // For 1-month view, show weeks (W1, W2, W3, W4)
  if (timeRange === '1M' && rangeStartDate) {
    const diffInMs = timestamp - rangeStartDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffInDays / 7) + 1;
    return `W${weekNumber}`;
  }

  // For 3-month and 6-month views, show abbreviated month name
  if (timeRange === '3M' || timeRange === '6M') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[date.getMonth()];
  }

  // For 1-year and ALL views, show month + short year
  if (timeRange === '1Y' || timeRange === 'ALL') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortYear = String(date.getFullYear()).slice(2); // Get last 2 digits
    return `${monthNames[date.getMonth()]} '${shortYear}`;
  }

  // Fallback to short date format
  return formatDate(timestamp, 'short');
}

/**
 * Parse a DD/MM/YYYY string to Unix timestamp
 * @param {string} dateString - Date in DD/MM/YYYY format
 * @returns {number} Unix timestamp in milliseconds
 */
export function parseDate(dateString) {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - ISO currency code (e.g., 'USD', 'EUR')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD', locale = 'en-US') {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as currency with decimals
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - ISO currency code
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted currency string with decimals
 */
export function formatCurrencyDecimal(amount, currencyCode = 'USD', locale = 'en-US') {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with thousand separators
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage value
 * @param {number} value - Percentage value (e.g., 3.5 for 3.5%)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined) return '';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a large number with abbreviation (K, M, B)
 * @param {number} value - Number to format
 * @returns {string} Abbreviated number string
 */
export function formatCompactNumber(value) {
  if (value === null || value === undefined) return '';
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toString();
}
