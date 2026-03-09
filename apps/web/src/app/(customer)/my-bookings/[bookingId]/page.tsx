'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeft, MapPin, Calendar, Clock, User, Scissors, Phone, XCircle } from 'lucide-react';
import { bookingApi, Booking } from '@/lib/api';
import {
  formatPrice,
  formatDate,
  formatDateTime,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  cn,
} from '@/lib/utils';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-semibold mb-2">Không tìm thấy lịch hẹn</h2>
        <Link href="/my-bookings" className="text-accent hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/my-bookings')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay lại
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Booking Code */}
        <div className="bg-gray-900 text-white rounded-[40px] p-10 text-center mb-8 relative overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-700">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Mã đặt lịch của bạn</p>
            <p className="text-5xl font-black font-mono tracking-tighter text-white">{booking.bookingCode}</p>
          </div>
        </div>

        {/* Status Section */}
        <div className="flex gap-4 mb-8">
            <div className={cn(
              'flex-1 p-6 rounded-[32px] border-2 transition-all duration-500 animate-in slide-in-from-left-4',
              BOOKING_STATUS[booking.status]?.color?.includes('bg-green') ? 'bg-green-50/50 border-green-100' : 
              BOOKING_STATUS[booking.status]?.color?.includes('bg-yellow') ? 'bg-yellow-50/50 border-yellow-100' :
              BOOKING_STATUS[booking.status]?.color?.includes('bg-red') ? 'bg-red-50/50 border-red-100' :
              'bg-gray-50 border-gray-100'
            )}>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Trạng thái lịch</p>
               <p className={cn(
                 "text-xl font-black",
                 BOOKING_STATUS[booking.status]?.color?.includes('bg-green') ? 'text-green-600' : 
                 BOOKING_STATUS[booking.status]?.color?.includes('bg-yellow') ? 'text-yellow-600' :
                 BOOKING_STATUS[booking.status]?.color?.includes('bg-red') ? 'text-red-600' :
                 'text-gray-900'
               )}>
                 {BOOKING_STATUS[booking.status]?.label || booking.status}
               </p>
            </div>
            <div className={cn(
              'flex-1 p-6 rounded-[32px] border-2 transition-all duration-500 animate-in slide-in-from-right-4',
              PAYMENT_STATUS[booking.paymentStatus]?.color?.includes('bg-green') ? 'bg-green-50/50 border-green-100' : 
              PAYMENT_STATUS[booking.paymentStatus]?.color?.includes('bg-teal') ? 'bg-teal-50/50 border-teal-100' :
              'bg-gray-50 border-gray-100'
            )}>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Thanh toán</p>
               <p className={cn(
                 "text-xl font-black",
                 PAYMENT_STATUS[booking.paymentStatus]?.color?.includes('bg-green') ? 'text-green-600' : 
                 PAYMENT_STATUS[booking.paymentStatus]?.color?.includes('bg-teal') ? 'text-teal-600' :
                 'text-gray-900'
               )}>
                 {PAYMENT_STATUS[booking.paymentStatus]?.label || booking.paymentStatus}
               </p>
            </div>
        </div>

        {/* Global Details Card */}
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           {/* Top: Salon & Time */}
           <div className="p-8 space-y-8">
              <div className="flex items-start justify-between">
                 <div>
                   <h2 className="text-3xl font-heading font-black text-gray-900 tracking-tighter mb-2">{booking.salon.name}</h2>
                   <p className="text-sm font-bold text-gray-400 uppercase flex items-center gap-1.5 leading-relaxed decoration-accent/30 decoration-2 underline-offset-4 mb-4">
                      <MapPin className="w-4 h-4" />
                      {booking.salon.address}
                   </p>
                   <a
                    href={`tel:${booking.salon.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-accent/10 hover:text-accent rounded-full transition-all text-sm font-bold text-gray-400 group"
                   >
                    <Phone className="w-4 h-4" />
                    {booking.salon.phone}
                   </a>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Thời gian</p>
                    <p className="text-lg font-black text-accent">{booking.timeSlot}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{formatDate(booking.date)}</p>
                 </div>
              </div>

              {/* Staff Row */}
              <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-3xl group">
                 <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    {booking.staff?.user.avatar ? (
                       <Image src={booking.staff.user.avatar} alt="Staff" width={56} height={56} className="rounded-xl object-cover" />
                    ) : (
                       <User className="w-7 h-7 text-accent" />
                    )}
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Thợ cạo tin dùng</p>
                    <p className="text-xl font-black text-gray-900 tracking-tight">{booking.staff?.user.name || 'Bất kỳ Stylist'}</p>
                 </div>
              </div>
           </div>

           {/* Services List with Checkmarks */}
           <div className="bg-gray-50/50 p-8 border-t border-dashed border-gray-100">
             <h3 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] mb-6">Chi tiết dịch vụ</h3>
             <div className="space-y-5">
                {booking.services.map(item => (
                  <div key={item.id} className="flex items-center justify-between animate-in slide-in-from-left duration-500">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-accent shadow-sm">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 tracking-tight leading-tight mb-0.5">{item.service.name}</p>
                        <p className="text-[10px] font-black text-gray-300 uppercase">{item.duration} phút thư giãn</p>
                      </div>
                    </div>
                    <p className="text-lg font-black text-gray-900 tracking-tighter">{formatPrice(item.price)}</p>
                  </div>
                ))}
             </div>
           </div>

           {/* Financial Summary */}
           <div className="p-10 bg-gray-900 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-accent/10 to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center text-gray-400">
                  <p className="text-xs font-black uppercase tracking-widest">Toàn bộ chi phí</p>
                  <p className="text-xl font-black text-white/50">{formatPrice(booking.totalAmount)}</p>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between items-center text-teal-400">
                    <p className="text-xs font-black uppercase tracking-widest">Đã cọc (Online)</p>
                    <p className="text-xl font-black">-{formatPrice(totalPaid)}</p>
                  </div>
                )}
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-end">
                   <div>
                     <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1">Cần thanh toán tại Salon</p>
                     <p className="text-4xl font-black text-white tracking-tighter">{formatPrice(remainingAmount)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Tổng thời gian</p>
                      <p className="text-lg font-black text-white/80">{booking.totalDuration} Phút</p>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Note */}
        {booking.note && (
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 mb-8 relative">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Ghi chú của bạn</h3>
            <p className="text-gray-600 font-medium italic">&ldquo;{booking.note}&rdquo;</p>
          </div>
        )}

        {/* Actions Button Center */}
        <div className="space-y-4">
           {/* Payment button for unpaid */}
           {(booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'PENDING') &&
            ['PENDING', 'CONFIRMED'].includes(booking.status) && (
              <Link
                href={`/payment/${booking.id}`}
                className="block w-full py-6 bg-accent text-white rounded-[32px] font-black text-lg text-center shadow-2xl shadow-accent/40 active:scale-95 transition-all duration-300 transform hover:-translate-y-1"
              >
                THANH TOÁN CỌC (50%) ĐỂ GIỮ CHỖ
              </Link>
            )}

           {/* Cancel Button */}
           {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-5 text-gray-400 font-black text-xs uppercase tracking-[0.2em] hover:text-red-500 transition-colors"
            >
              Hủy lịch hẹn nếu bạn bận
            </button>
           )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Hủy lịch hẹn</h3>
            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn hủy lịch hẹn này?</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Lý do hủy (không bắt buộc)"
              rows={3}
              className="w-full p-3 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={cn(
                  'flex-1 py-3 bg-red-500 text-white rounded-xl font-medium transition-colors',
                  cancelling ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                )}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
