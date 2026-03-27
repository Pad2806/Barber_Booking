import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  hasMultiRolePermission,
  ROUTE_PERMISSION_MAP,
  DASHBOARD_ROUTE_PERMISSION_MAP,
  Role,
  Permission,
} from '@reetro/shared';

/**
 * Unified proxy for RBAC route protection (Next.js 16).
 * Replaces the old middleware.ts + withAuth pattern.
 * Supports multi-role via session.user.roles[] (RBAC).
 */

function resolveRoutePermission(
  pathname: string,
  map: Record<string, Permission>,
): Permission | null {
  const sortedRoutes = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const route of sortedRoutes) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return map[route];
    }
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // ── /dashboard/* protection ──────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/dashboard', request.url));
    }

    // Resolve roles (multi-role array or fallback to single role)
    const roles = (session.user as any)?.roles || [(session.user as any)?.role];

    // Block pure customers
    if (roles.length === 1 && roles[0] === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check route-specific permission
    const requiredPermission = resolveRoutePermission(pathname, DASHBOARD_ROUTE_PERMISSION_MAP);
    if (requiredPermission) {
      const allowed = hasMultiRolePermission(roles as Role[], requiredPermission);
      if (!allowed) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // ── /admin/* protection (legacy — keep for backward compat) ───
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/admin', request.url));
    }

    const roles = (session.user as any)?.roles || [(session.user as any)?.role];

    if (roles.length === 1 && roles[0] === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const requiredPermission = resolveRoutePermission(pathname, ROUTE_PERMISSION_MAP);
    if (requiredPermission) {
      const allowed = hasMultiRolePermission(roles as Role[], requiredPermission);
      if (!allowed) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // ── Protected customer routes ──
  if (
    pathname.startsWith('/my-bookings') ||
    pathname.startsWith('/booking') ||
    pathname.startsWith('/payment')
  ) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/barber/:path*',
    '/cashier/:path*',
    '/manager/:path*',
    '/my-bookings/:path*',
    '/booking/:path*',
    '/payment/:path*',
  ],
};
