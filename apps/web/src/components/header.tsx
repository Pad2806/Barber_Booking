'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoggedIn = status === 'authenticated';

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-heading font-bold text-primary">
              Reetro<span className="text-accent">BarberShop</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={cn(
                'transition-colors',
                pathname === '/' ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-primary'
              )}
            >
              Trang chủ
            </Link>
            <Link
              href="/salons"
              className={cn(
                'transition-colors',
                pathname === '/salons'
                  ? 'text-accent font-medium'
                  : 'text-gray-600 hover:text-primary'
              )}
            >
              Salon
            </Link>
            {isLoggedIn && (
              <Link
                href="/my-bookings"
                className={cn(
                  'transition-colors',
                  pathname === '/my-bookings'
                    ? 'text-accent font-medium'
                    : 'text-gray-600 hover:text-primary'
                )}
              >
                Lịch hẹn
              </Link>
            )}
            {isLoggedIn ? (
              <Link
                href="/profile"
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  pathname === '/profile'
                    ? 'text-accent font-medium'
                    : 'text-gray-600 hover:text-primary'
                )}
              >
                <User className="w-4 h-4" />
                {session?.user?.name || 'Tài khoản'}
              </Link>
            ) : (
              <Link href="/login" className="text-gray-600 hover:text-primary transition-colors">
                Đăng nhập
              </Link>
            )}
          </nav>
          <Link
            href="/booking"
            className="hidden md:block bg-accent hover:bg-accent/90 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            Đặt lịch ngay
          </Link>
        </div>
      </div>
    </header>
  );
}
