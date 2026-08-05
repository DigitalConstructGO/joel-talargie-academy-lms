import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

function toDate(value: Date | string | number): Date {
  return typeof value === 'string' ? parseISO(value) : new Date(value);
}

/** "Jan 4, 2026" */
export function formatDate(value: Date | string | number): string {
  const date = toDate(value);
  return isValid(date) ? format(date, 'MMM d, yyyy') : '—';
}

/** "Jan 4, 2026 · 3:45 PM" */
export function formatDateTime(value: Date | string | number): string {
  const date = toDate(value);
  return isValid(date) ? format(date, "MMM d, yyyy '·' h:mm a") : '—';
}

/** "3 days ago" */
export function formatRelativeTime(value: Date | string | number): string {
  const date = toDate(value);
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : '—';
}
