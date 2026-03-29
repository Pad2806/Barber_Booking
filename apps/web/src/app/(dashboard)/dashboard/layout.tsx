'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useMemo, useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  CreditCard,
  UserPlus,
  Smartphone,
  ClipboardList,
  BarChart3,
  Clock,
  ShieldAlert,
  X,
  Shield,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Role,
  getVisibleDashboardMenuItems,
  ROLE_DISPLAY,
} from '@reetro/shared';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/admin/NotificationBell';

// ── Icon mapping for menu keys ──────────────────────────────────
const MENU_ICONS: Record<string, React.ElementType> = {
  'dashboard': LayoutDashboard,
  'admin-dashboard': LayoutDashboard,
  'my-schedule': Clock,
  'my-bookings': ClipboardList,
  'online-bookings': Smartphone,
  'walk-in': UserPlus,
  'appointments': ClipboardList,
  'checkout': CreditCard,
  'cashier-revenue': BarChart3,
  'bookings': Calendar,
  'admin-bookings': Calendar,
  'staff': Users,
  'admin-staff': Users,
  'leave-requests': Clock,
  'admin-leave': Clock,
  'schedule': Calendar,
  'admin-schedule': Calendar,
  'services': Scissors,
  'admin-services': Scissors,
  'reviews': Star,
  'admin-reviews': Star,
  'revenue': BarChart3,
  'admin-revenue': BarChart3,
  'salons': Store,
  'customers': UserCheck,
  'roles': Shield,
  'settings': Settings,
};

// ── Section labels ───────────────────────────────────────────────
const SECTION_LABELS: Record<string, string> = {
  barber: 'Hoạt động cá nhân',
  cashier: 'Thu ngân',
  management: 'Quản lý',
  admin: 'Quản trị',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || '';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    enabled: status === 'authenticated',
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });


  // ── Redirect if unauthenticated ──────────────────────────────
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
    }
  }, [status, router]);

  // ── Resolve user's current roles array ───────────────────────
  const userRoles = useMemo((): Role[] => {
    if (!me) return [];
    const rolesFromDb = (me as any).roles as Role[] | undefined;
    if (rolesFromDb?.length) return rolesFromDb;
    return [me.role as Role];
  }, [me]);

  // ── Filter menu items by user's roles + permissions ─────────
  const visibleMenuItems = useMemo(
    () => getVisibleDashboardMenuItems(userRoles),
    [userRoles],
  );

  // ── Block pure customers ────────────────────────────────────
  const isCustomerOnly = useMemo(
    () => !isLoadingMe && me && userRoles.length === 1 && userRoles[0] === Role.CUSTOMER,
    [me, isLoadingMe, userRoles],
  );

  // ── Deduplicate by href (same page, different keys per role) ──
  const deduplicatedMenu = useMemo(() => {
    const seen = new Set<string>();
    return visibleMenuItems.filter(item => {
      const id = `${item.section}::${item.href}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [visibleMenuItems]);

  // ── Group menu items by section ─────────────────────────────
  const menuBySection = useMemo(() => {
    const sections: Record<string, typeof deduplicatedMenu[number][]> = {};
    for (const item of deduplicatedMenu) {
      if (!sections[item.section]) sections[item.section] = [];
      sections[item.section].push(item);
    }
    return sections;
  }, [deduplicatedMenu]);

  if (status === 'loading' || (status === 'authenticated' && isLoadingMe)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (isCustomerOnly) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 max-w-sm">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">Truy cập bị từ chối</h2>
          <p className="text-gray-500">Bạn không có quyền truy cập bảng điều khiển.</p>
          <Link href="/" className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4">
      {/* Logo */}
      <div className={cn('px-6 mb-6 flex items-center', isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between')}>
        <Link
          href="/dashboard"
          className={cn('font-heading font-black italic tracking-tighter transition-all hover:scale-105', isCollapsed && !isMobileOpen ? 'text-xl' : 'text-2xl')}
        >
          {isCollapsed && !isMobileOpen ? (
            <span className="text-primary text-2xl">R</span>
          ) : (
            <span className="text-white">REETRO<span className="text-primary ml-1">BARBER</span></span>
          )}
        </Link>
        {!isCollapsed && !isMobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        {isMobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation — grouped by section */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-1 scrollbar-none">
        {Object.entries(menuBySection).map(([section, items]) => (
          <div key={section}>
            {/* Section divider label */}
            {(!isCollapsed || isMobileOpen) && (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 pt-4 pb-1">
                {SECTION_LABELS[section] || section}
              </p>
            )}
            {isCollapsed && !isMobileOpen && (
              <div className="border-t border-slate-800 my-2" />
            )}
            {items.map(item => {
              const Icon = MENU_ICONS[item.key] || LayoutDashboard;
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium text-sm group',
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                    isCollapsed && !isMobileOpen && 'justify-center',
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                  {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User info + roles */}
      {(!isCollapsed || isMobileOpen) && (
        <div className="px-3 pt-4 mt-2 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarFallback className="bg-slate-900 text-white text-xs font-black italic">
                {session?.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{session?.user?.name}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {userRoles.slice(0, 2).map(r => (
                  <span key={r} className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                    {ROLE_DISPLAY[r]?.label || r}
                  </span>
                ))}
                {userRoles.length > 2 && (
                  <span className="text-[9px] text-slate-400">+{userRoles.length - 2}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 w-full transition-all font-medium text-sm mt-1"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
      {isCollapsed && !isMobileOpen && (
        <div className="p-3 border-t border-slate-800 flex justify-center">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'bg-[#0f172a] text-slate-300 fixed inset-y-0 left-0 z-50 hidden lg:block border-r border-slate-800 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-64',
        )}
      >
        <SidebarContent />
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute -right-3 top-20 bg-primary text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </aside>

      {/* Main content */}
      <div className={cn('flex-1 flex flex-col min-w-0 transition-all duration-300', isCollapsed ? 'lg:ml-20' : 'lg:ml-64')}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
          <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden hover:bg-slate-100 rounded-xl">
                    <Menu className="w-6 h-6 text-slate-600" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 bg-[#0f172a] border-slate-800 w-64">
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <h2 className="text-sm font-semibold text-slate-500 hidden sm:block uppercase tracking-wider">
                {deduplicatedMenu.find(i => i.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(i.href))?.label || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-1 rounded-full hover:bg-slate-100">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-900 leading-none">{session?.user?.name}</p>
                      <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-tighter italic">
                        {userRoles.map(r => ROLE_DISPLAY[r]?.label || r).join(' · ')}
                      </p>
                    </div>
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarFallback className="bg-slate-900 text-white font-black italic text-xs">
                        {session?.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 border-slate-100 shadow-2xl">
                  <div className="px-3 py-2">
                    <p className="text-xs font-bold text-slate-900">{session?.user?.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userRoles.map(r => (
                        <Badge key={r} variant="secondary" className="text-[9px] h-4">
                          {ROLE_DISPLAY[r]?.label || r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-lg h-10 px-3 font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-all flex items-center"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  >
                    <LogOut className="w-4 h-4 mr-3" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 animate-in fade-in duration-700">
          {children}
        </main>
      </div>
    </div>
  );
}
