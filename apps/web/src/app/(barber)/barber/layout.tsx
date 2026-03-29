'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  Menu,
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  Scissors,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import toast from 'react-hot-toast';
import { NotificationBell } from '@/components/admin/NotificationBell';

interface BarberLayoutProps {
  children: ReactNode;
}

const BARBER_MENU_ITEMS = [
  { key: 'dashboard', href: '/barber/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'schedule', href: '/barber/schedule', label: 'Lịch làm việc', icon: Clock },
  { key: 'bookings', href: '/barber/bookings', label: 'Lịch phân công', icon: Calendar },
];

export default function BarberLayout({ children }: BarberLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
    } else if (status === 'authenticated') {
      // Multi-role: check all assigned roles (UserRole table → JWT roles[])
      const userRoles: string[] = ((session?.user as any)?.roles as string[]) || [session?.user?.role || ''];

      const isBarber =
        userRoles.includes('BARBER') ||
        userRoles.includes('SKINNER') ||
        userRoles.includes('SUPER_ADMIN') ||
        userRoles.includes('SALON_OWNER') ||
        userRoles.includes('MANAGER');

      if (!isBarber && !isLoadingMe && me) {
        toast.error('Bạn không có quyền truy cập trang này');
        router.push('/');
      }
    }
  }, [status, router, session, me, isLoadingMe]);

  if (status === 'loading' || (status === 'authenticated' && isLoadingMe)) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#8B7355] font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          'h-16 flex items-center border-b border-white/[0.08] shrink-0',
          isCollapsed && !isMobileOpen ? 'justify-center px-4' : 'justify-between px-5'
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          {isCollapsed && !isMobileOpen ? (
            <div className="w-9 h-9 rounded-xl bg-[#C8A97E] flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-[#C8A97E] flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none tracking-tight">REETRO</p>
                <p className="text-[10px] text-[#C8A97E] font-semibold tracking-widest mt-0.5">
                  BARBER
                </p>
              </div>
            </>
          )}
        </Link>
        {!isCollapsed && !isMobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 text-white/30 hover:text-white hover:bg-white/10"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        {isMobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {BARBER_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group',
                isActive
                  ? 'bg-[#C8A97E]/15 text-[#C8A97E] font-semibold'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80',
                isCollapsed && !isMobileOpen && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-colors',
                  isActive ? 'text-[#C8A97E]' : 'text-white/35 group-hover:text-white/60'
                )}
              />
              {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info & Logout at bottom */}
      {(!isCollapsed || isMobileOpen) && (
        <div className="p-4 border-t border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3 px-1">
            <Avatar className="h-9 w-9 border-2 border-[#C8A97E]/25">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-[#C8A97E]/15 text-[#C8A97E] text-xs font-bold">
                {session?.user?.name?.charAt(0) || 'B'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session?.user?.name}</p>
              <p className="text-[11px] text-[#C8A97E]/80 font-medium">
                {me?.staff?.position || 'Barber'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/25 hover:text-rose-400 hover:bg-rose-500/10"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      {isCollapsed && !isMobileOpen && (
        <div className="p-3 border-t border-white/[0.08] shrink-0 flex justify-center">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2.5 rounded-xl text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-[#FAF8F5] flex overflow-hidden">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-[#1C1612] z-50 flex flex-col transition-all duration-300 ease-in-out',
          isCollapsed && !isMobileOpen ? 'w-[72px]' : 'w-64',
          'lg:relative',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent />
        {isCollapsed && !isMobileOpen && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute -right-3 top-20 bg-[#C8A97E] text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform hidden lg:flex items-center justify-center"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top header bar */}
        <header className="h-16 bg-white border-b border-[#E8E0D4]/40 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 text-[#5C4A32]"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <p className="text-[11px] font-semibold text-[#8B7355] uppercase tracking-wider hidden sm:block">
              Khu vực nhân viên
            </p>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Rating */}
            <div className="hidden sm:flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="text-xs font-bold">{me?.staff?.rating || '5.0'}</span>
            </div>

            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 pl-3 pr-1.5 rounded-full hover:bg-[#FAF8F5] h-auto py-1.5"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-[#2C1E12] leading-none">
                      {session?.user?.name}
                    </p>
                    <p className="text-[10px] text-[#C8A97E] mt-0.5 font-medium">
                      {me?.staff?.position || 'Barber'}
                    </p>
                  </div>
                  <Avatar className="h-8 w-8 border border-[#C8A97E]/20">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="bg-[#C8A97E]/10 text-[#C8A97E] text-xs font-bold">
                      {session?.user?.name?.charAt(0) || 'B'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 mt-1">
                <DropdownMenuLabel className="text-[10px] text-[#8B7355] uppercase tracking-wider font-semibold px-3 py-1.5">
                  Tài khoản
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg h-9 px-3 font-medium text-slate-600 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
