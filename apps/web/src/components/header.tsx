'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header(): React.ReactNode {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoggedIn = status === 'authenticated';

  return (
    <header className="bg-white/80 backdrop-blur-2xl border-b border-gray-100 sticky top-0 z-50 transition-all duration-500">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl sm:text-3xl font-black tracking-[-0.08em] text-black group-hover:scale-105 transition-transform duration-500">
              REETRO<span className="bg-black text-white px-2 py-0.5 ml-1 rounded-sm">BARBER</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-12">
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
                    'text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative group',
                    pathname === item.href ? 'text-black' : 'text-gray-300 hover:text-black'
                  )}
                >
                  {item.label}
                  <span className={cn(
                    "absolute -bottom-2 left-0 w-full h-0.5 bg-black transition-all duration-700 origin-left scale-x-0 group-hover:scale-x-100",
                    pathname === item.href && "scale-x-100"
                  )} />
                </Link>
              )
            ))}
            
            {isLoggedIn ? (
              <Link
                href="/profile"
                className={cn(
                  'flex items-center gap-3 pl-6 border-l border-gray-100 transition-colors',
                  pathname === '/profile' ? 'text-black' : 'text-gray-300 hover:text-black'
                )}
              >
                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-transparent hover:border-black transition-all duration-500 overflow-hidden">
                  {session?.user?.image ? (
                    <Image src={session.user.image} alt="User" width={36} height={36} className="object-cover grayscale" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden lg:inline">{session?.user?.name || 'Cá nhân'}</span>
              </Link>
            ) : (
              <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-black transition-all duration-500">
                CLIENT LOGIN
              </Link>
            )}
          </nav>
          <Link
            href="/salons"
            className="hidden md:block bg-black hover:bg-white hover:text-black border-2 border-black text-white px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 shadow-2xl shadow-black/10 active:scale-95"
          >
            ĐẶT LỊCH NGAY
          </Link>
          {/* Mobile indicator for logged in */}
          {isLoggedIn && (
            <Link href="/profile" className="md:hidden w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
              <User className="w-6 h-6 text-gray-400" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
