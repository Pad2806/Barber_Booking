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
    <header className="bg-background/95 backdrop-blur-3xl border-b border-border sticky top-0 z-50 transition-all duration-700">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-foreground group-hover:text-primary transition-all duration-500 uppercase">
              REETRO<span className="text-primary ml-1">BARBER</span>
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
                    'text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 relative group flex flex-col items-center gap-1',
                    pathname === item.href ? 'text-primary' : 'text-muted-foreground/40 hover:text-foreground'
                  )}
                >
                  {item.label}
                  <span className={cn(
                    "w-1 h-1 rounded-full bg-primary transition-all duration-700 opacity-0 transform translate-y-2",
                    pathname === item.href && "opacity-100 translate-y-0"
                  )} />
                </Link>
              )
            ))}
            
            {isLoggedIn ? (
              <Link
                href="/profile"
                className={cn(
                  'flex items-center gap-3 pl-10 border-l border-border transition-colors group ml-2',
                  pathname === '/profile' ? 'text-foreground' : 'text-muted-foreground/40 hover:text-foreground'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-accent/5 flex items-center justify-center border border-border group-hover:border-primary transition-all duration-500 overflow-hidden shadow-sm">
                  {session?.user?.image ? (
                    <Image src={session.user.image} alt="User" width={40} height={40} className="object-cover transition-all duration-500 group-hover:scale-110" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex flex-col items-start leading-none gap-1">
                   <span className="text-[10px] font-bold uppercase tracking-[0.2em] hidden lg:inline">{session?.user?.name || 'Cá nhân'}</span>
                   <span className="text-[8px] font-bold uppercase tracking-widest text-primary hidden lg:inline opacity-0 group-hover:opacity-100 transition-opacity">PRO MEMBER</span>
                </div>
              </Link>
            ) : (
              <Link href="/login" className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-primary transition-all duration-500 hover:tracking-[0.5em] italic">
                CLIENT LOGIN
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-6">
            <Link
              href="/salons"
              className="hidden md:flex bg-foreground text-background px-10 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-700 hover:bg-primary hover:tracking-[0.4em] active:scale-95 shadow-xl shadow-foreground/10 border border-foreground hover:border-primary"
            >
              ĐẶT LỊCH NGAY
            </Link>
            
            {/* Mobile indicator for logged in */}
            {isLoggedIn && (
              <Link href="/profile" className="md:hidden w-12 h-12 rounded-full bg-accent/5 flex items-center justify-center border border-border group active:scale-95 shadow-sm">
                <User className="w-6 h-6 text-primary group-active:scale-90 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
