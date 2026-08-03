import { config as loadEnvironment } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDirectDatabaseUrl } from './src/config.ts';

const packageDirectory = dirname(fileURLToPath(import.meta.url));
loadEnvironment({ path: resolve(packageDirectory, '../../.env'), quiet: true });
loadEnvironment({ path: resolve(packageDirectory, '.env'), quiet: true, override: false });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: { url: getDirectDatabaseUrl() },
});
