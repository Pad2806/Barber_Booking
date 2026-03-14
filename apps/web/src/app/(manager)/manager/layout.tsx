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
  Scissors,
  Star,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardList,
  BarChart3,
  MessageSquare,
  MapPin
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

interface ManagerLayoutProps {
  children: ReactNode;
}

const MANAGER_MENU_ITEMS = [
  { key: 'dashboard', href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'staff', href: '/manager/staff', label: 'Nhân viên', icon: Users },
  { key: 'bookings', href: '/manager/bookings', label: 'Lịch đặt bàn', icon: ClipboardList },
  { key: 'schedule', href: '/manager/schedule', label: 'Lịch chi nhánh', icon: Calendar },
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

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/manager/dashboard');
    } else if (status === 'authenticated') {
      const userRole = session?.user?.role;
      const staffPosition = me?.staff?.position;
      
      const isManager = 
        userRole === 'MANAGER' || 
        userRole === 'SALON_OWNER' || 
        userRole === 'SUPER_ADMIN' ||
        (userRole === 'STAFF' && staffPosition === 'MANAGER');

      if (!isManager && !isLoadingMe) {
        toast.error('Bạn không có quyền truy cập khu vực Quản lý');
        router.push('/');
      }
    }
  }, [status, router, session]);

  if (status === 'loading' || (status === 'authenticated' && isLoadingMe)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4 overflow-y-auto no-scrollbar">
      <div className={cn("px-6 mb-8 flex items-center", isCollapsed && !isMobileOpen ? "justify-center px-2" : "justify-between")}>
        <Link href="/manager/dashboard" className={cn("font-heading font-black italic tracking-tighter transition-all hover:scale-105", isCollapsed && !isMobileOpen ? "text-xl" : "text-2xl")}>
          {isCollapsed && !isMobileOpen ? (
            <span className="text-[#C8A97E] text-2xl font-black">R</span>
          ) : (
            <span className="text-white">REETRO<span className="text-[#C8A97E] ml-1">MANAGER</span></span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {MANAGER_MENU_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.key !== 'dashboard' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider group',
                isActive
                  ? 'bg-[#C8A97E] text-white shadow-lg shadow-[#C8A97E]/20'
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

      <div className="px-3 pt-4 border-t border-slate-800 mt-4">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 w-full transition-all font-bold text-xs uppercase tracking-wider",
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
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Desktop */}
      <aside 
        className={cn(
          "bg-[#0f172a] text-slate-300 fixed inset-y-0 left-0 z-50 hidden lg:block border-r border-slate-800 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-[#C8A97E] text-white rounded-full p-1.5 shadow-xl border border-[#C8A97E]/20 hover:scale-110 transition-transform z-50"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-500", isCollapsed ? "lg:ml-20" : "lg:ml-72")}>
        <header className="bg-white/70 backdrop-blur-xl border-b sticky top-0 z-40">
          <div className="px-4 lg:px-10 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden hover:bg-slate-100 rounded-xl">
                    <Menu className="w-6 h-6 text-slate-600" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 bg-[#0f172a] border-slate-800 w-72">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                <MapPin className="w-3.5 h-3.5 text-[#C8A97E]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {me?.staff?.salon?.name || 'REETRO BARBER SHOP'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-6">
               <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tighter leading-none italic">
                     {session?.user?.name}
                  </span>
                  <span className="text-[9px] font-black text-[#C8A97E] uppercase tracking-[0.2em] mt-1 pulse">
                     Branch Manager
                  </span>
               </div>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative group outline-none">
                       <div className="absolute -inset-1 bg-gradient-to-r from-[#C8A97E] to-amber-200 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                       <Avatar className="h-10 w-10 border-2 border-white shadow-2xl relative">
                          <AvatarImage src={session?.user?.image || undefined} />
                          <AvatarFallback className="bg-slate-900 text-white font-black italic text-xs">
                            {session?.user?.name?.charAt(0) || 'M'}
                          </AvatarFallback>
                       </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 border-slate-100 shadow-2xl">
                    <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-slate-400 tracking-widest px-3 py-2">Hệ quản trị Chi nhánh</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-50 my-1" />
                    <DropdownMenuItem 
                      className="rounded-xl h-11 px-3 font-bold text-slate-600 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-all flex items-center"
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <LogOut className="w-4 h-4 mr-3" /> Đăng xuất hệ thống
                    </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-10 animate-in slide-in-from-bottom-2 duration-700">
          {children}
        </main>
      </div>
    </div>
  );
}
