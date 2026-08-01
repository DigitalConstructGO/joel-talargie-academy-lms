import { NextResponse, type NextRequest } from 'next/server';
const protectedPaths = ['/dashboard', '/student', '/admin'];
const guestPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];
export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get('refresh_token'));
  const path = request.nextUrl.pathname;
  if (protectedPaths.some((item) => path.startsWith(item)) && !hasSession)
    return NextResponse.redirect(new URL('/auth/login', request.url));
  if (guestPaths.some((item) => path.startsWith(item)) && hasSession)
    return NextResponse.redirect(new URL('/dashboard', request.url));
  return NextResponse.next();
}
export const config = {
  matcher: ['/dashboard/:path*', '/student/:path*', '/admin/:path*', '/auth/:path*'],
};
