import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildLoginRedirect,
  consumeGoogleRedirect,
  isSafeRedirectPath,
  resolvePostLoginRedirect,
  storeGoogleRedirect,
} from './redirect';

describe('isSafeRedirectPath', () => {
  it('accepts a relative in-app path', () => {
    expect(isSafeRedirectPath('/dashboard/courses')).toBe(true);
  });

  it('rejects null/undefined/empty', () => {
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(undefined)).toBe(false);
    expect(isSafeRedirectPath('')).toBe(false);
  });

  it('rejects an absolute external URL', () => {
    expect(isSafeRedirectPath('https://evil.com')).toBe(false);
  });

  it('rejects a protocol-relative URL (open redirect via scheme-relative resolution)', () => {
    expect(isSafeRedirectPath('//evil.com')).toBe(false);
  });

  it('rejects a backslash-prefixed path some browsers normalize like a protocol-relative URL', () => {
    expect(isSafeRedirectPath('/\\evil.com')).toBe(false);
  });

  it('rejects a path with no leading slash', () => {
    expect(isSafeRedirectPath('evil.com')).toBe(false);
  });
});

describe('resolvePostLoginRedirect', () => {
  it('honors a safe redirect inside the student portal for a student', () => {
    expect(resolvePostLoginRedirect('/dashboard/courses', ['STUDENT'])).toBe('/dashboard/courses');
  });

  it('honors a safe redirect inside the admin portal for staff', () => {
    expect(resolvePostLoginRedirect('/admin/users', ['ADMINISTRATOR'])).toBe('/admin/users');
  });

  it("falls back to the account's own portal root when a student's redirect targets /admin", () => {
    expect(resolvePostLoginRedirect('/admin/users', ['STUDENT'])).toBe('/dashboard');
  });

  it("falls back to the account's own portal root when staff's redirect targets /dashboard", () => {
    expect(resolvePostLoginRedirect('/dashboard/courses', ['ADMINISTRATOR'])).toBe(
      '/admin/dashboard',
    );
  });

  it('honors a redirect outside both portal prefixes (a public page) regardless of role', () => {
    expect(resolvePostLoginRedirect('/pricing', ['STUDENT'])).toBe('/pricing');
  });

  it('falls back to the portal root for an unsafe redirect', () => {
    expect(resolvePostLoginRedirect('https://evil.com', ['STUDENT'])).toBe('/dashboard');
  });

  it('falls back to the portal root when no redirect is given', () => {
    expect(resolvePostLoginRedirect(null, ['STUDENT'])).toBe('/dashboard');
  });
});

describe('buildLoginRedirect', () => {
  it('builds a login URL carrying the original path as a query param', () => {
    expect(buildLoginRedirect('/admin/users')).toBe('/auth/login?redirect=%2Fadmin%2Fusers');
  });
});

describe('storeGoogleRedirect / consumeGoogleRedirect', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('round-trips a safe path through sessionStorage', () => {
    storeGoogleRedirect('/dashboard/courses');
    expect(consumeGoogleRedirect()).toBe('/dashboard/courses');
  });

  it('consuming clears the stashed value (one-shot read)', () => {
    storeGoogleRedirect('/dashboard/courses');
    consumeGoogleRedirect();
    expect(consumeGoogleRedirect()).toBeNull();
  });

  it('does not stash an unsafe path', () => {
    storeGoogleRedirect('https://evil.com');
    expect(consumeGoogleRedirect()).toBeNull();
  });
});
