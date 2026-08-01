import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { getDirectDatabaseUrl } from './src/config.ts';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: { url: getDirectDatabaseUrl() },
});
