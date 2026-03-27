'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { getUserMultiRolePermissions, Permission, Role } from '@reetro/shared';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Lazy-import the actual dashboard content from original pages
import dynamic from 'next/dynamic';

// For SUPER_ADMIN, SALON_OWNER, MANAGER — full analytics dashboard
const AdminDashboardContent = dynamic(
  () => import('@/app/(admin)/admin/page').then(m => ({ default: m.default })),
  { ssr: false },
);

// For CASHIER — cashier-specific dashboard (checkout/appointments focused)
const CashierDashboardContent = dynamic(
  () => import('@/app/(cashier)/cashier/dashboard/page').then(m => ({ default: m.default })),
  { ssr: false },
);

// For barbers/skinners (only VIEW_OWN_BOOKINGS)
const BarberDashboardContent = dynamic(
  () => import('@/app/(barber)/barber/dashboard/page').then(m => ({ default: m.default })),
  { ssr: false },
);

// Roles that have access to the full Admin analytics dashboard
const ADMIN_ANALYTICS_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SALON_OWNER, Role.MANAGER];

export default function DashboardPage() {
  const router = useRouter();

  const { data: me, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
  });

  const userRoles = useMemo((): Role[] => {
    if (!me) return [];
    const roles = (me as any).roles as Role[] | undefined;
    return roles?.length ? roles : [me.role as Role];
  }, [me]);

  const userPermissions = useMemo(
    () => getUserMultiRolePermissions(userRoles),
    [userRoles],
  );

  const hasFullAnalytics = userRoles.some(r => ADMIN_ANALYTICS_ROLES.includes(r));
  const isCashier = userRoles.includes(Role.CASHIER) && !hasFullAnalytics;
  const hasFullDashboard = userPermissions.includes(Permission.VIEW_DASHBOARD);
  const hasOwnBookings = userPermissions.includes(Permission.VIEW_OWN_BOOKINGS);

  // Redirect customer to home
  useEffect(() => {
    if (!isLoading && me && userRoles.length === 1 && userRoles[0] === Role.CUSTOMER) {
      router.replace('/');
    }
  }, [me, isLoading, userRoles, router]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-2xl" />)}
        </div>
        <div className="h-80 bg-white rounded-2xl" />
      </div>
    );
  }

  // Full analytics dashboard for admin/manager/salon_owner ONLY
  if (hasFullAnalytics) {
    return <AdminDashboardContent />;
  }

  // Cashier-specific dashboard
  if (isCashier || (hasFullDashboard && !hasFullAnalytics)) {
    return <CashierDashboardContent />;
  }

  // Personal schedule dashboard for barber/skinner
  if (hasOwnBookings) {
    return <BarberDashboardContent />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <p className="text-lg font-semibold">Chào mừng bạn!</p>
      <p className="text-sm mt-1">Chọn mục từ thanh bên để bắt đầu.</p>
    </div>
  );
}
