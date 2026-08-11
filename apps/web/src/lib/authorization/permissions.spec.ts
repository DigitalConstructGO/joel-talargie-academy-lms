import { describe, expect, it } from 'vitest';
import {
  can,
  canAccessAction,
  canAll,
  canAny,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from './permissions';
import { hasAnyRole, hasRole } from './user-type';

describe('can / canAny / canAll', () => {
  const granted = ['courses.read', 'courses.update'];

  it('can() checks a single permission', () => {
    expect(can(granted, 'courses.read')).toBe(true);
    expect(can(granted, 'courses.delete')).toBe(false);
  });

  it('canAny() is true when at least one required permission is granted', () => {
    expect(canAny(granted, ['courses.delete', 'courses.update'])).toBe(true);
    expect(canAny(granted, ['courses.delete', 'roles.create'])).toBe(false);
  });

  it('canAny() defaults to true when nothing is required', () => {
    expect(canAny(granted, [])).toBe(true);
  });

  it('canAll() requires every permission to be granted', () => {
    expect(canAll(granted, ['courses.read', 'courses.update'])).toBe(true);
    expect(canAll(granted, ['courses.read', 'courses.delete'])).toBe(false);
  });

  it('hasPermission/hasAnyPermission/hasAllPermissions are the same checks under the spec-requested names', () => {
    expect(hasPermission).toBe(can);
    expect(hasAnyPermission).toBe(canAny);
    expect(hasAllPermissions).toBe(canAll);
  });
});

describe('canAccessAction', () => {
  const granted = ['courses.update', 'courses.archive'];

  it('checks a single permission string', () => {
    expect(canAccessAction(granted, 'courses.update')).toBe(true);
    expect(canAccessAction(granted, 'courses.create')).toBe(false);
  });

  it('defaults to "any" for an array of permissions', () => {
    expect(canAccessAction(granted, ['courses.create', 'courses.archive'])).toBe(true);
  });

  it('requires every permission when mode is "all"', () => {
    expect(canAccessAction(granted, ['courses.update', 'courses.archive'], 'all')).toBe(true);
    expect(canAccessAction(granted, ['courses.update', 'courses.create'], 'all')).toBe(false);
  });
});

describe('hasRole / hasAnyRole', () => {
  it('hasRole checks a single role code', () => {
    expect(hasRole(['STUDENT'], 'STUDENT')).toBe(true);
    expect(hasRole(['STUDENT'], 'ADMINISTRATOR')).toBe(false);
  });

  it('hasAnyRole is true when at least one role matches', () => {
    expect(hasAnyRole(['ADMINISTRATOR', 'STUDENT'], ['ADMINISTRATOR'])).toBe(true);
    expect(hasAnyRole(['STUDENT'], ['ADMINISTRATOR'])).toBe(false);
  });

  it('hasAnyRole defaults to true when nothing is required', () => {
    expect(hasAnyRole(['STUDENT'], [])).toBe(true);
  });
});
