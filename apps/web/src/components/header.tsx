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
    <header className="bg-background/80 backdrop-blur-2xl border-b border-border sticky top-0 z-50 transition-all duration-500">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-foreground group-hover:scale-105 transition-transform duration-500 uppercase">
              REETRO<span className="text-primary ml-1">BARBER</span>
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
                    'text-[11px] font-bold uppercase tracking-wider transition-all duration-500 relative group',
                    pathname === item.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                  <span className={cn(
                    "absolute -bottom-2 left-0 w-full h-0.5 bg-primary transition-all duration-700 origin-left scale-x-0 group-hover:scale-x-100",
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
              <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all duration-500">
                CLIENT LOGIN
              </Link>
            )}
          </nav>
          <Link
            href="/salons"
            className="hidden md:block bg-foreground hover:bg-primary border-2 border-foreground text-background px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-700 shadow-xl shadow-foreground/5 active:scale-95"
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
