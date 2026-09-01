const KEY_MAP_AM: Record<string, string> = {
  action: 'ተግባር',
  entityType: 'የአካል አይነት',
  before: 'በፊት',
  after: 'በኋላ',
  total: 'ጠቅላላ',
  count: 'ብዛት',
  user: 'ተጠቃሚ',
  status: 'ሁኔታ',
  createdAt: 'የተፈጠረበት ቀን',
  updatedAt: 'የተሻሻለበት ቀን',
  email: 'ኢሜይል',
  role: 'ሚና',
  name: 'ስም',
  title: 'ርዕስ',
  amount: 'መጠን',
  firstName: 'የመጀመሪያ ስም',
  lastName: 'የአያት ስም',
  first_name: 'የመጀመሪያ ስም',
  last_name: 'የአያት ስም',
  emailVerified: 'ኢሜይል የተረጋገጠ',
  email_verified: 'ኢሜይል የተረጋገጠ',
  provider: 'አቅራቢ',
  lastLoginAt: 'መጨረሻ የገቡበት ቀን',
  last_login_at: 'መጨረሻ የገቡበት ቀን',
  byStatus: 'በሁኔታ',
  by_status: 'በሁኔታ',
};

const VALUE_MAP_AM: Record<string, string> = {
  ACTIVE: 'ንቁ',
  PENDING_VERIFICATION: 'ማረጋገጫ በመጠባበቅ ላይ',
  PENDING: 'ማረጋገጫ በመጠባበቅ ላይ',
  ARCHIVED: 'የተቀመጠ',
  REVOKED: 'የተቀመጠ',
  COMPLETED: 'የተጠናቀቀ',
  IN_PROGRESS: 'በሂደት ላይ',
  ENROLLED: 'በሂደት ላይ',
  APPROVED: 'የጸደቀ',
  DECLINED: 'የተሰረዘ',
  GOOGLE: 'Google',
  LOCAL: 'ሀገር ውስጥ (Local)',
};

/** Turns a report row's camelCase/snake_case key into a readable column header, e.g. `courseTitle` -> "Course Title". */
export function humanizeKey(key: string, locale?: string): string {
  if (locale === 'am' && KEY_MAP_AM[key]) {
    return KEY_MAP_AM[key]!;
  }
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
export function formatReportValue(value: unknown, locale?: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') {
    if (locale === 'am') return value ? 'አዎ' : 'አይ';
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'string' && locale === 'am' && VALUE_MAP_AM[value]) {
    return VALUE_MAP_AM[value]!;
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
