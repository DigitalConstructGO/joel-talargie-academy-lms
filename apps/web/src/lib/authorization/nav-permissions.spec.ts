import { describe, expect, it } from 'vitest';
import {
  canAccessRoute,
  collectPermissions,
  flattenNav,
  isRouteAllowed,
  resolveRequiredPermission,
} from './nav-permissions';
import { ADMIN_NAV } from '@/constants/nav';
import type { NavSection } from '@/types';

const FIXTURE_NAV: NavSection[] = [
  {
    label: 'Management',
    items: [
      {
        label: 'Academic Management',
        href: '/admin/academics',
        permission: 'courses.read',
        items: [
          { label: 'Courses', href: '/admin/academics/courses', permission: 'courses.read' },
          {
            label: 'Categories',
            href: '/admin/academics/categories',
            permission: 'categories.read',
          },
        ],
      },
      { label: 'Reports', href: '/admin/reports', permission: 'reports.read' },
    ],
  },
];

describe('resolveRequiredPermission', () => {
  it('resolves the exact permission for a listed route', () => {
    expect(resolveRequiredPermission('/admin/academics/courses', FIXTURE_NAV)).toBe('courses.read');
  });

  it('resolves the nearest ancestor permission for an unlisted sub-route (longest-prefix match)', () => {
    expect(resolveRequiredPermission('/admin/academics/courses/123/edit', FIXTURE_NAV)).toBe(
      'courses.read',
    );
  });

  it('picks the more specific (longer) match when both a parent and child match', () => {
    expect(resolveRequiredPermission('/admin/academics/categories', FIXTURE_NAV)).toBe(
      'categories.read',
    );
  });

  it('returns undefined for a route with no match anywhere in the tree', () => {
    expect(resolveRequiredPermission('/admin/unlisted', FIXTURE_NAV)).toBeUndefined();
  });
});

describe('isRouteAllowed / canAccessRoute', () => {
  it('is the same function under both names', () => {
    expect(canAccessRoute).toBe(isRouteAllowed);
  });

  it('allows a guest-shaped empty permission set through an unguarded route', () => {
    expect(isRouteAllowed('/admin/unlisted', FIXTURE_NAV, [])).toBe(true);
  });

  it('denies a route whose required permission is not granted', () => {
    expect(isRouteAllowed('/admin/academics/courses', FIXTURE_NAV, ['reports.read'])).toBe(false);
  });

  it('allows a route whose required permission is granted (limited-permission admin)', () => {
    expect(isRouteAllowed('/admin/academics/courses', FIXTURE_NAV, ['courses.read'])).toBe(true);
  });

  it('a true administrator bypasses every permission check', () => {
    expect(
      isRouteAllowed('/admin/academics/courses', FIXTURE_NAV, [], { isAdministrator: true }),
    ).toBe(true);
  });

  it('falls back to the portal-wide permission set for an unguarded route when fallbackPermissions is set', () => {
    const options = { fallbackPermissions: collectPermissions(FIXTURE_NAV) };
    expect(isRouteAllowed('/admin/dashboard', FIXTURE_NAV, ['reports.read'], options)).toBe(true);
    expect(isRouteAllowed('/admin/dashboard', FIXTURE_NAV, [], options)).toBe(false);
  });
});

describe('ADMIN_NAV regression: no invented permission strings', () => {
  it('never gates a nav item behind the non-existent "catalog.read" permission', () => {
    const permissions = flattenNav(ADMIN_NAV).map((entry) => entry.permission);
    expect(permissions).not.toContain('catalog.read');
  });

  it('every guarded nav item uses a real backend permission (dot-notation, known domain)', () => {
    const realDomains = [
      'audit',
      'categories',
      'certificates',
      'courses',
      'dashboard',
      'enrollments',
      'learning',
      'lessons',
      'notifications',
      'payments',
      'permissions',
      'promotions',
      'reports',
      'roles',
      'sections',
      'settings',
      'users',
    ];
    for (const permission of collectPermissions(ADMIN_NAV)) {
      const domain = permission.split('.')[0];
      expect(realDomains).toContain(domain);
    }
  });
});
