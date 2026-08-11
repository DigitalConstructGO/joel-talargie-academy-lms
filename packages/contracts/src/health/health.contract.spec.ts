import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health.contract';
const valid = {
  data: {
    service: 'joel-talargie-academy-api',
    status: 'ok',
    environment: 'test',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  },
  meta: {},
  error: null,
};
describe('healthResponseSchema', () => {
  it('parses a valid response', () => expect(healthResponseSchema.parse(valid)).toEqual(valid));
  it('rejects invalid data', () =>
    expect(() => healthResponseSchema.parse({ ...valid, data: { status: 'bad' } })).toThrow());
});
