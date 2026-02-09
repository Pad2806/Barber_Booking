import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Check admin routes
    if (pathname.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login?callbackUrl=/admin', req.url));
      }

      // Check if user has admin role
      if (token.role !== 'SUPER_ADMIN' && token.role !== 'SALON_OWNER' && token.role !== 'STAFF') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Check my-bookings routes
    if (pathname.startsWith('/my-bookings')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login?callbackUrl=/my-bookings', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/salons') ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/api')
        ) {
          return true;
        }

        // Require auth for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/my-bookings/:path*',
    '/booking/:path*',
    '/payment/:path*',
  ],
};
