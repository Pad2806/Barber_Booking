'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { User, Menu, X, Calendar, MapPin, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header(): React.ReactElement {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoggedIn = status === 'authenticated';
  const isLoadingSession = status === 'loading';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navItems = [
    { label: 'Trang chủ', href: '/', icon: Menu },
    { label: 'Hệ thống Salon', href: '/salons', icon: MapPin },
    { label: 'Lịch hẹn', href: '/my-bookings', auth: true, icon: History },
  ];

  return (
    <>
      <header className="bg-[#FAF8F5]/95 backdrop-blur-xl border-b border-[#E8E0D4] sticky top-0 z-[60]">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group relative z-50">
              <span className="text-xl sm:text-2xl md:text-3xl font-heading font-black italic tracking-tighter text-[#2C1E12] transition-all group-hover:scale-105">
                REETRO<span className="text-[#C8A97E] ml-0.5 sm:ml-1">BARBER</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map(item => (
                (!item.auth || isLoggedIn) && (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'text-sm font-bold transition-colors py-2 relative',
                      pathname === item.href ? 'text-[#C8A97E]' : 'text-[#8B7355] hover:text-[#5C4A32]'
                    )}
                  >
                    {item.label}
                    {pathname === item.href && (
                      <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#C8A97E] rounded-full" />
                    )}
                  </Link>
                )
              ))}
              
              {isLoggedIn ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-3 pl-8 ml-2 border-l border-[#E8E0D4] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F0EBE3] flex items-center justify-center border border-[#E8E0D4] group-hover:border-[#C8A97E] transition-colors overflow-hidden shrink-0">
                    {session?.user?.image ? (
                      <Image src={session?.user?.image} alt="User" width={40} height={40} className="object-cover" />
                    ) : (
                       <User className="w-5 h-5 text-[#C8A97E]" />
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col items-start justify-center">
                     <span className="text-sm font-bold text-[#2C1E12] group-hover:text-[#C8A97E] transition-colors line-clamp-1 max-w-[150px]">
                       {session?.user?.name || 'Hồ sơ'}
                     </span>
                     <span className="text-[11px] font-medium text-[#8B7355]">
                       Khách hàng
                     </span>
                  </div>
                </Link>
              ) : isLoadingSession ? (
                <div className="pl-6 ml-2 border-l border-[#E8E0D4]">
                  <div className="w-16 h-4 bg-[#E8E0D4] rounded animate-pulse" />
                </div>
              ) : (
                <div className="pl-6 ml-2 border-l border-[#E8E0D4]">
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`}
                    className="text-sm font-bold text-[#8B7355] hover:text-[#C8A97E] transition-colors"
                  >
                    Đăng nhập
                  </Link>
                </div>
              )}
            </nav>

            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/salons"
                className="hidden md:flex bg-[#C8A97E] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-[#B8975E] active:scale-[0.98] shadow-sm"
              >
                Đặt lịch ngay
              </Link>
              
              {/* Profile Icon Mobile */}
              {isLoggedIn && (
                <Link href="/profile" className="md:hidden w-10 h-10 rounded-full bg-[#F0EBE3] flex items-center justify-center border border-[#E8E0D4] active:scale-95 transition-transform">
                  {session?.user?.image ? (
                    <Image src={session?.user?.image} alt="User" width={40} height={40} className="rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-[#C8A97E]" />
                  )}
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-[#2C1E12] hover:bg-[#F0EBE3] rounded-lg transition-colors relative z-50"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-[#2C1E12]/40 backdrop-blur-sm z-50 md:hidden transition-all duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-[80%] max-w-xs bg-[#FAF8F5] z-[55] md:hidden shadow-2xl transition-transform duration-500 ease-in-out transform flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-6 pt-24 space-y-8 flex-grow">
          {/* Nav Links */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest pl-2">Menu</p>
            {navItems.map(item => (
              (!item.auth || isLoggedIn) && (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-bold transition-all',
                    pathname === item.href 
                      ? 'bg-[#C8A97E] text-white shadow-lg shadow-[#C8A97E]/20' 
                      : 'text-[#5C4A32] hover:bg-[#F0EBE3]'
                  )}
                >
                  <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-white" : "text-[#C8A97E]")} />
                  {item.label}
                </Link>
              )
            ))}
          </div>

          {!isLoggedIn && !isLoadingSession && (
            <div className="pt-4 border-t border-[#E8E0D4] space-y-4">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-bold text-[#5C4A32] hover:bg-[#F0EBE3] transition-all"
              >
                <User className="w-5 h-5 text-[#C8A97E]" />
                Đăng nhập
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Action Button */}
        <div className="p-6 border-t border-[#E8E0D4] bg-white">
          <Link
            href="/salons"
            className="w-full bg-[#C8A97E] text-white flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#C8A97E]/30 active:scale-[0.98] transition-all"
          >
            <Calendar className="w-5 h-5" />
            Đặt lịch ngay
          </Link>
        </div>
      </div>
    </>
  );
}
