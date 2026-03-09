'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header(): React.ReactNode {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoggedIn = status === 'authenticated';

  return (
    <header className="bg-white/70 backdrop-blur-2xl border-b sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 py-3 sm:py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-gray-900 group-hover:scale-105 transition-transform">
              REETRO<span className="text-accent underline decoration-4 underline-offset-4">BARBER</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            {[
              { label: 'Trang chủ', href: '/' },
              { label: 'Hệ thống Salon', href: '/salons' },
              { label: 'Lịch hẹn', href: '/my-bookings', auth: true },
            ].map(item => (
              (!item.auth || isLoggedIn) && (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 relative group',
                    pathname === item.href ? 'text-accent' : 'text-gray-400 hover:text-gray-900'
                  )}
                >
                  {item.label}
                  <span className={cn(
                    "absolute -bottom-2 left-0 w-full h-0.5 bg-accent transition-all duration-500 origin-left scale-x-0 group-hover:scale-x-100",
                    pathname === item.href && "scale-x-100"
                  )} />
                </Link>
              )
            ))}
            
            {isLoggedIn ? (
              <Link
                href="/profile"
                className={cn(
                  'flex items-center gap-2 group pl-4 border-l border-gray-100',
                  pathname === '/profile' ? 'text-accent' : 'text-gray-400 hover:text-gray-900'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">{session?.user?.name || 'Cá nhân'}</span>
              </Link>
            ) : (
              <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors">
                Đăng nhập
              </Link>
            )}
          </nav>
          <Link
            href="/salons"
            className="hidden md:block bg-accent hover:bg-black text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-xl shadow-accent/20 active:scale-95"
          >
            ĐẶT LỊCH NGAY
          </Link>
          {/* Mobile indicator for logged in */}
          {isLoggedIn && (
            <Link href="/profile" className="md:hidden w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
