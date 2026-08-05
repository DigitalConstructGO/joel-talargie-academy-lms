/** Formats a number as currency. Defaults to ETB to match the academy's primary market. */
export function formatCurrency(value: number | string, currency = 'ETB', locale = 'en-US'): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
}

/** Formats a byte count into a human-readable size (e.g. "3.4 MB"). */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** exponent;
  return `${exponent === 0 ? size : size.toFixed(size < 10 ? 1 : 0)} ${units[exponent]}`;
}

/** Formats a number with locale-aware thousands separators. */
export function formatNumber(value: number, locale = 'en-US'): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale).format(value);
}

/** Formats a number as a compact string (e.g. 12_400 -> "12.4K"). */
export function formatCompactNumber(value: number, locale = 'en-US'): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

/** Formats a 0-100 (or 0-1, via `fromFraction`) value as a percentage string. */
export function formatPercentage(value: number, fromFraction = false): string {
  if (!Number.isFinite(value)) return '—';
  const percent = fromFraction ? value * 100 : value;
  return `${Math.round(percent * 10) / 10}%`;
}

/** Formats a minute count into a human-readable duration (e.g. 90 -> "1h 30m"). */
export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (!minutes || !Number.isFinite(minutes) || minutes <= 0) return '—';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

/** Formats a second count into a human-readable duration (e.g. 125 -> "2:05"). */
export function formatDurationSeconds(seconds: number | null | undefined): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '—';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}
