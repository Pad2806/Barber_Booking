'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, MapPin, ChevronRight, CreditCard,
  CheckCircle2, XCircle, AlertCircle, Hourglass, Scissors,
  CalendarPlus,
} from 'lucide-react';
import { bookingApi, Booking } from '@/lib/api';
import { formatPrice, formatDate, BOOKING_STATUS, PAYMENT_STATUS, cn } from '@/lib/utils';
import Avatar from '@/components/Avatar';

/* ── Status dot color ──────────────────────────────────────────── */
const statusDot: Record<string, { color: string; icon: React.ElementType }> = {
  PENDING:   { color: 'bg-amber-400',   icon: Hourglass    },
  CONFIRMED: { color: 'bg-emerald-400', icon: CheckCircle2 },
  COMPLETED: { color: 'bg-emerald-400', icon: CheckCircle2 },
  CANCELLED: { color: 'bg-red-400',     icon: XCircle      },
  NO_SHOW:   { color: 'bg-gray-400',    icon: AlertCircle  },
  IN_SERVICE:{ color: 'bg-blue-400',    icon: Scissors     },
};

export default function MyBookingsPage(): React.ReactNode {
  const { status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-bookings');
      return;
    }
    if (status === 'authenticated') {
      fetchBookings();
    }
  }, [status, router]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getMy();
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'upcoming') {
      return (
        bookingDate >= today && !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking.status)
      );
    } else {
      return bookingDate < today || ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(booking.status);
    }
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#8B7355]">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C1E12]">
      <Header />

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl">

        {/* ── Page heading ────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2C1E12] mb-1">Lịch hẹn của tôi</h1>
          <p className="text-sm text-[#8B7355]">
            {bookings.length > 0 ? `${bookings.length} lịch hẹn` : 'Chưa có lịch hẹn nào'}
          </p>
        </div>

        {/* ── Filter Tabs ──────────────────────────────────────── */}
        <div className="flex bg-white rounded-xl border border-[#E8E0D4] p-1 mb-6 shadow-sm">
          {(['upcoming', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200',
                filter === tab
                  ? 'bg-[#2C1E12] text-white shadow-sm'
                  : 'text-[#8B7355] hover:text-[#2C1E12]'
              )}
            >
              {tab === 'upcoming' ? '📅 Sắp tới' : '🕐 Đã qua'}
            </button>
          ))}
        </div>

        {/* ── Bookings List ────────────────────────────────────── */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 px-4 text-center border border-[#E8E0D4] shadow-sm animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-[#F0EBE3] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarPlus className="w-8 h-8 text-[#C8A97E]" />
            </div>
            <h2 className="text-lg font-bold text-[#2C1E12] mb-1">
              {filter === 'upcoming' ? 'Chưa có lịch sắp tới' : 'Chưa có lịch cũ'}
            </h2>
            <p className="text-sm text-[#8B7355] mb-6 max-w-xs mx-auto">
              {filter === 'upcoming'
                ? 'Hãy đặt lịch để trải nghiệm dịch vụ tại Reetro!'
                : 'Bạn chưa có trải nghiệm nào với Reetro.'}
            </p>
            {filter === 'upcoming' && (
              <Link
                href="/salons"
                className="inline-flex items-center gap-2 bg-[#C8A97E] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all hover:bg-[#B8975E] active:scale-[0.98]"
              >
                Đặt lịch ngay
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredBookings.map((booking, idx) => {
              const dot = statusDot[booking.status] ?? statusDot.PENDING;
              const isPaid = booking.paymentStatus === 'PAID';
              const isDeposit = booking.paymentStatus === 'DEPOSIT_PAID';
              const isUnpaid = !isPaid && !isDeposit;

              return (
                <Link
                  key={booking.id}
                  href={`/my-bookings/${booking.id}`}
                  className="group bg-white rounded-2xl border border-[#E8E0D4] shadow-sm hover:shadow-md hover:border-[#C8A97E]/40 transition-all duration-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* ── Top stripe: status color indicator ── */}
                  <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                    {/* Left: salon + code */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {/* Status dot */}
                        <span className={cn('w-2 h-2 rounded-full shrink-0', dot.color)} />
                        <span className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider truncate">
                          {BOOKING_STATUS[booking.status]?.label || booking.status}
                        </span>
                        <span className="text-[10px] text-[#C4B9A8]">·</span>
                        <span className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider truncate">
                          #{booking.bookingCode}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#2C1E12] group-hover:text-[#C8A97E] transition-colors truncate">
                        {booking.salon.name}
                      </h3>
                      <p className="text-xs text-[#8B7355] flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-[#C8A97E] shrink-0" />
                        {booking.salon.address}
                      </p>
                    </div>

                    {/* Right: chevron */}
                    <div className="w-8 h-8 rounded-full bg-[#FAF8F5] group-hover:bg-[#F0EBE3] flex items-center justify-center shrink-0 transition-colors mt-1">
                      <ChevronRight className="w-4 h-4 text-[#8B7355] group-hover:text-[#C8A97E] transition-colors group-hover:translate-x-0.5 duration-200" />
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="mx-5 border-t border-[#F0EBE3]" />

                  {/* ── Bottom: date/time + barber + price ── */}
                  <div className="px-5 py-3.5 flex items-center justify-between gap-4">
                    {/* Date & Time */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5C4A32]">
                        <Calendar className="w-3.5 h-3.5 text-[#C8A97E]" />
                        {formatDate(booking.date)}
                      </div>
                      <span className="text-[#D4C9BA]">·</span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5C4A32]">
                        <Clock className="w-3.5 h-3.5 text-[#C8A97E]" />
                        {booking.timeSlot}
                      </div>
                    </div>

                    {/* Price + payment badge */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#2C1E12]">{formatPrice(booking.totalAmount)}</p>
                      <span className={cn(
                        'text-[10px] font-bold mt-0.5 inline-flex items-center gap-0.5',
                        isPaid ? 'text-emerald-600' : isDeposit ? 'text-sky-600' : 'text-[#8B7355]'
                      )}>
                        <CreditCard className="w-3 h-3" />
                        {isPaid ? 'Đã TT' : isDeposit ? 'Đã cọc' : 'Chưa TT'}
                      </span>
                    </div>
                  </div>

                  {/* ── Barber + Services row ── */}
                  {(booking.staff || booking.services.length > 0) && (
                    <div className="px-5 pb-3.5 flex items-center gap-3">
                      {booking.staff && (
                        <Avatar
                          src={booking.staff.user.avatar}
                          name={booking.staff.user.name}
                          size="xs"
                          variant="circle"
                          className="shrink-0"
                        />
                      )}
                      <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                        {booking.services.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[10px] font-semibold text-[#5C4A32] bg-[#FAF8F5] border border-[#E8E0D4] px-2 py-0.5 rounded-md">
                            {s.service.name}
                          </span>
                        ))}
                        {booking.services.length > 3 && (
                          <span className="text-[10px] font-semibold text-[#8B7355] bg-[#FAF8F5] border border-[#E8E0D4] px-2 py-0.5 rounded-md">
                            +{booking.services.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Unpaid indicator */}
                      {isUnpaid && ['PENDING', 'CONFIRMED'].includes(booking.status) && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                          Cần cọc
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
