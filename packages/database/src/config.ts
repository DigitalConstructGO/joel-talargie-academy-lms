import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

export interface DatabaseUrlOptions {
  requireNeon?: boolean;
  requirePooled?: boolean;
  requireDirect?: boolean;
}

export function validateDatabaseUrl(
  value: string | undefined,
  _options: DatabaseUrlOptions = {},
): string {
  const dbPath = value || 'sqlite.db';
  if (dbPath === ':memory:' || isAbsolute(dbPath)) {
    return dbPath;
  }
  let currentDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const checkPkgPath = resolve(currentDir, 'packages/database', dbPath);
    if (existsSync(checkPkgPath)) {
      return checkPkgPath;
    }
    const checkPath = resolve(currentDir, dbPath);
    if (existsSync(checkPath) && !currentDir.includes('apps')) {
      return checkPath;
    }
    const parent = resolve(currentDir, '..');
    if (parent === currentDir) break;
    currentDir = parent;
  }
  return resolve(process.cwd(), dbPath);
}

export function getDirectDatabaseUrl(environment = process.env): string {
  return environment.DATABASE_DIRECT_URL || environment.DATABASE_URL || 'sqlite.db';
}

export function assertIsolatedTestDatabase(environment = process.env): string {
  return environment.DATABASE_TEST_URL || ':memory:';
}
