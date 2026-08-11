import { ROUTES } from '@/constants/routes';
import { getPostLoginRoute, isStudent } from './user-type';

/**
 * True only for a same-origin, relative, in-app path. Rejects absolute URLs
 * (`https://evil.com`), protocol-relative URLs (`//evil.com` - the browser
 * resolves this against its own scheme, making it an open redirect despite
 * having no explicit `http(s)://`), and a backslash variant some browsers
 * normalize the same way (`/\evil.com`). This is the sole gate between a
 * user-controlled `?redirect=` query param (or the sessionStorage-stashed
 * Google-login equivalent below) and any navigation call.
 */
export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (path.startsWith('/\\')) return false;
  return true;
}

/**
 * The URL to land on after a successful login/OAuth callback. A preserved
 * `?redirect=` (set by `middleware.ts` when it bounced an unauthenticated
 * visitor off a protected route) wins over the default-to-portal behavior,
 * but only if it's safe and actually inside the area this account belongs
 * to - a student's preserved redirect into `/admin/*` is not honored (they
 * would only bounce straight back off `AuthorizationGate`'s `restrictTo`
 * check), and likewise a non-student's preserved redirect into
 * `/dashboard/*`. Anything outside both portal prefixes (a public page) is
 * honored as-is. No redirect, or a rejected one, falls back to the
 * account's own portal root (see `getPostLoginRoute`).
 */
export function resolvePostLoginRedirect(
  redirectParam: string | null | undefined,
  roles: string[],
): string {
  if (!isSafeRedirectPath(redirectParam)) return getPostLoginRoute(roles);
  const area: 'student' | 'staff' = isStudent(roles) ? 'student' : 'staff';
  if (redirectParam.startsWith('/dashboard') && area !== 'student') return getPostLoginRoute(roles);
  if (redirectParam.startsWith('/admin') && area !== 'staff') return getPostLoginRoute(roles);
  return redirectParam;
}

/** The login URL a protected-route bounce should target, preserving where the user was headed. */
export function buildLoginRedirect(pathname: string): string {
  return `${ROUTES.auth.login}?redirect=${encodeURIComponent(pathname)}`;
}

const GOOGLE_REDIRECT_KEY = 'joel-academy-post-google-login-redirect';

/**
 * Stashes a same-origin redirect target in `sessionStorage` immediately
 * before the full-page navigation to the backend's `/auth/google` - the
 * OAuth round trip always returns to a fixed
 * `/auth/google/callback#access_token=...` with no query passthrough, so a
 * query string can't survive the trip. `sessionStorage` does (same tab,
 * cleared on tab close). Call from the login/register page right before
 * `loginWithGoogle()`.
 */
export function storeGoogleRedirect(path: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (isSafeRedirectPath(path)) sessionStorage.setItem(GOOGLE_REDIRECT_KEY, path);
  else sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
}

/** Reads and clears the stashed redirect target - call once from `/auth/google/callback`. */
export function consumeGoogleRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(GOOGLE_REDIRECT_KEY);
  sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
  return value;
}
