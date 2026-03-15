/**
 * Format a number as EUR currency using es-ES locale.
 * Example: 1234567.89 -> "1.234.567,89 EUR"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string as Spanish date (dd/mm/yyyy).
 * Accepts ISO date strings or similar parseable formats.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a number with es-ES locale separators.
 * Example: 1234567 -> "1.234.567"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Generate a URL-safe slug from text.
 * Handles accented characters and special chars.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text to a maximum length, adding ellipsis if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '\u2026';
}

/**
 * Format a number in compact notation.
 * Examples: 1200000 -> "1,2M", 345000 -> "345K", 890 -> "890"
 */
export function formatCompactNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000_000) {
    const value = num / 1_000_000_000;
    return `${formatDecimal(value)}B`;
  }
  if (Math.abs(num) >= 1_000_000) {
    const value = num / 1_000_000;
    return `${formatDecimal(value)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    const value = num / 1_000;
    return `${formatDecimal(value)}K`;
  }
  return formatNumber(num);
}

/**
 * Helper to format a decimal number with es-ES locale,
 * removing unnecessary trailing zeros.
 */
function formatDecimal(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}
