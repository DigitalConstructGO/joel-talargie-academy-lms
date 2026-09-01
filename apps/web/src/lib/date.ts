import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

function toDate(value: Date | string | number | null | undefined): Date {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const ms = value < 10000000000 ? value * 1000 : value;
    return new Date(ms);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return new Date(NaN);
    const num = Number(trimmed);
    if (!Number.isNaN(num)) {
      const ms = num < 10000000000 ? num * 1000 : num;
      return new Date(ms);
    }
    return parseISO(trimmed);
  }
  return new Date(value);
}

/** "Jan 4, 2026" */
export function formatDate(value: Date | string | number | null | undefined): string {
  const date = toDate(value);
  if (!isValid(date) || date.getTime() <= 946684800000) return '—';
  return format(date, 'MMM d, yyyy');
}

/** "Jan 4, 2026 · 3:45 PM" */
export function formatDateTime(value: Date | string | number | null | undefined): string {
  const date = toDate(value);
  if (!isValid(date) || date.getTime() <= 946684800000) return '—';
  return format(date, "MMM d, yyyy '·' h:mm a");
}

/** "3 days ago" / "ከ 3 ቀናት በፊት" */
export function formatRelativeTime(
  value: Date | string | number | null | undefined,
  locale: string = 'en',
): string {
  const date = toDate(value);
  if (!isValid(date) || date.getTime() <= 946684800000) {
    return locale === 'am' ? 'አሁን' : 'Just now';
  }
  const EnglishDistance = formatDistanceToNow(date, { addSuffix: true });
  if (locale !== 'am') return EnglishDistance;

  // Translate common date-fns distance strings into Amharic
  const amharicTimeStr = EnglishDistance.replace('less than a minute ago', 'አሁን')
    .replace('about 1 minute ago', 'ከ 1 ደቂቃ በፊት')
    .replace(/about (\d+) minutes ago/, 'ከ $1 ደቂቃ በፊት')
    .replace(/(\d+) minutes ago/, 'ከ $1 ደቂቃ በፊት')
    .replace('about 1 hour ago', 'ከ 1 ሰዓት በፊት')
    .replace(/about (\d+) hours ago/, 'ከ $1 ሰዓት በፊት')
    .replace(/(\d+) hours ago/, 'ከ $1 ሰዓት በፊት')
    .replace('1 day ago', 'ከ 1 ቀን በፊት')
    .replace(/(\d+) days ago/, 'ከ $1 ቀን በፊት')
    .replace('about 1 month ago', 'ከ 1 ወር በፊት')
    .replace(/about (\d+) months ago/, 'ከ $1 ወር በፊት')
    .replace(/(\d+) months ago/, 'ከ $1 ወር በፊት')
    .replace('about 1 year ago', 'ከ 1 ዓመት በፊት')
    .replace(/over (\d+) years ago/, 'ከ $1 ዓመት በፊት')
    .replace(/(\d+) years ago/, 'ከ $1 ዓመት በፊት');

  return amharicTimeStr;
}
