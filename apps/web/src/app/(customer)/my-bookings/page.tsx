'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { bookingApi, Booking } from '@/lib/api';
import { formatPrice, formatDate, BOOKING_STATUS, cn } from '@/lib/utils';

export default function MyBookingsPage() {
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-[6px] border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 block">HISTORY</span>
          <h1 className="text-5xl font-heading font-black text-gray-900 tracking-tighter leading-none mb-4 uppercase">Lịch hẹn của tôi</h1>
          <div className="w-16 h-1 bg-black mx-auto" />
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-4 mb-16">
          <button
            onClick={() => setFilter('upcoming')}
            className={cn(
              'px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-700',
              filter === 'upcoming'
                ? 'bg-black text-white shadow-2xl shadow-black/20 scale-105'
                : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
            )}
          >
            Sắp tới
          </button>
          <button
            onClick={() => setFilter('past')}
            className={cn(
              'px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-700',
              filter === 'past' 
                ? 'bg-black text-white shadow-2xl shadow-black/20 scale-105' 
                : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
            )}
          >
            Đã qua
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-[48px] py-32 text-center border-2 border-dashed border-gray-100 animate-in fade-in zoom-in-95 duration-1000">
            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-10 text-5xl shadow-inner">
               📅
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase">
              {filter === 'upcoming' ? 'CHƯA CÓ LỊCH SẮP TỚI' : 'CHƯA CÓ LỊCH CŨ'}
            </h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-12 max-w-xs mx-auto">
              {filter === 'upcoming'
                ? 'Đừng để bản thân luộm thuộm, đặt lịch ngay nhé!'
                : 'Bạn chưa có trải nghiệm nào với Reetro'}
            </p>
            {filter === 'upcoming' && (
              <Link
                href="/salons"
                className="inline-flex items-center gap-4 bg-black text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all duration-700 shadow-2xl shadow-black/20 hover:-translate-y-2 active:scale-95"
              >
                Đặt lịch mới ngay
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-10">
            {filteredBookings.map((booking, idx) => (
              <Link
                key={booking.id}
                href={`/my-bookings/${booking.id}`}
                className="group relative bg-white rounded-[40px] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:shadow-black/5 transition-all duration-700 border border-gray-100 hover:border-black overflow-hidden animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Decorative background label */}
                <div className="absolute top-8 right-10 font-black text-[10px] text-gray-100 uppercase tracking-[0.4em] pointer-events-none select-none">
                   #{booking.bookingCode}
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-10">
                    <div>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3 block">SALON NO.{idx + 1}</span>
                      <h3 className="text-3xl font-heading font-black text-gray-900 tracking-tighter leading-none mb-4 group-hover:text-black transition-colors">{booking.salon.name}</h3>
                      <p className="text-[10px] text-gray-400 font-black flex items-center gap-2 uppercase tracking-tight transition-colors group-hover:text-black">
                        <MapPin className="w-4 h-4 text-gray-300 group-hover:text-black" />
                        {booking.salon.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-10">
                    <div className="px-5 py-3 rounded-2xl bg-gray-50 flex items-center gap-3 transition-all group-hover:bg-black group-hover:text-white border border-transparent">
                      <Calendar className="w-4 h-4 text-gray-400 group-hover:text-white/50" />
                      <span className="text-xs font-black tracking-tight">{formatDate(booking.date)}</span>
                    </div>
                    <div className="px-5 py-3 rounded-2xl bg-gray-50 flex items-center gap-3 transition-all group-hover:bg-black group-hover:text-white border border-transparent">
                      <Clock className="w-4 h-4 text-gray-400 group-hover:text-white/50" />
                      <span className="text-xs font-black tracking-tight uppercase">{booking.timeSlot}</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-dashed border-gray-100 flex items-center justify-between">
                    <div>
                      <span
                        className={cn(
                          'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500',
                          BOOKING_STATUS[booking.status]?.color?.includes('bg-green') ? 'bg-black text-white border-black' : 
                          BOOKING_STATUS[booking.status]?.color?.includes('bg-yellow') ? 'bg-gray-100 text-gray-900 border-gray-200' :
                          BOOKING_STATUS[booking.status]?.color?.includes('bg-red') ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-gray-50 text-gray-400 border-gray-100'
                        )}
                      >
                        {BOOKING_STATUS[booking.status]?.label || booking.status}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tracking-tighter">{formatPrice(booking.totalAmount)}</p>
                  </div>
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
