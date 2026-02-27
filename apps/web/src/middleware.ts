import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { hasPermission, ROUTE_PERMISSION_MAP, Role, Permission } from '@reetro/shared';

/**
 * Middleware uses the centralized ROUTE_PERMISSION_MAP from @reetro/shared.
 *
 * NOTE: In middleware we only have Role from the JWT token, NOT StaffPosition.
 * For STAFF role, we allow access to /admin/* at the middleware level,
 * and the AdminLayout (client-side) does the fine-grained position-based filtering
 * after fetching the user's position from the API.
 *
 * The backend PermissionsGuard is the ultimate enforcer — even if a STAFF member
 * somehow reaches a page, the API call will be rejected if they lack the permission.
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

// STAFF can access any admin route at middleware level (position check happens in layout + backend)
const STAFF_ALLOWED_PERMISSIONS = new Set<Permission>([
  Permission.VIEW_DASHBOARD,
  Permission.VIEW_ALL_BOOKINGS,
  Permission.VIEW_OWN_BOOKINGS,
  Permission.MANAGE_BOOKINGS,
  Permission.VIEW_STAFF,
  Permission.MANAGE_STAFF,
  Permission.VIEW_SERVICES,
  Permission.MANAGE_SERVICES,
  Permission.VIEW_REVIEWS,
  Permission.REPLY_REVIEWS,
  Permission.VIEW_REVENUE,
]);

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login?callbackUrl=/admin', req.url));
      }

      const role = token.role as string;

      // Block CUSTOMER from all admin routes
      if (role === 'CUSTOMER') {
        return NextResponse.redirect(new URL('/', req.url));
      }

      const requiredPermission = resolveRoutePermission(pathname);

      if (requiredPermission) {
        // For non-STAFF roles, check permission directly
        if (role !== 'STAFF') {
          const allowed = hasPermission(role as Role, requiredPermission);
          if (!allowed) {
            return NextResponse.redirect(new URL('/admin', req.url));
          }
        }
        // For STAFF: middleware allows access, backend + layout enforce position-based permissions
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
