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
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Role,
  getUserMultiRolePermissions,
  ADMIN_MENU_ITEMS,
} from '@reetro/shared';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOnboarding } from '@/hooks/use-onboarding';
import { WelcomeModal, TourButton } from '@/components/onboarding/OnboardingComponents';
import { NotificationBell } from '@/components/admin/NotificationBell';

interface AdminLayoutProps {
  children: ReactNode;
}

const MENU_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  bookings: Calendar,
  staff: Users,
  services: Scissors,
  salons: Store,
  reviews: Star,
  settings: Settings,
  customers: UserCheck,
  'branch-revenue': TrendingUp,
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || '';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { showWelcome, startTour, resetTour, dismissWelcome, config: onboardingConfig } = useOnboarding('admin');

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

  const visibleMenuItems = useMemo(() => {
    if (!me) return [];
    // Multi-role: get union of all permissions from all assigned roles
    const userRoles: Role[] = ((me as any).roles as Role[]) || [me.role as Role];
    const userPermissions = getUserMultiRolePermissions(userRoles);

    interface MenuItem {
      key: string;
      href: string;
      label: string;
      icon: React.ElementType;
    }

    const adminItems: MenuItem[] = ADMIN_MENU_ITEMS
      .filter(item => userPermissions.includes(item.permission))
      .map(item => ({
        key: item.key,
        href: item.href,
        label: item.label,
        icon: MENU_ICONS[item.key] || LayoutDashboard,
      }));

    adminItems.push({ 
      key: 'profile', 
      href: '/admin/profile', 
      label: 'Tài khoản', 
      icon: User 
    });
    return adminItems;
  }, [me]);

  useEffect(() => {
    if (!me || isLoadingMe) return;
    const role = me.role as Role;
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
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (me && me.role === Role.CUSTOMER) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">Truy cập bị từ chối</h2>
          <p className="text-gray-500">Bạn không có quyền truy cập trang quản trị.</p>
          <Link href="/" className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className={cn("px-6 mb-8 flex items-center", isCollapsed && !isMobileOpen ? "justify-center px-2" : "justify-between")}>
        <Link href="/admin" className={cn("font-heading font-black italic tracking-tighter transition-all hover:scale-105", isCollapsed && !isMobileOpen ? "text-xl" : "text-2xl")}>
          {isCollapsed && !isMobileOpen ? (
            <span className="text-primary text-2xl">R</span>
          ) : (
            <span className="text-white">REETRO<span className="text-primary ml-1">BARBER</span></span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {visibleMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium text-sm group',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                isCollapsed && !isMobileOpen && "justify-center"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
              {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pt-4 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 hover:bg-destructive/10 hover:text-destructive w-full transition-colors font-medium text-sm",
            isCollapsed && !isMobileOpen && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "bg-[#0f172a] text-slate-300 fixed inset-y-0 left-0 z-50 hidden lg:block border-r border-slate-800 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-primary text-white rounded-full p-1 shadow-lg border border-primary/20 hover:scale-110 transition-transform"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", isCollapsed ? "lg:ml-20" : "lg:ml-64")}>
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-40 transition-all">
          <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 bg-[#0f172a] border-slate-800 w-64">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              <h2 className="text-sm font-semibold text-slate-500 hidden sm:block uppercase tracking-wider">
                {visibleMenuItems.find(i => pathname.startsWith(i.href))?.label || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <TourButton onClick={resetTour} />
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-1 rounded-full hover:bg-slate-100">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-900 leading-none">{session?.user?.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 capitalize">{me?.role.toLowerCase()}</p>
                    </div>
                    <Avatar className="h-8 w-8 border-2 border-primary/20 ring-offset-2 transition-all group-hover:ring-2">
                       <AvatarImage src={session?.user?.image || undefined} />
                       <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                         {session?.user?.name?.charAt(0) || 'A'}
                       </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile" className="flex items-center gap-2">
                       <User className="w-4 h-4" /> Hồ sơ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="flex items-center gap-2">
                       <Settings className="w-4 h-4" /> Cài đặt
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>

    {/* Onboarding */}
    {showWelcome && (
      <WelcomeModal
        title={onboardingConfig.title}
        description={onboardingConfig.description}
        onStart={startTour}
        onDismiss={dismissWelcome}
      />
    )}
    </>
  );
}
