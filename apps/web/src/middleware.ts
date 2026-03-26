import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasPermission, hasMultiRolePermission, ROUTE_PERMISSION_MAP, Role, Permission } from '@reetro/shared';

/**
 * Middleware uses the centralized ROUTE_PERMISSION_MAP from @reetro/shared.
 * Supports multi-role via token.roles array (RBAC).
 * Falls back to token.role for backward compat with old JWT tokens.
 */

function resolveRoutePermission(pathname: string): Permission | null {
  // Match longest prefix first
  const sortedRoutes = Object.keys(ROUTE_PERMISSION_MAP).sort((a, b) => b.length - a.length);

  for (const route of sortedRoutes) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return ROUTE_PERMISSION_MAP[route];
    }
  }
  return null;
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login?callbackUrl=/admin', req.url));
      }

      // Multi-role: use token.roles array, fallback to single role
      const roles = (token.roles as string[]) || [token.role as string];

      // Block if ONLY role is CUSTOMER
      if (roles.length === 1 && roles[0] === 'CUSTOMER') {
        return NextResponse.redirect(new URL('/', req.url));
      }

      const requiredPermission = resolveRoutePermission(pathname);

      if (requiredPermission) {
        const allowed = hasMultiRolePermission(roles as Role[], requiredPermission);
        if (!allowed) {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      }
    }

    if (pathname.startsWith('/my-bookings') || pathname.startsWith('/booking') || pathname.startsWith('/payment')) {
      if (!token) {
        return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (
          pathname === '/' ||
          pathname.startsWith('/salons') ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/api')
        ) {
          return true;
        }

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
