import { NextResponse, type NextRequest } from 'next/server';
const protectedPaths = ['/dashboard', '/admin'];
const guestPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];
export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get('refresh_token'));
  const path = request.nextUrl.pathname;
  if (protectedPaths.some((item) => path.startsWith(item)) && !hasSession) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  // Middleware only knows cookie *presence*, never role (that's resolved
  // client-side via GET /auth/authorization) - so an already-authenticated
  // visitor hitting a guest-only auth page always bounces to the public
  // home page, never straight into a portal root. The navbar/
  // AuthorizationGate route them onward once roles are actually known.
  if (guestPaths.some((item) => path.startsWith(item)) && hasSession)
    return NextResponse.redirect(new URL('/', request.url));
  return NextResponse.next();
}
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*'],
};
