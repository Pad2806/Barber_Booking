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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-[6px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <Header />

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mb-4 block text-primary/40">HISTORY</span>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight leading-none mb-4 uppercase">Lịch hẹn của tôi</h1>
          <div className="w-16 h-0.5 bg-primary mx-auto" />
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-4 mb-16">
          <button
            onClick={() => setFilter('upcoming')}
            className={cn(
              'px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-700 active:scale-95',
              filter === 'upcoming'
                ? 'bg-primary text-background shadow-xl shadow-primary/20 scale-105'
                : 'bg-accent/5 text-muted-foreground hover:bg-accent/10 border border-border'
            )}
          >
            Sắp tới
          </button>
          <button
            onClick={() => setFilter('past')}
            className={cn(
              'px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-700 active:scale-95',
              filter === 'past' 
                ? 'bg-primary text-background shadow-xl shadow-primary/20 scale-105' 
                : 'bg-accent/5 text-muted-foreground hover:bg-accent/10 border border-border'
            )}
          >
            Đã qua
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-background rounded-[48px] py-32 text-center border-2 border-dashed border-border animate-in fade-in zoom-in-95 duration-1000 shadow-inner">
            <div className="w-32 h-32 bg-accent/5 rounded-[40px] flex items-center justify-center mx-auto mb-10 text-5xl shadow-sm border border-border">
               📅
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4 uppercase tracking-tight">
              {filter === 'upcoming' ? 'CHƯA CÓ LỊCH SẮP TỚI' : 'CHƯA CÓ LỊCH CŨ'}
            </h2>
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-12 max-w-xs mx-auto leading-relaxed">
              {filter === 'upcoming'
                ? 'Đừng để bản thân luộm thuộm, đặt lịch ngay nhé!'
                : 'Bạn chưa có trải nghiệm nào với Reetro'}
            </p>
            {filter === 'upcoming' && (
              <Link
                href="/salons"
                className="inline-flex items-center gap-4 bg-primary text-background px-12 py-5 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all duration-700 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
              >
                Đặt lịch mới ngay
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-10">
            {filteredBookings.map((booking, idx) => (
              <Link
                key={booking.id}
                href={`/my-bookings/${booking.id}`}
                className="group relative bg-background rounded-[40px] p-10 shadow-lg hover:shadow-2xl transition-all duration-700 border border-border hover:border-primary overflow-hidden animate-in fade-in slide-in-from-bottom-8 overflow-hidden"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Decorative background label */}
                <div className="absolute top-8 right-10 font-bold text-[10px] text-primary/5 uppercase tracking-[0.4em] pointer-events-none select-none">
                   #{booking.bookingCode}
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-10">
                    <div>
                      <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] mb-3 block">SALON NO.{idx + 1}</span>
                      <h3 className="text-2xl font-heading font-bold text-foreground tracking-tight leading-none mb-4 group-hover:text-primary transition-colors uppercase">{booking.salon.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-wide transition-colors group-hover:text-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        {booking.salon.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-10">
                    <div className="px-5 py-3 rounded-2xl bg-accent/5 flex items-center gap-3 transition-all group-hover:bg-primary group-hover:text-background border border-border group-hover:border-primary">
                      <Calendar className="w-4 h-4 text-primary group-hover:text-background/50" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{formatDate(booking.date)}</span>
                    </div>
                    <div className="px-5 py-3 rounded-2xl bg-accent/5 flex items-center gap-3 transition-all group-hover:bg-primary group-hover:text-background border border-border group-hover:border-primary">
                      <Clock className="w-4 h-4 text-primary group-hover:text-background/50" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{booking.timeSlot}</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-dashed border-border flex items-center justify-between">
                    <div>
                      <span
                        className={cn(
                          'px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all duration-500',
                          BOOKING_STATUS[booking.status]?.color?.includes('bg-green') ? 'bg-primary text-background border-primary' : 
                          BOOKING_STATUS[booking.status]?.color?.includes('bg-yellow') ? 'bg-accent/5 text-foreground border-border' :
                          BOOKING_STATUS[booking.status]?.color?.includes('bg-red') ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-accent/5 text-muted-foreground border-border'
                        )}
                      >
                        {BOOKING_STATUS[booking.status]?.label || booking.status}
                      </span>
                    </div>
                    <p className="text-xl font-heading font-bold text-foreground tracking-tight">{formatPrice(booking.totalAmount)}</p>
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
