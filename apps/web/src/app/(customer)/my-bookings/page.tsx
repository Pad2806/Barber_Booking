'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '@/components/header';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { bookingApi, Booking } from '@/lib/api';
import { formatPrice, formatDate, BOOKING_STATUS, PAYMENT_STATUS, cn } from '@/lib/utils';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-heading font-bold mb-6">Lịch hẹn của tôi</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('upcoming')}
            className={cn(
              'px-6 py-2 rounded-full font-medium transition-colors',
              filter === 'upcoming'
                ? 'bg-accent text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            Sắp tới
          </button>
          <button
            onClick={() => setFilter('past')}
            className={cn(
              'px-6 py-2 rounded-full font-medium transition-colors',
              filter === 'past' ? 'bg-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            Đã qua
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner">
               📅
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
              {filter === 'upcoming' ? 'CHƯA CÓ LỊCH SẮP TỚI' : 'CHƯA CÓ LỊCH CŨ'}
            </h2>
            <p className="text-gray-400 font-medium mb-10 max-w-xs mx-auto">
              {filter === 'upcoming'
                ? 'Đừng để bản thân luộm thuộm, đặt lịch ngay nhé!'
                : 'Bạn chưa có trải nghiệm nào với Reetro'}
            </p>
            {filter === 'upcoming' && (
              <Link
                href="/salons"
                className="inline-flex items-center gap-3 bg-accent text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all duration-500 shadow-xl shadow-accent/20 active:scale-95"
              >
                Tìm Salon để đặt lịch
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
            {filteredBookings.map((booking, idx) => (
              <Link
                key={booking.id}
                href={`/my-bookings/${booking.id}`}
                className="group relative bg-white rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:shadow-gray-200 transition-all duration-700 border border-transparent hover:border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Decorative background number/letter */}
                <div className="absolute -top-4 -right-4 font-black text-9xl text-gray-50/50 pointer-events-none select-none">
                   {idx + 1}
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Salon {idx + 1}</p>
                      <h3 className="text-2xl font-heading font-black text-gray-900 tracking-tighter leading-none mb-2">{booking.salon.name}</h3>
                      <p className="text-xs text-gray-400 font-bold flex items-center gap-1.5 uppercase transition-colors group-hover:text-gray-900">
                        <MapPin className="w-3.5 h-3.5" />
                        {booking.salon.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-8">
                    <div className="px-4 py-2.5 rounded-2xl bg-gray-50 flex items-center gap-3 group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-all">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span className="text-xs font-black text-gray-900">{formatDate(booking.date)}</span>
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl bg-gray-50 flex items-center gap-3 group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-all">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="text-xs font-black text-gray-900 uppercase">{booking.timeSlot}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dashed border-gray-100 flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {/* Status Pills */}
                      <span
                        className={cn(
                          'px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all',
                          BOOKING_STATUS[booking.status]?.color?.includes('bg-green') ? 'bg-green-50 text-green-600 border-green-100' : 
                          BOOKING_STATUS[booking.status]?.color?.includes('bg-yellow') ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                          BOOKING_STATUS[booking.status]?.color?.includes('bg-red') ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-gray-50 text-gray-500 border-gray-100'
                        )}
                      >
                        {BOOKING_STATUS[booking.status]?.label || booking.status}
                      </span>
                    </div>
                    <p className="text-xl font-black text-gray-900">{formatPrice(booking.totalAmount)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
