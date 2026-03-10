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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-heading font-bold mb-2">Thiếu thông tin đặt lịch</h2>
        <p className="text-muted-foreground mb-6 text-sm font-medium">Vui lòng chọn đầy đủ dịch vụ và thời gian</p>
        <Link href="/salons" className="bg-primary text-background px-10 py-4 rounded-full font-bold text-[11px] uppercase tracking-wider shadow-xl shadow-primary/20 active:scale-95 transition-all">
          Quay lại chọn salon
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => prevStep()}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-accent/5 text-foreground hover:bg-primary hover:text-background transition-all duration-500 active:scale-90"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">CONFIRMATION</span>
          <div className="w-12" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-4 uppercase tracking-tight">KIỂM TRA LẠI</h2>
          <div className="w-16 h-0.5 bg-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-wider">Xem kỹ trước khi chốt lịch</p>
        </div>

        {/* Main Card - Receipt Style */}
        <div className="bg-background rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden border border-border">
          {/* Salon Spot */}
          <div className="p-10 border-b border-dashed border-border relative">
             <div className="relative z-10">
               <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-3">ĐỊA ĐIỂM</h3>
               <h2 className="text-2xl font-heading font-bold text-foreground mb-2 mt-2 tracking-tight">{salon.name}</h2>
               <p className="text-[11px] text-muted-foreground font-bold uppercase flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-primary" />
                 {salon.address}
               </p>
             </div>
          </div>

          {/* Time & Stylist Row */}
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-dashed divide-border">
             <div className="p-10">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6">THỜI GIAN</h3>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-3xl bg-accent/5 flex items-center justify-center text-foreground shadow-sm">
                      <Calendar className="w-7 h-7" />
                   </div>
                   <div>
                      <p className="text-lg font-heading font-bold text-foreground tracking-tight leading-tight">{formatDate(selectedDate)}</p>
                      <p className="text-[10px] font-bold text-background bg-primary px-2 py-1 rounded inline-block mt-1 uppercase">Lúc {selectedTimeSlot}</p>
                   </div>
                </div>
             </div>
             <div className="p-10">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-6">THỢ CẠO</h3>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-background ring-4 ring-accent/5 flex-shrink-0">
                      {selectedStaff?.user.avatar ? (
                        <Image src={selectedStaff.user.avatar} alt="Staff" width={56} height={56} className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-accent/10 flex items-center justify-center text-xl">👤</div>
                      )}
                   </div>
                   <div>
                      <p className="text-lg font-heading font-bold text-foreground tracking-tight leading-tight">{selectedStaff?.user.name || 'Bất kỳ Stylist'}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
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
          <div className="p-12 bg-foreground text-background relative overflow-hidden border-t border-primary/20">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10">
                <div className="flex justify-between items-end mb-10 pb-10 border-b border-background/10">
                   <div>
                      <p className="text-[10px] font-bold text-background/40 uppercase tracking-[0.3em] mb-2">TỔNG CHI PHÍ</p>
                      <p className="text-4xl font-heading font-bold text-background tracking-tight leading-none">{formatPrice(totalAmount)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-background/40 uppercase tracking-[0.3em] mb-2">TỔNG GIỜ</p>
                      <p className="text-xl font-heading font-bold text-background/80 tracking-tight leading-none">{totalDuration} PHÚT</p>
                   </div>
                </div>
                
                <div className="bg-background text-foreground p-8 rounded-[32px] shadow-2xl flex justify-between items-center border border-primary/20 transition-transform hover:scale-[1.02] duration-500">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">TIỀN CỌC GIỮ LỊCH (50%)</p>
                    <p className="text-3xl font-heading font-bold text-foreground tracking-tight leading-none">{formatPrice(Math.round(totalAmount * 0.5))}</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-primary text-background flex items-center justify-center shadow-xl">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-[9px] text-center mt-8 font-bold text-background/20 uppercase tracking-widest px-4 leading-relaxed">CAM KẾT DỊCH VỤ PREMIUM - KHÔNG HÀI LÒNG KHÔNG LẤY TIỀN</p>
             </div>
          </div>
        </div>

        {/* Error/Notice */}
        {error && (
          <div className="mt-12 p-8 bg-red-50/50 border-2 border-red-100 rounded-[32px] flex items-center gap-5 animate-in shake-100">
            <AlertCircle className="w-8 h-8 text-black flex-shrink-0" />
            <p className="text-black font-bold text-[11px] uppercase tracking-wide leading-relaxed">{error}</p>
          </div>
        )}

        {status !== 'authenticated' && (
          <div className="mt-12 p-8 bg-accent/5 border border-primary/20 rounded-[32px] flex flex-col md:flex-row items-center gap-6">
            <AlertCircle className="w-8 h-8 text-primary flex-shrink-0" />
            <div className="text-center md:text-left">
              <p className="font-bold text-foreground uppercase tracking-wider mb-1 text-[11px]">YÊU CẦU ĐĂNG NHẬP</p>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight leading-relaxed">Hệ thống cần lưu thông tin để bạn quản lý lịch hẹn phục vụ tốt nhất.</p>
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
              'w-full py-6 rounded-full font-bold text-[15px] flex items-center justify-center gap-5 transition-all duration-700 shadow-xl active:scale-95 transform hover:-translate-y-1 uppercase tracking-widest',
              loading
                ? 'bg-accent/5 text-muted-foreground/30 border border-border scale-95'
                : 'bg-primary text-background shadow-primary/20'
            )}
          >
            {loading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <>
                XÁC NHẬN & THANH TOÁN
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
