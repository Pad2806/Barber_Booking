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
  Star
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

interface BarberLayoutProps {
  children: ReactNode;
}

const BARBER_MENU_ITEMS = [
  { key: 'dashboard', href: '/barber/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'schedule', href: '/barber/schedule', label: 'Lịch của tôi', icon: Clock },
  { key: 'bookings', href: '/barber/bookings', label: 'Booking phân công', icon: Calendar },
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
      router.push('/login?callbackUrl=/barber/dashboard');
    } else if (status === 'authenticated') {
      const userRole = session?.user?.role;
      const staffPosition = me?.staff?.position;

      const isBarber = 
        userRole === 'BARBER' || 
        userRole === 'SKINNER' || 
        userRole === 'SUPER_ADMIN' ||
        (userRole === 'STAFF' && ['BARBER', 'STYLIST', 'SENIOR_STYLIST', 'MASTER_STYLIST', 'SKINNER'].includes(staffPosition || ''));

      if (!isBarber && !isLoadingMe) {
        toast.error('Bạn không có quyền truy cập trang này');
        router.push('/');
      }
    }
  }, [status, router, session]);

  if (status === 'loading' || (status === 'authenticated' && isLoadingMe)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className={cn("px-6 mb-8 flex items-center", isCollapsed && !isMobileOpen ? "justify-center px-2" : "justify-between")}>
        <Link href="/barber/dashboard" className={cn("font-heading font-black italic tracking-tighter transition-all hover:scale-105", isCollapsed && !isMobileOpen ? "text-xl" : "text-2xl")}>
          {isCollapsed && !isMobileOpen ? (
            <span className="text-[#C8A97E] text-2xl">B</span>
          ) : (
            <span className="text-white">REETRO<span className="text-[#C8A97E] ml-1">BARBER</span></span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {BARBER_MENU_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);
          
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-medium text-sm group',
                isActive
                  ? 'bg-[#C8A97E] text-white'
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
          onClick={() => signOut({ callbackUrl: '/' })}
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
    <div className="min-h-screen bg-slate-50 flex">
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
              <h2 className="text-sm font-semibold text-slate-500 hidden sm:block uppercase tracking-wider font-sans">
                Barber Panel
              </h2>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 hidden sm:flex">
                <Star className="w-4 h-4 fill-amber-500" />
                <span className="text-sm font-black italic">{me?.staff?.rating || '5.0'}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-1 rounded-full hover:bg-slate-100 h-auto py-1">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-900 leading-none">{session?.user?.name}</p>
                      <p className="text-[10px] text-[#C8A97E] mt-1 font-bold uppercase">{me?.staff?.position || 'Barber'}</p>
                    </div>
                    <Avatar className="h-8 w-8 border border-[#C8A97E]/20">
                       <AvatarImage src={session?.user?.image || undefined} />
                       <AvatarFallback className="bg-[#C8A97E]/10 text-[#C8A97E] text-xs font-bold font-sans">
                         {session?.user?.name?.charAt(0) || 'B'}
                       </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 mt-2">
                  <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-slate-400 tracking-widest px-3 py-2">Tài khoản Barber</DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem 
                    className="rounded-xl h-10 px-3 font-bold text-slate-600 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                    onClick={() => signOut({ callbackUrl: '/' })}
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
  );
}
