'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, ChevronRight, Scissors, CreditCard } from 'lucide-react';
import { bookingApi, Booking } from '@/lib/api';
import { formatPrice, formatDate, BOOKING_STATUS, PAYMENT_STATUS, cn } from '@/lib/utils';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-[6px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C1E12]">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2C1E12] mb-2">Lịch hẹn của tôi</h1>
          <p className="text-sm text-[#8B7355]">Quản lý tất cả lịch hẹn cắt tóc của bạn</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-3 mb-10">
          <button
            onClick={() => setFilter('upcoming')}
            className={cn(
              'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
              filter === 'upcoming'
                ? 'bg-[#C8A97E] text-white shadow-sm'
                : 'bg-white text-[#8B7355] hover:bg-[#F0EBE3] border border-[#E8E0D4]'
            )}
          >
            Sắp tới
          </button>
          <button
            onClick={() => setFilter('past')}
            className={cn(
              'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
              filter === 'past' 
                ? 'bg-[#C8A97E] text-white shadow-sm' 
                : 'bg-white text-[#8B7355] hover:bg-[#F0EBE3] border border-[#E8E0D4]'
            )}
          >
            Đã qua
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 px-4 text-center border border-[#E8E0D4] animate-in fade-in zoom-in-95 duration-500 shadow-sm">
            <div className="w-20 h-20 bg-[#F0EBE3] rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
               📅
            </div>
            <h2 className="text-xl font-bold text-[#2C1E12] mb-2">
              {filter === 'upcoming' ? 'Chưa có lịch sắp tới' : 'Chưa có lịch cũ'}
            </h2>
            <p className="text-sm text-[#8B7355] mb-8 max-w-xs mx-auto">
              {filter === 'upcoming'
                ? 'Đừng để bản thân luộm thuộm, đặt lịch ngay nhé!'
                : 'Bạn chưa có trải nghiệm nào với Reetro'}
            </p>
            {filter === 'upcoming' && (
              <Link
                href="/salons"
                className="inline-flex items-center gap-2 bg-[#C8A97E] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:bg-[#B8975E] active:scale-[0.98]"
              >
                Đặt lịch hẹn mới
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredBookings.map((booking, idx) => (
              <Link
                key={booking.id}
                href={`/my-bookings/${booking.id}`}
                className="group relative bg-white rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all border border-[#E8E0D4] hover:border-[#C8A97E]/50 animate-in fade-in slide-in-from-bottom-4 flex flex-col md:flex-row md:items-center justify-between gap-6"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-[#FAF8F5] border border-[#E8E0D4] px-2.5 py-1 rounded-md flex items-center gap-1.5">
                       <span className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Mã đặt lịch</span>
                       <span className="text-sm font-bold text-[#2C1E12]">#{booking.bookingCode}</span>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-bold',
                        BOOKING_STATUS[booking.status]?.color?.includes('bg-green') ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                        BOOKING_STATUS[booking.status]?.color?.includes('bg-yellow') ? 'bg-[#FFF8E1] text-[#F57F17]' :
                        BOOKING_STATUS[booking.status]?.color?.includes('bg-red') ? 'bg-red-50 text-red-600' :
                        'bg-[#F0EBE3] text-[#8B7355]'
                      )}
                    >
                      {BOOKING_STATUS[booking.status]?.label || booking.status}
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-bold hidden sm:inline-block',
                        PAYMENT_STATUS[booking.paymentStatus]?.color?.includes('bg-green') ? 'bg-[#E8F5E9] text-[#2E7D32]' : 
                        PAYMENT_STATUS[booking.paymentStatus]?.color?.includes('bg-yellow') ? 'bg-[#FFF8E1] text-[#F57F17]' :
                        'bg-white border border-[#E8E0D4] text-[#8B7355]'
                      )}
                    >
                      {PAYMENT_STATUS[booking.paymentStatus]?.label || booking.paymentStatus}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-[#2C1E12] mb-1 group-hover:text-[#C8A97E] transition-colors">{booking.salon.name}</h3>
                  <p className="text-sm text-[#5C4A32] flex items-center gap-1.5 mb-4">
                    <MapPin className="w-4 h-4 text-[#C8A97E]" />
                    {booking.salon.address}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
                    <div className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8E0D4] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#C8A97E]" />
                      <span className="text-sm font-semibold text-[#2C1E12]">{formatDate(booking.date)}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E8E0D4] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#C8A97E]" />
                      <span className="text-sm font-semibold text-[#2C1E12]">{booking.timeSlot}</span>
                    </div>
                  </div>

                  <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#E8E0D4]/60 hidden md:block">
                     <div className="flex flex-wrap gap-2">
                       {booking.services.slice(0, 2).map((s, i) => (
                         <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-[#5C4A32] bg-white border border-[#E8E0D4] px-2 py-1 rounded-md">
                            <Scissors className="w-3 h-3 text-[#C8A97E]" />
                            {s.service.name}
                         </div>
                       ))}
                       {booking.services.length > 2 && (
                         <div className="flex items-center gap-1.5 text-xs font-medium text-[#8B7355] bg-white border border-[#E8E0D4] px-2 py-1 rounded-md">
                            +{booking.services.length - 2} dịch vụ khác
                         </div>
                       )}
                     </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8E0D4] md:border-t-0 md:pt-0 md:pl-6 md:border-l md:text-right flex flex-row md:flex-col items-center justify-between md:items-end md:justify-center w-full md:w-auto mt-4 md:mt-0">
                   <div className="text-left md:text-right">
                     <p className="text-xs font-bold text-[#8B7355] mb-1 uppercase tracking-wider hidden md:block">Tổng cộng</p>
                     <p className="text-xl font-bold text-[#2C1E12] mb-1">{formatPrice(booking.totalAmount)}</p>
                     <div className="flex items-center gap-1 text-xs font-semibold text-[#5C4A32] md:justify-end">
                       <CreditCard className="w-3.5 h-3.5 text-[#C8A97E]" />
                       {booking.paymentStatus === 'PAID' ? 'Đã thu tiền' : booking.paymentStatus === 'DEPOSIT_PAID' ? 'Đã cọc' : 'Chưa thanh toán'}
                     </div>
                   </div>
                   
                   <p className="text-sm font-bold text-white bg-[#C8A97E] hover:bg-[#B8975E] px-4 py-2 rounded-xl flex items-center gap-1 group-hover:scale-105 transition-all">
                     Chi tiết <ChevronRight className="w-4 h-4" />
                   </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
