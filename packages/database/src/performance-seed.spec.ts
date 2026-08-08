import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('performance seed safety', () => {
  const source = readFileSync(join(process.cwd(), 'scripts/performance-seed.ts'), 'utf8');

  it('requires explicit enablement and refuses production', () => {
    expect(source).toContain("PERFORMANCE_SEED_ENABLED !== 'true'");
    expect(source).toContain("NODE_ENV === 'production'");
  });

  it('requires an isolated test database rather than runtime URLs', () => {
    expect(source).toContain('assertIsolatedTestDatabase()');
  });
});
