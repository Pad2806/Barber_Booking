'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardList,
  BarChart3,
  MessageSquare,
  MapPin,
  Bell
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { cn } from '@/lib/utils';
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
import toast from 'react-hot-toast';
import { useOnboarding } from '@/hooks/use-onboarding';
import { WelcomeModal, TourButton } from '@/components/onboarding/OnboardingComponents';
import { NotificationBell } from '@/components/admin/NotificationBell';

interface ManagerLayoutProps {
  children: ReactNode;
}

const MANAGER_MENU_ITEMS = [
  { key: 'dashboard', href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'staff', href: '/manager/staff', label: 'Nhân viên', icon: Users },
  { key: 'bookings', href: '/manager/bookings', label: 'Lịch hẹn', icon: ClipboardList },
  { key: 'schedule', href: '/manager/schedule', label: 'Lịch làm việc', icon: Calendar },
  { key: 'leaves', href: '/manager/leave-requests', label: 'Duyệt nghỉ phép', icon: Clock },
  { key: 'revenue', href: '/manager/revenue', label: 'Doanh thu', icon: BarChart3 },
  { key: 'reviews', href: '/manager/reviews', label: 'Đánh giá', icon: MessageSquare },
];

export default function ManagerLayout({ children }: ManagerLayoutProps): React.JSX.Element {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { showWelcome, startTour, resetTour, dismissWelcome, config: onboardingConfig } = useOnboarding('manager');

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/manager/dashboard');
    } else if (status === 'authenticated' && me && !isLoadingMe) {
      const userRole = me.role;
      const staffPosition = me.staff?.position;
      
      const isManager = 
        userRole === 'MANAGER' || 
        userRole === 'SALON_OWNER' || 
        userRole === 'SUPER_ADMIN' ||
        (userRole === 'STAFF' && staffPosition === 'MANAGER');

      if (!isManager) {
        toast.error('Bạn không có quyền truy cập khu vực Quản lý');
        router.push('/');
      }
    }
  }, [status, router, me, isLoadingMe]);

  if (status === 'loading' || (status === 'authenticated' && isLoadingMe)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className={cn("px-6 mb-8 flex items-center", isCollapsed && !isMobileOpen ? "justify-center px-2" : "justify-between")}>
        <Link href="/manager/dashboard" className={cn("font-heading font-black italic tracking-tighter transition-all hover:scale-105", isCollapsed && !isMobileOpen ? "text-xl" : "text-2xl")}>
          {isCollapsed && !isMobileOpen ? (
            <span className="text-[#C8A97E] text-2xl font-black">R</span>
          ) : (
            <span className="text-white uppercase">REETRO<span className="text-[#C8A97E] ml-1">MANAGER</span></span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {MANAGER_MENU_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname ? (item.href === '/manager/dashboard' ? pathname === '/manager/dashboard' : pathname.startsWith(item.href)) : false;
          
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium text-sm group',
                isActive
                  ? 'bg-[#C8A97E] text-white shadow-md shadow-[#C8A97E]/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                isCollapsed && !isMobileOpen && "justify-center"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
              {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pt-4 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 w-full transition-all font-medium text-sm",
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
      {/* Sidebar Desktop */}
      <aside 
        className={cn(
          "bg-[#0f172a] text-slate-300 fixed inset-y-0 left-0 z-50 hidden lg:block border-r border-slate-800 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-[#C8A97E] text-white rounded-full p-1 shadow-lg border border-[#C8A97E]/20 hover:scale-110 transition-transform"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", isCollapsed ? "lg:ml-20" : "lg:ml-64")}>
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
                {MANAGER_MENU_ITEMS.find(i => pathname?.startsWith(i.href))?.label || 'Dashboard'}
              </h2>

              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 ml-4">
                <MapPin className="w-3.5 h-3.5 text-[#C8A97E]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {me?.staff?.salon?.name || 'REETRO BARBER'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
               <TourButton onClick={resetTour} />
               <NotificationBell />
               
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-1 rounded-full hover:bg-slate-100">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-slate-900 leading-none">{session?.user?.name}</p>
                        <p className="text-[10px] text-[#C8A97E] font-bold mt-1 uppercase tracking-tighter italic">Branch Manager</p>
                      </div>
                      <Avatar className="h-8 w-8 border-2 border-[#C8A97E]/20 ring-offset-2 transition-all">
                        <AvatarImage src={session?.user?.image || undefined} />
                        <AvatarFallback className="bg-slate-900 text-white font-black italic text-xs">
                          {session?.user?.name?.charAt(0) || 'M'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-xl p-2 border-slate-100 shadow-2xl">
                    <DropdownMenuLabel className="font-bold text-xs text-slate-400 tracking-wider px-3 py-2">Quản trị Chi nhánh</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-50 my-1" />
                    <DropdownMenuItem 
                      className="rounded-lg h-10 px-3 font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-all flex items-center"
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <LogOut className="w-4 h-4 mr-3" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 animate-in fade-in duration-700">
          {children}
        </main>
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
