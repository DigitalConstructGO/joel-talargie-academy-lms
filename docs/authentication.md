# Phase 3 authentication

The API uses short-lived bearer access tokens (15 minutes) and rotating refresh tokens (7 days). Refresh tokens are stored in an HTTP-only, same-site cookie; the database stores a SHA-256 hash plus session expiry and revocation state.

Registration normalizes email addresses, hashes passwords with bcrypt, creates a profile, assigns `STUDENT`, and creates a single-use verification token. Login records successful and failed attempts. Password reset and password change invalidate active refresh sessions.

`JwtAuthGuard` protects routes by default. Add `@Public()` only to intentionally anonymous endpoints. `RolesGuard` enforces `@Roles('ADMINISTRATOR')`, `@Roles('STUDENT')`, or both. Authenticated responses never include `passwordHash`.

The Next.js client keeps the access token and safe user in Zustand. Axios sends credentials, injects the bearer token, and performs one refresh-and-retry after an expired protected request. Next middleware redirects guests away from `/dashboard`, `/student`, and `/admin` and redirects active sessions away from guest-only auth screens.

## Google OAuth 2.0

`GET /api/v1/auth/google` starts the Passport Google OAuth flow with `openid`, `email`, and `profile` scopes. A short-lived HTTP-only state cookie protects the callback from login CSRF. The callback accepts only a Google-authenticated profile with a verified email.

An existing normalized email is linked in place, preserving its user ID and all related LMS data. A new Google identity receives an active user, profile, and `STUDENT` role. Both cases use the same access-token, rotating refresh-session, logout, and RBAC pipeline as local authentication.
