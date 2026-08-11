import { describe, expect, it } from 'vitest';
import { MAX_PAGE_SIZE } from './queries.ts';

describe('repository query safeguards', () => {
  it('enforces a conservative maximum page size', () => expect(MAX_PAGE_SIZE).toBe(100));
});
