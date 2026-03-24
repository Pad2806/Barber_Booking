'use client';

import { useState } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/OptimizedImage';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-bold mb-2 text-[#2C1E12]">Thiếu thông tin đặt lịch</h2>
        <p className="text-muted-foreground mb-6 text-sm font-medium">Vui lòng chọn đầy đủ dịch vụ và thời gian</p>
        <Link href="/salons" className="bg-primary text-background px-10 py-4 rounded-full font-bold text-[11px] uppercase tracking-wider shadow-xl shadow-primary/20 active:scale-95 transition-all">
          Quay lại chọn salon
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-32">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E0D4] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => prevStep()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F0EBE3] text-[#5C4A32] hover:bg-[#C8A97E] hover:text-white transition-colors active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-[#2C1E12]">Xác nhận lịch hẹn</span>
          <div className="w-10" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#2C1E12] mb-2">Kiểm tra thông tin</h2>
          <p className="text-sm text-[#8B7355]">Vui lòng xem kỹ thông tin trước khi thanh toán</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D4] overflow-hidden">
          {/* Salon Spot */}
          <div className="p-6 md:p-8 border-b border-[#E8E0D4] relative">
             <div className="relative z-10">
               <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">ĐỊA ĐIỂM</h3>
               <h2 className="text-xl font-bold text-[#2C1E12] mb-1">{salon.name}</h2>
               <p className="text-sm text-[#5C4A32] flex items-center gap-1.5 font-medium">
                 <MapPin className="w-4 h-4 text-[#C8A97E]" />
                 {salon.address}
               </p>
             </div>
          </div>

          {/* Time & Stylist Row */}
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E8E0D4] border-b border-[#E8E0D4]">
             <div className="p-6 md:p-8">
                <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-4">THỜI GIAN</h3>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-[#F0EBE3] flex items-center justify-center text-[#C8A97E]">
                      <Calendar className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-base font-bold text-[#2C1E12]">{formatDate(selectedDate)}</p>
                      <p className="text-sm font-bold text-[#C8A97E] mt-0.5">Lúc {selectedTimeSlot}</p>
                   </div>
                </div>
             </div>
             <div className="p-6 md:p-8">
                <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-4">THỢ CẠO</h3>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white ring-2 ring-[#E8E0D4] flex-shrink-0 bg-[#F0EBE3]">
                      {selectedStaff?.user.avatar ? (
                        <OptimizedImage src={selectedStaff.user.avatar} alt="Staff" width={48} height={48} className="object-cover" enableBlur />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#C8A97E]/50">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                   </div>
                   <div>
                      <p className="text-base font-bold text-[#2C1E12] truncate">{selectedStaff?.user.name || 'Bất kỳ Stylist'}</p>
                      <p className="text-xs font-medium text-[#8B7355] mt-0.5">
                         {selectedStaff ? STAFF_POSITIONS[selectedStaff.position] : 'QUẢN LÝ TỰ XẾP'}
                      </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Services List */}
          <div className="p-6 md:p-8 border-b border-[#E8E0D4] bg-[#FAF8F5]/50">
             <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-4">DỊCH VỤ ĐÃ CHỌN</h3>
             <div className="space-y-4">
                {selectedServices.map(service => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E0D4] flex items-center justify-center text-[#2C1E12]">
                        <Scissors className="w-5 h-5 text-[#C8A97E]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#2C1E12]">{service.name}</p>
                        <p className="text-xs font-medium text-[#8B7355] mt-0.5">{service.duration} PHÚT</p>
                      </div>
                    </div>
                    <p className="text-base font-bold text-[#2C1E12]">{formatPrice(service.price)}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Total & Deposit */}
          <div className="p-6 md:p-8 bg-[#F8F9FA] relative">
             <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-[#8B7355]">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-[#2C1E12]">{formatPrice(totalAmount)}</span>
             </div>
             
             <div className="bg-white border border-[#E8E0D4] p-5 rounded-xl flex justify-between items-center">
               <div>
                 <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">TIỀN CỌC GIỮ LỊCH (25%)</p>
                 <p className="text-xl font-bold text-[#2C1E12]">{formatPrice(Math.round(totalAmount * 0.25))}</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
                 <Check className="w-5 h-5" />
               </div>
             </div>
          </div>
        </div>

        {/* Error/Notice */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in shake-100">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 font-medium text-sm">{error}</p>
          </div>
        )}

        {status !== 'authenticated' && (
          <div className="mt-6 p-5 bg-[#FFF8E1] border border-[#FFE082] rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F57F17] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-[#F57F17] text-sm mb-1">YÊU CẦU ĐĂNG NHẬP</p>
              <p className="text-sm text-[#F57F17]/80">Hệ thống cần lưu thông tin để bạn quản lý lịch hẹn phục vụ tốt nhất.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white border-t border-[#E8E0D4] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[60]">
        <div className="container mx-auto max-w-2xl px-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all',
              loading
                ? 'bg-[#F0EBE3] text-[#8B7355] cursor-not-allowed'
                : 'bg-[#C8A97E] text-white hover:bg-[#B8975E] active:scale-[0.98]'
            )}
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin relative top-[-1px]" />
            ) : (
              <>
                Xác nhận & Thanh toán
                <ChevronRight className="w-5 h-5 relative top-[-1px]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
