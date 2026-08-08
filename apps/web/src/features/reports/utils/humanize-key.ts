/** Turns a report row's camelCase/snake_case key into a readable column header, e.g. `courseTitle` -> "Course Title". */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
  return spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(' ');
}

/** Renders a report cell value for display - objects/arrays are JSON-stringified, null/undefined show as an em dash. */
export function formatReportValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
