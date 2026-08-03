import { describe, expect, it } from 'vitest';
import { PERMISSION_CODES, permissionSeed } from './permission-catalog.ts';
describe('RBAC permission catalog', () => {
  it('contains unique stable permission codes', () => {
    expect(new Set(PERMISSION_CODES).size).toBe(PERMISSION_CODES.length);
    expect(permissionSeed.every((item) => item.module && item.description)).toBe(true);
  });
  it('does not include an arbitrary permission creation capability', () => {
    expect(PERMISSION_CODES).not.toContain('permissions.create');
  });
});
