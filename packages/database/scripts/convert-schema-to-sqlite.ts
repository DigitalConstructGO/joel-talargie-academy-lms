import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const schemaPath = resolve('packages/database/src/schema/index.ts');

// Restore clean original from git
execSync('git checkout packages/database/src/schema/index.ts');

let code = readFileSync(schemaPath, 'utf-8');

// Replace pg-core imports with sqlite-core and drizzle-orm imports
code = code.replace(
  /import\s+\{[\s\S]*?\}\s+from\s+'drizzle-orm\/pg-core';/g,
  `import { asc, desc, sql } from 'drizzle-orm';
import {
  check,
  customType,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';`,
);

code = code.replace(/import type \{ AnyPgColumn \} from 'drizzle-orm\/pg-core';/g, "import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';");
code = code.replace(/AnyPgColumn/g, 'AnySQLiteColumn');

const enumHelper = `
export const pgEnum = <T extends string>(_name: string, values: [T, ...T[]]) => {
  return (colName: string) => text(colName, { enum: values });
};
`;

code = code.replace(/export const userStatus = pgEnum\(/, `${enumHelper}\nexport const userStatus = pgEnum(`);

// Replace pgTable with sqliteTable
code = code.replace(/pgTable\(/g, 'sqliteTable(');

// Replace UUID
code = code.replace(/uuid\(([^)]+)\)\.primaryKey\(\)\.defaultRandom\(\)/g, "text($1).primaryKey().$defaultFn(() => crypto.randomUUID())");
code = code.replace(/uuid\(([^)]+)\)/g, "text($1)");

// Replace boolean
code = code.replace(/boolean\(([^)]+)\)/g, "integer($1, { mode: 'boolean' })");

// Replace timestamp
code = code.replace(/timestamp\(([^,]+),\s*\{[^}]*\}\)/g, "integer($1, { mode: 'timestamp' })");
code = code.replace(/timestamp\(([^)]+)\)/g, "integer($1, { mode: 'timestamp' })");

// Replace jsonb
code = code.replace(/jsonb\(([^)]+)\)/g, "text($1, { mode: 'json' })");

// Replace numeric with options or without
code = code.replace(/numeric\(([^,)]+),\s*\{[^}]*\}\)/g, "text($1)");
code = code.replace(/numeric\(([^)]+)\)/g, "text($1)");

// Replace tsvector and generatedAlwaysAs
code = code.replace(/const tsvector = customType[\s\S]*?\}\);/g, "const tsvector = (colName: string) => text(colName);");
code = code.replace(/searchVector:\s*tsvector\('search_vector'\)[\s\S]*?\n\s*\),/g, "searchVector: tsvector('search_vector'),");

// Remove .using('gin', ...) from index
code = code.replace(/\.using\('gin',\s*table\.([a-zA-Z0-9_]+)\)/g, ".on(table.$1)");

// Replace index column desc/asc
code = code.replace(/table\.([a-zA-Z0-9_]+)\.desc\(\)/g, "desc(table.$1)");
code = code.replace(/table\.([a-zA-Z0-9_]+)\.asc\(\)/g, "asc(table.$1)");

// Replace SQL true with 1 in templates
code = code.replace(/= true AND/g, '= 1 AND');
code = code.replace(/= true\)/g, '= 1)');

writeFileSync(schemaPath, code, 'utf-8');
console.log('Successfully updated schema/index.ts to SQLite format cleanly!');
