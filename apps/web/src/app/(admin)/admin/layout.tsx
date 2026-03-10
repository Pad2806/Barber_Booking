'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Store,
  Star,
  Settings,
  LogOut,
  Menu,
  User,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Role,
  hasPermission,
  ADMIN_MENU_ITEMS,
  ROLE_DISPLAY,
} from '@reetro/shared';

interface AdminLayoutProps {
  children: ReactNode;
}

// Map menu keys to icons
const MENU_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  bookings: Calendar,
  staff: Users,
  services: Scissors,
  salons: Store,
  reviews: Star,
  settings: Settings,
  customers: UserCheck,
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin');
    }
  }, [status, router]);

  // Compute visible menu items from SHARED permission definitions
  const visibleMenuItems = useMemo(() => {
    if (!me) return [];

    const role = me.role as Role;
    const staffPosition = me.staff?.position || null;

    // Build menu from shared ADMIN_MENU_ITEMS + profile link
    const adminItems: Array<{ key: string; href: string; label: string; icon: React.ElementType }> =
      ADMIN_MENU_ITEMS
        .filter(item => hasPermission(role, item.permission, staffPosition))
        .map(item => ({
          key: item.key,
          href: item.href,
          label: item.label,
          icon: MENU_ICONS[item.key] || LayoutDashboard,
        }));

    // Always add profile link
    adminItems.push({ key: 'profile', href: '/profile', label: 'Tài khoản', icon: User });

    return adminItems;
  }, [me]);

  // Check if current route is accessible
  useEffect(() => {
    if (!me || isLoadingMe) return;

    const role = me.role as Role;

    // Block customer
    if (role === Role.CUSTOMER) return;

    const isRouteAllowed = visibleMenuItems.some(
      item => pathname === item.href || pathname.startsWith(item.href + '/')
    );

    if (!isRouteAllowed && pathname.startsWith('/admin')) {
      const firstAllowed = visibleMenuItems[0]?.href || '/';
      router.replace(firstAllowed);
    }
  }, [me, isLoadingMe, pathname, visibleMenuItems, router]);

  if (status === 'loading' || (status === 'authenticated' && isLoadingMe)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Block customers
  if (me && me.role === Role.CUSTOMER) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">Truy cập bị từ chối</h2>
          <p className="text-gray-500">Bạn không có quyền truy cập trang quản trị.</p>
          <Link href="/" className="inline-block px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const roleInfo = ROLE_DISPLAY[me?.role || ''];
  const staffPosition = me?.staff?.position;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 fixed inset-y-0 left-0 z-50 hidden lg:block border-r border-[#1e293b]">
        <div className="p-6">
          <Link href="/admin" className="text-xl font-bold text-white tracking-tight">
            Reetro<span className="text-blue-500">Admin</span>
          </Link>
        </div>

        <nav className="px-4 space-y-1.5">
          {visibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-blue-200" : "text-slate-400 group-hover:text-white")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3 bg-[#0f172a] border-t border-[#1e293b]">
          {roleInfo && (
            <div className="px-4 py-3 rounded-lg bg-[#1e293b]/50 border border-[#334155]/50">
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', roleInfo.color)} />
                <span className="text-xs font-semibold text-slate-200">{roleInfo.label}</span>
              </div>
              {staffPosition && (
                <p className="text-xs text-slate-500 mt-1.5 ml-4 font-medium">
                  {staffPosition.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <button className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                Xin chào, <strong className="text-slate-900 font-semibold">{session?.user?.name}</strong>
              </span>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold border border-blue-100 shadow-sm">
                {session?.user?.name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
