'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  User,
  Scissors,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { bookingApi } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, formatDate, cn, STAFF_POSITIONS } from '@/lib/utils';

export default function BookingConfirmPage() {
  const router = useRouter();
  const { status } = useSession();
  const {
    salon,
    selectedServices,
    selectedStaff,
    selectedDate,
    selectedTimeSlot,
    totalDuration,
    totalAmount,
    note,
    prevStep,
  } = useBookingStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!salon || !selectedDate || !selectedTimeSlot) return;

    // Redirect to login if not authenticated
    if (status !== 'authenticated') {
      const returnUrl = encodeURIComponent('/booking/confirm');
      router.push(`/login?callbackUrl=${returnUrl}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const booking = await bookingApi.create({
        salonId: salon.id,
        staffId: selectedStaff?.id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        serviceIds: selectedServices.map(s => s.id),
        note: note || undefined,
      });

      // Navigate to payment
      router.push(`/payment/${booking.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đặt lịch thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!salon || !selectedDate || !selectedTimeSlot || selectedServices.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-semibold mb-2">Thiếu thông tin đặt lịch</h2>
        <p className="text-gray-500 mb-4">Vui lòng chọn đầy đủ dịch vụ và thời gian</p>
        <Link href="/salons" className="bg-accent text-white px-6 py-3 rounded-xl font-medium">
          Quay lại chọn salon
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-40">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <button
            onClick={() => prevStep()}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-accent hover:bg-accent/10 transition-all active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest text-gray-400">Bước cuối: Xác nhận</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-heading font-black text-gray-900 mb-2 tracking-tight">KIỂM TRA LẠI</h2>
          <p className="text-gray-400">Một chút nữa thôi là lịch hẹn đã sẵn sàng</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100">
          {/* Salon Spot */}
          <div className="p-8 bg-gradient-to-br from-gray-50 to-white border-b border-dashed border-gray-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <MapPin className="w-32 h-32" />
             </div>
             <div className="relative z-10">
               <h3 className="text-xs font-black text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                  Địa điểm hớt tóc
               </h3>
               <h2 className="text-2xl font-heading font-black text-gray-900 mb-2">{salon.name}</h2>
               <p className="text-sm text-gray-400 font-medium">{salon.address}</p>
             </div>
          </div>

          {/* Time & Stylist Row */}
          <div className="grid sm:grid-cols-2">
             <div className="p-8 border-b sm:border-b-0 sm:border-r border-dashed border-gray-100">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4">Thời gian</h3>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-accent/5 flex items-center justify-center text-accent">
                      <Calendar className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-lg font-black text-gray-900">{formatDate(selectedDate)}</p>
                      <p className="text-xs font-bold text-accent uppercase tracking-tighter">Lúc {selectedTimeSlot}</p>
                   </div>
                </div>
             </div>
             <div className="p-8 border-b border-dashed border-gray-100">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest mb-4">Người thực hiện</h3>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white ring-4 ring-gray-50 flex-shrink-0">
                      {selectedStaff?.user.avatar ? (
                        <Image src={selectedStaff.user.avatar} alt="Staff" width={48} height={48} className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">👤</div>
                      )}
                   </div>
                   <div>
                      <p className="text-lg font-black text-gray-900">{selectedStaff?.user.name || 'Bất kỳ Stylist'}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                         {selectedStaff ? STAFF_POSITIONS[selectedStaff.position] : 'Hệ thống tự xếp'}
                      </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Services List */}
          <div className="p-8 border-b border-dashed border-gray-100 bg-gray-50/30">
             <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest mb-6">Combo dịch vụ</h3>
             <div className="space-y-4">
                {selectedServices.map(service => (
                  <div key={service.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-accent transition-colors">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 tracking-tight">{service.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{service.duration} phút</p>
                      </div>
                    </div>
                    <p className="font-black text-gray-900">{formatPrice(service.price)}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Total & Deposit */}
          <div className="p-8 bg-gray-900 text-white">
             <div className="flex justify-between items-end mb-8">
                <div>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tổng chi phí</p>
                   <p className="text-3xl font-black text-white">{formatPrice(totalAmount)}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Thời gian hớt</p>
                   <p className="text-lg font-black text-white/80">{totalDuration} phút</p>
                </div>
             </div>
             
             <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex justify-between items-center transition-transform active:scale-95">
               <div>
                 <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Cọc giữ lịch (50%)</p>
                 <p className="text-2xl font-black text-white">{formatPrice(Math.round(totalAmount * 0.5))}</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
                 <Check className="w-6 h-6" />
               </div>
             </div>
             <p className="text-[10px] text-center mt-6 font-bold text-white/30 uppercase tracking-wider">Lịch hẹn của bạn sẽ được giữ ngay sau khi chuyển khoản</p>
          </div>
        </div>

        {/* Error/Notice */}
        {error && (
          <div className="mt-8 p-6 bg-red-50 border-2 border-red-100 rounded-3xl flex items-start gap-4 animate-in shake-100">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <p className="text-red-700 font-bold text-sm tracking-tight">{error}</p>
          </div>
        )}

        {status !== 'authenticated' && (
          <div className="mt-8 p-6 bg-accent/5 border-2 border-accent/10 rounded-3xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-accent flex-shrink-0" />
            <div>
              <p className="font-black text-gray-900 leading-none mb-1">CHƯA ĐĂNG NHẬP</p>
              <p className="text-sm text-gray-400 font-medium">Bạn sẽ tự động được đưa tới trang đăng nhập để lưu trữ lịch hẹn này</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 sm:p-10 pointer-events-none z-[60]">
        <div className="container mx-auto max-w-lg pointer-events-auto">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'w-full py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-4 transition-all duration-500 shadow-2xl active:scale-95',
              loading
                ? 'bg-gray-100 text-gray-300'
                : 'bg-accent text-white shadow-accent/40 hover:shadow-accent/60'
            )}
          >
            {loading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <>
                XÁC NHẬN NGAY
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
