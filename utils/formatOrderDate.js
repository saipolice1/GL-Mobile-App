import { format } from 'date-fns';

/**
 * Formats an order date with the given date-fns pattern.
 * Returns null when the value is missing or not a valid date.
 */
export function formatOrderDate(value, pattern) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return format(date, pattern);
}
