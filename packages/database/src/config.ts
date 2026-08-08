export interface DatabaseUrlOptions {
  requireNeon?: boolean;
  requirePooled?: boolean;
  requireDirect?: boolean;
}

const SAFE_DATABASE_ERROR = 'Database configuration is invalid';

export function validateDatabaseUrl(
  value: string | undefined,
  options: DatabaseUrlOptions = {},
): string {
  if (!value) throw new Error(SAFE_DATABASE_ERROR);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(SAFE_DATABASE_ERROR);
  }

  const isPostgres = url.protocol === 'postgresql:' || url.protocol === 'postgres:';
  const hasDatabase = url.pathname.length > 1;
  const sslMode = url.searchParams.get('sslmode');
  const usesSsl = Boolean(sslMode && !['disable', 'allow', 'prefer'].includes(sslMode));
  const isNeon = url.hostname.endsWith('.neon.tech');
  const isPooled = url.hostname.includes('-pooler.');

  if (
    !isPostgres ||
    !hasDatabase ||
    !usesSsl ||
    (options.requireNeon && !isNeon) ||
    (options.requirePooled && !isPooled) ||
    (options.requireDirect && isPooled)
  ) {
    throw new Error(SAFE_DATABASE_ERROR);
  }

  return value;
}

export function getDirectDatabaseUrl(environment = process.env): string {
  return validateDatabaseUrl(environment.DATABASE_DIRECT_URL, {
    requireNeon: true,
    requireDirect: true,
  });
}

export function assertIsolatedTestDatabase(environment = process.env): string {
  const testUrl = validateDatabaseUrl(environment.DATABASE_TEST_URL);
  if (testUrl === environment.DATABASE_URL || testUrl === environment.DATABASE_DIRECT_URL) {
    throw new Error('Test database configuration is not isolated');
  }
  return testUrl;
}
