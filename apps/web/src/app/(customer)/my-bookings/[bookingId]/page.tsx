'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeft, MapPin, User, Scissors, Phone } from 'lucide-react';
import { bookingApi, Booking } from '@/lib/api';
import {
  formatPrice,
  formatDate,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  cn,
} from '@/lib/utils';
import Footer from '@/components/footer';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const totalPaid = booking?.payments
    ? booking.payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0)
    : 0;
  
  const remainingAmount = booking ? Math.max(0, booking.totalAmount - totalPaid) : 0;

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getById(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-bookings');
      return;
    }
    if (status === 'authenticated' && bookingId) {
      void fetchBooking();
    }
  }, [status, bookingId, router, fetchBooking]);

  const handleCancel = async () => {
    if (!booking) return;
    try {
      setCancelling(true);
      await bookingApi.cancel(booking.id, cancelReason);
      setShowCancelModal(false);
      await fetchBooking();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setCancelling(false);
    }
  };

  const canCancel =
    booking &&
    ['PENDING', 'CONFIRMED'].includes(booking.status) &&
    new Date(booking.date) > new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-[6px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-6">😕</div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-4 uppercase tracking-tight">Không tìm thấy lịch hẹn</h2>
        <Link href="/my-bookings" className="text-primary font-bold uppercase tracking-widest text-[11px] border-b-2 border-primary pb-1 hover:text-foreground hover:border-foreground transition-all">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/my-bookings')}
            className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
            Về danh sách
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-2xl animate-in fade-in duration-1000">
        {/* Booking Code Card */}
        <div className="bg-foreground text-background rounded-[48px] p-12 text-center mb-10 relative overflow-hidden shadow-2xl shadow-foreground/20 border border-border/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-background/40 uppercase tracking-[0.4em] mb-4">YOUR BOOKING CODE</p>
            <p className="text-6xl font-heading font-bold tracking-tight text-primary leading-none">{booking.bookingCode}</p>
          </div>
        </div>

        {/* Status Section */}
        <div className="flex gap-4 mb-10">
            <div className={cn(
              'flex-1 p-8 rounded-[40px] border-2 transition-all duration-700',
              BOOKING_STATUS[booking.status]?.color?.includes('bg-green') ? 'bg-primary text-background border-primary' : 
              'bg-accent/5 border-border text-foreground'
            )}>
               <p className={cn("text-[10px] font-bold uppercase tracking-[0.3em] mb-2", booking.status === 'COMPLETED' ? "text-background/40" : "text-muted-foreground")}>TRẠNG THÁI LỊCH</p>
               <p className="text-xl font-heading font-bold uppercase tracking-tight">
                 {BOOKING_STATUS[booking.status]?.label || booking.status}
               </p>
            </div>
            <div className={cn(
              'flex-1 p-8 rounded-[40px] border-2 transition-all duration-700',
              PAYMENT_STATUS[booking.paymentStatus]?.color?.includes('bg-green') ? 'bg-primary text-background border-primary' : 
              'bg-accent/5 border-border text-foreground'
            )}>
               <p className={cn("text-[10px] font-bold uppercase tracking-[0.3em] mb-2", booking.paymentStatus === 'PAID' ? "text-background/40" : "text-muted-foreground")}>THANH TOÁN</p>
               <p className="text-xl font-heading font-bold uppercase tracking-tight">
                 {PAYMENT_STATUS[booking.paymentStatus]?.label || booking.paymentStatus}
               </p>
            </div>
        </div>

        {/* Global Details Card */}
        <div className="bg-background rounded-[48px] shadow-2xl border border-border overflow-hidden mb-10">
           {/* Top: Salon & Time */}
           <div className="p-10 space-y-10">
              <div className="flex items-start justify-between">
                 <div className="flex-1">
                   <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight leading-none mb-4 uppercase">{booking.salon.name}</h2>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 mb-6 tracking-wide">
                      <MapPin className="w-4 h-4 text-primary" />
                      {booking.salon.address}
                   </p>
                   <a
                    href={`tel:${booking.salon.phone}`}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-accent/5 hover:bg-primary hover:text-background rounded-full transition-all duration-500 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm border border-border"
                   >
                    <Phone className="w-4 h-4" />
                    {booking.salon.phone}
                   </a>
                 </div>
                 <div className="text-right pl-6 border-l border-border">
                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] mb-2 italic">TIME IN</p>
                    <p className="text-2xl font-heading font-bold text-foreground tracking-tight mb-1">{booking.timeSlot}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formatDate(booking.date)}</p>
                 </div>
              </div>

              {/* Staff Row */}
              <div className="flex items-center gap-6 p-8 bg-accent/5 rounded-[32px] group transition-all duration-700 hover:bg-primary border border-border">
                 <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-700">
                    {booking.staff?.user.avatar ? (
                       <Image src={booking.staff.user.avatar} alt="Staff" width={64} height={64} className="rounded-full object-cover" />
                    ) : (
                       <User className="w-8 h-8 text-primary group-hover:text-background" />
                    )}
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-2 group-hover:text-background/40">THỢ CẠO PHỤ TRÁCH</p>
                    <p className="text-2xl font-heading font-bold tracking-tight uppercase group-hover:text-background">{booking.staff?.user.name || 'BẤT KỲ STYLIST'}</p>
                 </div>
              </div>
           </div>

           {/* Services List */}
           <div className="bg-accent/5 p-10 border-t border-dashed border-border">
             <h3 className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.4em] mb-8 italic">SERVICES RENDERED</h3>
             <div className="space-y-6">
                {booking.services.map(item => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-3xl bg-background border border-border flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <Scissors className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground tracking-tight leading-tight uppercase">{item.service.name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 italic">{item.duration} MIN SESSION</p>
                      </div>
                    </div>
                    <p className="text-xl font-heading font-bold text-foreground tracking-tight">{formatPrice(item.price)}</p>
                  </div>
                ))}
             </div>
           </div>

           {/* Financial Summary */}
           <div className="p-12 bg-foreground text-background relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02),transparent)] pointer-events-none" />
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-center pb-8 border-b border-background/10">
                   <div>
                     <p className="text-[10px] font-bold text-background/40 uppercase tracking-[0.4em] mb-3">TỔNG CHI PHÍ</p>
                     <p className="text-5xl font-heading font-bold text-primary tracking-tight leading-none">{formatPrice(booking.totalAmount)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-background/40 uppercase tracking-[0.4em] mb-3">THỜI GIAN</p>
                      <p className="text-2xl font-heading font-bold text-background/70 tracking-tight">{booking.totalDuration} PHÚT</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-background/5 rounded-3xl p-6 border border-background/5">
                    <p className="text-[9px] font-bold text-background/30 uppercase tracking-[0.3em] mb-2">ĐÃ CỌC ONLINE</p>
                    <p className="text-2xl font-heading font-bold text-background tracking-tight">{formatPrice(totalPaid)}</p>
                  </div>
                  <div className="bg-background text-foreground rounded-3xl p-6 shadow-2xl transition-transform hover:scale-[1.02] duration-500 border border-border">
                    <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.3em] mb-2">CÒN LẠI TẠI SALON</p>
                    <p className="text-2xl font-heading font-bold tracking-tight">{formatPrice(remainingAmount)}</p>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Actions */}
        <div className="space-y-6">
           {(booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'PENDING') &&
            ['PENDING', 'CONFIRMED'].includes(booking.status) && (
              <Link
                href={`/payment/${booking.id}`}
                className="block w-full py-8 bg-primary text-background rounded-full font-bold text-[11px] text-center shadow-xl shadow-primary/20 active:scale-95 transition-all duration-700 transform hover:scale-[1.02] uppercase tracking-widest border border-primary"
              >
                THANH TOÁN CỌC GIỮ CHỖ
              </Link>
            )}

           {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-6 text-muted-foreground/40 font-bold text-[10px] uppercase tracking-[0.4em] hover:text-primary transition-all duration-500 active:scale-95"
            >
              HỦY LỊCH HẸN CỦA BẠN
            </button>
           )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-foreground/90 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-in fade-in duration-500">
          <div className="bg-background rounded-[40px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-500 border border-border">
            <h3 className="text-2xl font-heading font-bold text-foreground mb-4 tracking-tight uppercase">XÁC NHẬN HỦY</h3>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mb-8 italic">Bạn có chắc chắn muốn bỏ lịch hẹn này?</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Lý do hủy (không bắt buộc)..."
              rows={3}
              className="w-full p-5 bg-accent/5 border-2 border-border rounded-[24px] mb-8 focus:outline-none focus:border-primary transition-all font-bold text-sm text-foreground"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-5 bg-accent/5 text-muted-foreground rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-accent/10 transition-all active:scale-95 border border-border"
              >
                ĐÓNG
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={cn(
                  'flex-1 py-5 bg-primary text-background rounded-full font-bold uppercase text-[10px] tracking-widest transition-all duration-700 active:scale-95 shadow-xl shadow-primary/20',
                  cancelling ? 'opacity-50 cursor-not-allowed' : 'hover:bg-foreground hover:text-background border border-primary'
                )}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
