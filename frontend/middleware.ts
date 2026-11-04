/**
 * Next.js Edge Middleware — route protection via JWT cookie presence.
 * Full JWT verification happens on the FastAPI side (/api/auth/me).
 * This middleware only checks cookie existence to avoid loading jose on the edge.
 */
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const ADMIN_PATHS  = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  // Allow public auth pages
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // If already logged in, redirect to main app
    if (token) {
      return NextResponse.redirect(new URL('/tanya', request.url));
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/tanya', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect all other app pages
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin path protection — role check is enforced by the API; here we just
  // let the page render and show an error if the API returns 403.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes (FastAPI proxy handles its own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};

