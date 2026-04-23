'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Smartphone,
  UserPlus,
  ClipboardList,
  CreditCard,
  BarChart3,
  CalendarOff,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '@/hooks/use-onboarding';
import { WelcomeModal, TourButton } from '@/components/onboarding/OnboardingComponents';
import { NotificationBell } from '@/components/admin/NotificationBell';

const NAV_ITEMS = [
  { key: 'dashboard', href: '/cashier/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'online', href: '/cashier/online-bookings', label: 'Duyệt Online', icon: Smartphone },
  { key: 'walkin', href: '/cashier/walk-in', label: 'Khách vãng lai', icon: UserPlus },
  { key: 'appointments', href: '/cashier/appointments', label: 'Lịch hẹn', icon: ClipboardList },
  { key: 'checkout', href: '/cashier/checkout', label: 'Thanh toán', icon: CreditCard },
  { key: 'revenue', href: '/cashier/revenue', label: 'Doanh thu', icon: BarChart3 },
  { key: 'leave-requests', href: '/cashier/leave-requests', label: 'Nghỉ phép', icon: CalendarOff },
];

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { showWelcome, startTour, resetTour, dismissWelcome, config: onboardingConfig } = useOnboarding('cashier');

  const { data: me, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !me) {
      router.push('/login?callbackUrl=/dashboard');
    }
  }, [me, isLoading, router]);

  if (isLoading || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  const activeKey = NAV_ITEMS.find((item) => pathname?.startsWith(item.href))?.key || 'dashboard';

  return (
    <>
    <div className="h-screen bg-slate-50/50 flex overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-white border-r border-slate-100 z-50 flex flex-col transition-all duration-300',
          isCollapsed && !isMobileOpen ? 'w-20' : 'w-64',
          'lg:relative lg:h-screen',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <Link
            href="/dashboard"
            className={cn(
              'font-heading font-black italic tracking-tighter transition-all hover:scale-105',
              isCollapsed && !isMobileOpen ? 'text-lg' : 'text-xl',
            )}
          >
            {isCollapsed && !isMobileOpen ? (
              <span className="text-primary">R</span>
            ) : (
              <>
                <span className="text-slate-900">RETRO</span>
                <span className="text-primary"> BARBER</span>
              </>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 text-slate-400 hover:text-slate-900"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronLeft
              className={cn('w-4 h-4 transition-transform', isCollapsed && 'rotate-180')}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600',
                  )}
                />
                {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-4 border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src={me.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {me.name?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{me.name}</p>
                <p className="text-[11px] text-slate-400 font-medium">Thu ngân</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-rose-500"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                QUẦY THU NGÂN
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TourButton onClick={resetTour} />
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-100">
              <Avatar className="h-8 w-8">
                <AvatarImage src={me.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {me.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-slate-900">{me.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/80">{children}</main>
      </div>
    </div>

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
