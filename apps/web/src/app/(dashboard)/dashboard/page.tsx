'use client';

import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { getUserMultiRolePermissions, Permission, Role } from '@reetro/shared';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Only import AdminDashboardContent — this one works fine for Admin/Manager
import dynamic from 'next/dynamic';
const AdminDashboardContent = dynamic(
  () => import('@/app/(admin)/admin/page').then(m => ({ default: m.default })),
  { ssr: false },
);

// Roles that have access to the full Admin analytics dashboard
const ADMIN_ANALYTICS_ROLES: Role[] = [Role.SUPER_ADMIN, Role.SALON_OWNER, Role.MANAGER];

export default function DashboardPage() {
  const router = useRouter();
  const { status } = useSession();

  const { data: me, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    enabled: status === 'authenticated',
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
  const isCashier = userRoles.includes(Role.CASHIER);
  const hasOwnBookings = userPermissions.includes(Permission.VIEW_OWN_BOOKINGS);

  // Build additive shortcuts based on ALL user roles (not mutual-exclusive)
  const shortcuts = useMemo(() => {
    const items: { label: string; href: string; desc: string; icon: string }[] = [];

    // Cashier shortcuts
    if (isCashier) {
      items.push(
        { label: 'Duyệt lịch Online', href: '/dashboard/online-bookings', desc: 'Duyệt booking mới từ website', icon: '📱' },
        { label: 'Tiếp nhận khách', href: '/dashboard/walk-in', desc: 'Tạo booking cho khách vãng lai', icon: '🚶' },
        { label: 'Thanh toán', href: '/dashboard/checkout', desc: 'Xử lý thanh toán tại quầy', icon: '💳' },
        { label: 'Lịch hẹn', href: '/dashboard/appointments', desc: 'Xem tất cả lịch hẹn hôm nay', icon: '📋' },
      );
    }

    // Barber/Skinner shortcuts
    if (hasOwnBookings) {
      items.push(
        { label: 'Lịch làm việc', href: '/dashboard/my-schedule', desc: 'Xem ca làm việc của bạn', icon: '🗓️' },
        { label: 'Lịch phân công', href: '/dashboard/my-bookings', desc: 'Xem khách hàng được phân công', icon: '📅' },
      );
    }

    return items;
  }, [isCashier, hasOwnBookings]);

  // Redirect customer to home
  useEffect(() => {
    if (!isLoading && me && userRoles.length === 1 && userRoles[0] === Role.CUSTOMER) {
      router.replace('/');
    }
  }, [me, isLoading, userRoles, router]);

  if (isLoading || status === 'loading') {
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

  // Full analytics dashboard for admin/manager/salon_owner
  if (hasFullAnalytics) {
    return <AdminDashboardContent />;
  }

  // Staff dashboard: additive shortcuts for all assigned roles
  if (shortcuts.length > 0) {
    // Determine greeting based on role combination
    const roleLabels: string[] = [];
    if (isCashier) roleLabels.push('Thu ngân');
    if (hasOwnBookings && !isCashier) roleLabels.push('Nhân viên');
    if (hasOwnBookings && isCashier) roleLabels.push('Thợ');
    const greeting = roleLabels.join(' & ') || 'Nhân viên';
    const emoji = isCashier && hasOwnBookings ? '💈' : isCashier ? '👋' : '✂️';

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">
            Xin chào, {me?.name || greeting} {emoji}
          </h1>
          <p className="text-slate-500 mt-1">Chọn chức năng từ thanh bên hoặc bên dưới để bắt đầu làm việc.</p>
          {isCashier && hasOwnBookings && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {userRoles.map(r => (
                <span key={r} className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {r === Role.CASHIER ? 'Thu ngân' : r === Role.BARBER ? 'Barber' : r === Role.SKINNER ? 'Skinner' : r}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortcuts.map(action => (
            <a
              key={action.href}
              href={action.href}
              className="bg-white rounded-xl p-5 border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{action.label}</h3>
              <p className="text-sm text-slate-500 mt-1">{action.desc}</p>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <p className="text-lg font-semibold">Chào mừng bạn!</p>
      <p className="text-sm mt-1">Chọn mục từ thanh bên để bắt đầu.</p>
    </div>
  );
}
