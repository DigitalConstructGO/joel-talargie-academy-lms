import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/admin'];

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get('refresh_token'));
  const path = request.nextUrl.pathname;

  if (protectedPaths.some((item) => path.startsWith(item)) && !hasSession) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*'],
};
