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
import Footer from '@/components/footer';

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
        <Link href="/salons" className="bg-black text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-black/20 active:scale-95 transition-all">
          Quay lại chọn salon
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-40">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => prevStep()}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 text-gray-900 hover:bg-black hover:text-white transition-all duration-500 active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">CONFIRMATION</span>
          <div className="w-12" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-heading font-black text-gray-900 mb-4 tracking-tighter leading-none">KIỂM TRA LẠI</h2>
          <div className="w-16 h-1 bg-black mx-auto mb-4" />
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Xem kỹ trước khi chốt lịch</p>
        </div>

        {/* Main Card - Receipt Style */}
        <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden border border-gray-100">
          {/* Salon Spot */}
          <div className="p-10 border-b border-dashed border-gray-100 relative">
             <div className="relative z-10">
               <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-3">ĐỊA ĐIỂM</h3>
               <h2 className="text-3xl font-heading font-black text-gray-900 mb-2 mt-2 tracking-tighter">{salon.name}</h2>
               <p className="text-sm text-gray-400 font-black uppercase flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-gray-300" />
                 {salon.address}
               </p>
             </div>
          </div>

          {/* Time & Stylist Row */}
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-dashed divide-gray-100">
             <div className="p-10">
                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">THỜI GIAN</h3>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-3xl bg-gray-50 flex items-center justify-center text-black shadow-sm">
                      <Calendar className="w-7 h-7" />
                   </div>
                   <div>
                      <p className="text-xl font-black text-gray-900 tracking-tighter leading-tight">{formatDate(selectedDate)}</p>
                      <p className="text-[10px] font-black text-black bg-gray-100 px-2 py-1 rounded inline-block mt-1 uppercase">Lúc {selectedTimeSlot}</p>
                   </div>
                </div>
             </div>
             <div className="p-10">
                <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">THỢ CẠO</h3>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white ring-4 ring-gray-50 flex-shrink-0 grayscale">
                      {selectedStaff?.user.avatar ? (
                        <Image src={selectedStaff.user.avatar} alt="Staff" width={56} height={56} className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl">👤</div>
                      )}
                   </div>
                   <div>
                      <p className="text-xl font-black text-gray-900 tracking-tighter leading-tight">{selectedStaff?.user.name || 'Bất kỳ Stylist'}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                         {selectedStaff ? STAFF_POSITIONS[selectedStaff.position] : 'QUẢN LÝ TỰ XẾP'}
                      </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Services List */}
          <div className="p-10 border-t border-dashed border-gray-100 bg-gray-50/50">
             <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-8">DỊCH VỤ ĐÃ CHỌN</h3>
             <div className="space-y-6">
                {selectedServices.map(service => (
                  <div key={service.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-3xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <Scissors className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 tracking-tight leading-tight">{service.name}</p>
                        <p className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-widest">{service.duration} PHÚT THƯ GIÃN</p>
                      </div>
                    </div>
                    <p className="text-xl font-black text-gray-900 tracking-tighter">{formatPrice(service.price)}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Total & Deposit */}
          <div className="p-12 bg-black text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10">
                <div className="flex justify-between items-end mb-10 pb-10 border-b border-white/10">
                   <div>
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">TỔNG CHI PHÍ</p>
                      <p className="text-5xl font-black text-white tracking-tighter leading-none">{formatPrice(totalAmount)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">TỔNG GIỜ</p>
                      <p className="text-2xl font-black text-white/80 tracking-tighter leading-none">{totalDuration} PHÚT</p>
                   </div>
                </div>
                
                <div className="bg-white text-black p-8 rounded-[32px] shadow-2xl flex justify-between items-center transition-transform hover:scale-[1.02] duration-500">
                  <div>
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em] mb-2">TIỀN CỌC GIỮ LỊCH (50%)</p>
                    <p className="text-4xl font-black text-black tracking-tighter leading-none">{formatPrice(Math.round(totalAmount * 0.5))}</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center shadow-xl">
                    <Check className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-[8px] text-center mt-8 font-black text-white/20 uppercase tracking-[0.4em]">CAM KẾT DỊCH VỤ PREMIUM - KHÔNG HÀI LÒNG KHÔNG LẤY TIỀN</p>
             </div>
          </div>
        </div>

        {/* Error/Notice */}
        {error && (
          <div className="mt-12 p-8 bg-red-50 border-2 border-red-100 rounded-[32px] flex items-center gap-5 animate-in shake-100">
            <AlertCircle className="w-8 h-8 text-black flex-shrink-0" />
            <p className="text-black font-black text-sm uppercase tracking-tight leading-relaxed">{error}</p>
          </div>
        )}

        {status !== 'authenticated' && (
          <div className="mt-12 p-8 bg-gray-50 border-2 border-black/5 rounded-[32px] flex items-center gap-5">
            <AlertCircle className="w-8 h-8 text-black flex-shrink-0" />
            <div>
              <p className="font-black text-gray-900 uppercase tracking-widest leading-none mb-2">YÊU CẦU ĐĂNG NHẬP</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Hệ thống cần lưu thông tin để bạn quản lý lịch hẹn sau này.</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action */}
      <div className="fixed bottom-0 left-0 right-0 p-8 sm:p-12 pointer-events-none z-[60]">
        <div className="container mx-auto max-w-lg pointer-events-auto">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'w-full py-8 rounded-full font-black text-2xl flex items-center justify-center gap-5 transition-all duration-700 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] active:scale-95 transform hover:-translate-y-2 uppercase tracking-widest',
              loading
                ? 'bg-gray-100 text-gray-300 scale-95'
                : 'bg-black text-white'
            )}
          >
            {loading ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <>
                XÁC NHẬN & THANH TOÁN
                <ChevronRight className="w-8 h-8" />
              </>
            )}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
