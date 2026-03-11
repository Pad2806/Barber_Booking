'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
import ReviewModal from '@/components/ReviewModal';
import { Star, MessageSquare } from 'lucide-react';

export default function BookingDetailPage(): React.ReactNode {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  const isWithinReviewPeriod = useCallback((completionDate: string) => {
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const completedAt = new Date(completionDate);
    return now.getTime() - completedAt.getTime() <= threeDaysInMs;
  }, []);

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
        <h2 className="text-2xl font-bold text-[#2C1E12] mb-4 uppercase tracking-tight">Không tìm thấy lịch hẹn</h2>
        <Link href="/my-bookings" className="text-primary font-bold uppercase tracking-widest text-[11px] border-b-2 border-primary pb-1 hover:text-foreground hover:border-foreground transition-all">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-32">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E8E0D4] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 md:py-6 max-w-2xl">
          <button
            onClick={() => router.push('/my-bookings')}
            className="flex items-center gap-2 text-sm font-bold text-[#8B7355] hover:text-[#C8A97E] transition-colors active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
            Về danh sách
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl animate-in fade-in duration-500">
        {/* Booking Code Card */}
        <div className="bg-[#2C1E12] text-white rounded-2xl p-8 md:p-12 text-center mb-8 relative overflow-hidden shadow-sm border border-[#2C1E12]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">MÃ ĐẶT LỊCH</p>
            <p className="text-4xl md:text-5xl font-bold tracking-tight text-[#C8A97E]">{booking.bookingCode}</p>
          </div>
        </div>

        {/* Status Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className={cn(
              'flex-1 p-6 rounded-2xl border transition-all',
              BOOKING_STATUS[booking.status]?.color?.includes('bg-green') ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' : 
              'bg-white border-[#E8E0D4] text-[#2C1E12]'
            )}>
               <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", booking.status === 'COMPLETED' ? "text-[#2E7D32]/70" : "text-[#8B7355]")}>TRẠNG THÁI</p>
               <p className="text-lg font-bold">
                 {BOOKING_STATUS[booking.status]?.label || booking.status}
               </p>
            </div>
            <div className={cn(
              'flex-1 p-6 rounded-2xl border transition-all',
              PAYMENT_STATUS[booking.paymentStatus]?.color?.includes('bg-green') ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]' : 
              'bg-white border-[#E8E0D4] text-[#2C1E12]'
            )}>
               <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", booking.paymentStatus === 'PAID' ? "text-[#2E7D32]/70" : "text-[#8B7355]")}>THANH TOÁN</p>
               <p className="text-lg font-bold">
                 {PAYMENT_STATUS[booking.paymentStatus]?.label || booking.paymentStatus}
               </p>
            </div>
        </div>

        {/* Existing Review Display */}
        {booking.review && (
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#C8A97E]/30 shadow-sm mb-8 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-4">
               <div>
                 <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">Đánh giá của bạn</p>
                 <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={cn(
                          "w-4 h-4",
                          star <= booking.review!.rating ? "text-[#C8A97E] fill-current" : "text-[#E8E0D4]"
                        )} 
                      />
                    ))}
                 </div>
               </div>
               <div className="w-10 h-10 rounded-full bg-[#FAF8F5] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#C8A97E]" />
               </div>
            </div>
            <p className="text-[#2C1E12] font-medium italic text-sm leading-relaxed">&ldquo;{booking.review.comment}&rdquo;</p>
            {booking.review.images && booking.review.images.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {booking.review.images.map((img: string, i: number) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E8E0D4] shrink-0">
                    <Image src={img} alt="Review" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D4] overflow-hidden mb-8">
           {/* Top: Salon & Time */}
           <div className="p-6 md:p-8 space-y-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                 <div className="flex-1">
                   <h2 className="text-2xl font-bold text-[#2C1E12] mb-2">{booking.salon.name}</h2>
                   <p className="text-sm font-medium text-[#5C4A32] flex items-center gap-1.5 mb-4">
                      <MapPin className="w-4 h-4 text-[#C8A97E]" />
                      {booking.salon.address}
                   </p>
                   <a
                    href={`tel:${booking.salon.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0EBE3] hover:bg-[#E8E0D4] rounded-lg transition-colors text-sm font-bold text-[#2C1E12]"
                   >
                    <Phone className="w-4 h-4" />
                    {booking.salon.phone}
                   </a>
                 </div>
                 <div className="text-left md:text-right md:pl-6 md:border-l border-[#E8E0D4] pt-6 md:pt-0 border-t md:border-t-0">
                    <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">Thời gian</p>
                    <p className="text-xl font-bold text-[#2C1E12] mb-0.5">{booking.timeSlot}</p>
                    <p className="text-sm font-medium text-[#8B7355]">{formatDate(booking.date)}</p>
                 </div>
              </div>

               {/* Staff Row */}
               <div className="flex items-center gap-4 p-4 md:p-6 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4]">
                  <div className="w-14 h-14 rounded-full bg-white border border-[#E8E0D4] flex items-center justify-center shrink-0">
                     {booking.staff?.user.avatar ? (
                        <Image src={booking.staff.user.avatar} alt="Staff" width={56} height={56} className="rounded-full object-cover" />
                     ) : (
                        <User className="w-6 h-6 text-[#C8A97E]" />
                     )}
                  </div>
                  <div>
                     <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">Thợ cạo</p>
                     <p className="text-lg font-bold text-[#2C1E12]">{booking.staff?.user.name || 'Bất kỳ Stylist'}</p>
                  </div>
               </div>
           </div>

           {/* Services List */}
           <div className="bg-[#FAF8F5] p-6 md:p-8 border-t border-[#E8E0D4]">
             <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-6">Dịch vụ đã chọn</h3>
             <div className="space-y-4">
                {booking.services.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-[#E8E0D4] rounded-lg flex items-center justify-center text-[#C8A97E] shrink-0">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#2C1E12]">{item.service.name}</p>
                        <p className="text-sm font-medium text-[#8B7355] mt-0.5">{item.duration} Phút</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-[#2C1E12] shrink-0 ml-4">{formatPrice(item.price)}</p>
                  </div>
                ))}
             </div>
           </div>

           {/* Financial Summary */}
           <div className="p-6 md:p-8 bg-[#F0EBE3] border-t border-[#E8E0D4]">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-[#E8E0D4]">
                   <div>
                     <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">Tổng cộng</p>
                     <p className="text-3xl font-bold text-[#2C1E12]">{formatPrice(booking.totalAmount)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">Thời gian</p>
                      <p className="text-lg font-bold text-[#5C4A32]">{booking.totalDuration} Phút</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-[#E8E0D4]">
                    <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">Đã cọc</p>
                    <p className="text-lg font-bold text-[#2C1E12]">{formatPrice(totalPaid)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-[#E8E0D4]">
                    <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">Còn lại</p>
                    <p className="text-lg font-bold text-[#2E7D32]">{formatPrice(remainingAmount)}</p>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
           {(booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'PENDING') &&
            ['PENDING', 'CONFIRMED'].includes(booking.status) && (
              <Link
                href={`/payment/${booking.id}`}
                className="block w-full py-4 bg-[#C8A97E] hover:bg-[#B8975E] text-white rounded-xl font-bold text-center transition-colors shadow-sm"
              >
                Thanh toán cọc giữ chỗ
              </Link>
            )}

           {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-4 text-[#8B7355] hover:text-[#2C1E12] font-bold text-sm bg-white border border-[#E8E0D4] rounded-xl transition-colors hover:bg-[#F0EBE3]"
            >
              Hủy lịch hẹn
            </button>
           )}

           {booking.status === 'COMPLETED' && !booking.review && (
             <>
               {isWithinReviewPeriod(booking.updatedAt) ? (
                 <div className="space-y-4">
                   <p className="text-sm text-[#8B7355] text-center italic bg-[#F0EBE3] p-3 rounded-lg border border-[#E8E0D4]">
                     📢 Bạn đang ở trong thời gian vàng 3 ngày để đánh giá dịch vụ này!
                   </p>
                   <button
                     onClick={() => setShowReviewModal(true)}
                     className="w-full py-4 bg-[#2C1E12] hover:bg-[#1C130B] text-white rounded-xl font-bold text-center transition-all shadow-lg active:scale-[0.98] animate-bounce-slow"
                   >
                     Đánh giá dịch vụ ngay
                   </button>
                 </div>
               ) : (
                 <p className="w-full py-4 text-[#8B7355] text-center font-medium bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl italic">
                   ⏳ Thời hạn 3 ngày để đánh giá dịch vụ này đã kết thúc.
                 </p>
               )}
             </>
           )}
        </div>
      </div>

      <ReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        bookingId={booking.id}
        salonName={booking.salon.name}
        staffName={booking.staff?.user.name}
        onSuccess={fetchBooking}
      />

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-lg border border-[#E8E0D4] animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold text-[#2C1E12] mb-2">Xác nhận hủy</h3>
            <p className="text-sm font-medium text-[#5C4A32] mb-6">Bạn có chắc chắn muốn bỏ lịch hẹn này?</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Lý do hủy (không bắt buộc)..."
              rows={3}
              className="w-full p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl mb-6 focus:outline-none focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E] transition-all text-sm text-[#2C1E12] placeholder:text-[#8B7355]/50"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 bg-[#F0EBE3] text-[#5C4A32] rounded-xl font-bold text-sm hover:bg-[#E8E0D4] transition-colors border border-[#E8E0D4]"
              >
                Đóng
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={cn(
                  'flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm transition-colors',
                  cancelling ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
                )}
              >
                {cancelling ? 'Đang xử lý...' : 'Đệ trình'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
