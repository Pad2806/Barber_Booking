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
  const { data: session, status } = useSession();
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
      const response = await bookingApi.getAll();
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
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Không có lịch hẹn {filter === 'upcoming' ? 'sắp tới' : 'đã qua'}
            </h2>
            <p className="text-gray-500 mb-6">
              {filter === 'upcoming'
                ? 'Đặt lịch ngay để trải nghiệm dịch vụ của chúng tôi'
                : 'Các lịch hẹn đã hoàn thành sẽ hiển thị ở đây'}
            </p>
            {filter === 'upcoming' && (
              <Link
                href="/salons"
                className="inline-block bg-accent text-white px-8 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
              >
                Đặt lịch ngay
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <Link
                key={booking.id}
                href={`/my-bookings/${booking.id}`}
                className="block bg-white rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{booking.salon.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {booking.salon.address}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {formatDate(booking.date)}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    {booking.timeSlot} - {booking.endTime}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        BOOKING_STATUS[booking.status]?.color || 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {BOOKING_STATUS[booking.status]?.label || booking.status}
                    </span>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        PAYMENT_STATUS[booking.paymentStatus]?.color || 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {PAYMENT_STATUS[booking.paymentStatus]?.label || booking.paymentStatus}
                    </span>
                  </div>
                  <p className="font-bold text-accent">{formatPrice(booking.totalAmount)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
