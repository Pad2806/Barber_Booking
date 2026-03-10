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
    <header className="bg-[#FAF8F5]/95 backdrop-blur-xl border-b border-[#E8E0D4] sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C1E12] transition-colors">
              REETRO<span className="text-[#C8A97E] ml-1">BARBER</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
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
                    <Image src={session.user.image} alt="User" width={40} height={40} className="object-cover" />
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
            ) : (
              <div className="pl-6 ml-2 border-l border-[#E8E0D4]">
                <Link href="/login" className="text-sm font-bold text-[#8B7355] hover:text-[#C8A97E] transition-colors">
                  Đăng nhập
                </Link>
              </div>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/salons"
              className="hidden md:flex bg-[#C8A97E] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-[#B8975E] active:scale-[0.98] shadow-sm"
            >
              Đặt lịch ngay
            </Link>
            
            {/* Mobile indicator for logged in */}
            {isLoggedIn && (
              <Link href="/profile" className="md:hidden w-10 h-10 rounded-full bg-[#F0EBE3] flex items-center justify-center border border-[#E8E0D4] active:scale-95 transition-transform">
                <User className="w-5 h-5 text-[#C8A97E]" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
