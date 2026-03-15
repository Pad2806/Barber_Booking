'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Copy, Check, RefreshCw, QrCode } from 'lucide-react';
import { bookingApi, paymentApi, Booking } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, cn } from '@/lib/utils';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const { reset } = useBookingStore();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [qrData, setQrData] = useState<{
    qrCode: string;
    qrContent: string;
    amount: number;
    bankCode: string;
    bankAccount: string;
    bankName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'FAILED'>('PENDING');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingData, qr] = await Promise.all([
        bookingApi.getById(bookingId),
        paymentApi.generateQR(bookingId),
      ]);
      setBooking(bookingData);
      setQrData(qr);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) {
      void fetchData();
    }
  }, [bookingId, fetchData]);

  // Poll for payment status
  useEffect(() => {
    if (paymentStatus !== 'PENDING') return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await paymentApi.getStatus(bookingId);
        if (status.paymentStatus === 'PAID') {
          setPaymentStatus('PAID');
          reset(); // Clear booking store
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [bookingId, paymentStatus, reset]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus !== 'PENDING' || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setPaymentStatus('FAILED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, countdown]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
      </div>
    );
  }

  // Payment Success
  if (paymentStatus === 'PAID') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 md:p-12 max-w-md w-full text-center shadow-sm border border-[#E8E0D4]">
          <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#2E7D32]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C1E12] mb-3">
            Đặt cọc thành công!
          </h1>
          <p className="text-sm text-[#8B7355] mb-6 leading-relaxed">
            Cảm ơn bạn đã đặt cọc. Thông tin chi tiết đã được gửi về email/điện thoại của bạn.
            Phần còn lại sẽ được thanh toán tại cửa hàng sau khi trải nghiệm dịch vụ.
          </p>
          {booking && (
            <div className="bg-[#FAF8F5] rounded-xl p-6 mb-8 text-center border border-[#E8E0D4]">
              <p className="text-xs font-bold text-[#8B7355] mb-2 uppercase tracking-wider">MÃ ĐẶT LỊCH</p>
              <p className="text-2xl font-bold text-[#C8A97E] tracking-tight">{booking.bookingCode}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.replace(`/my-bookings/${bookingId}`)}
              className="bg-[#C8A97E] text-white py-3.5 rounded-xl font-bold hover:bg-[#B8975E] transition-colors active:scale-[0.98]"
            >
              Xem chi tiết đặt lịch
            </button>
            <Link href="/" className="text-sm font-bold text-[#8B7355] hover:text-[#5C4A32] transition-colors py-2">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment Failed/Timeout
  if (paymentStatus === 'FAILED') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 md:p-12 max-w-md w-full text-center shadow-sm border border-[#E8E0D4]">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C1E12] mb-3">
            Thanh toán thất bại
          </h1>
          <p className="text-sm text-[#8B7355] mb-8">
            Thời gian thanh toán đã hết. Vui lòng thanh toán tại cửa hàng hoặc làm mới phiên giao dịch.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setPaymentStatus('PENDING');
                setCountdown(600);
                fetchData();
              }}
              className="bg-[#C8A97E] text-white py-3.5 rounded-xl font-bold hover:bg-[#B8975E] transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Thử lại
            </button>
            <button 
                className="py-3.5 text-[#2C1E12] border border-[#E8E0D4] bg-white rounded-xl font-bold hover:bg-[#F0EBE3] transition-colors"
                onClick={() => {
                  reset();
                  router.replace(`/my-bookings/${bookingId}`);
                }}
              >
                Thanh toán tại cửa hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Pending - Show QR
  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-[500px] animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E8E0D4]">
          {/* Status Header */}
          <div className="bg-[#2C1E12] p-8 text-center relative overflow-hidden">
             <div className="relative z-10 flex flex-col items-center">
               <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                 <QrCode className="w-8 h-8 text-[#C8A97E] animate-pulse" />
               </div>
               <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Thanh toán cọc</h1>
               <div className="h-[2px] w-12 bg-[#C8A97E] mb-3" />
               <p className="text-white/80 text-sm font-medium">Quét mã để giữ chỗ ngay</p>
             </div>
          </div>

          {/* QR & Bank Section */}
          <div className="p-6 md:p-8">
            <div className="text-center mb-8 bg-[#F0EBE3] rounded-xl py-4 border border-[#E8E0D4]">
              <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">MÃ ĐẶT LỊCH</p>
              <p className="text-xl font-bold text-[#2C1E12] tracking-tight">{booking?.bookingCode}</p>
            </div>

            <div className="relative flex flex-col items-center">
              {/* Amount Pill */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-white text-[#C8A97E] border border-[#E8E0D4] rounded-full font-bold text-lg shadow-sm whitespace-nowrap">
                {formatPrice(qrData?.amount || (booking?.totalAmount ? booking.totalAmount * 0.5 : 0))}
              </div>

              {/* QR Image Frame */}
              <div className="bg-white p-6 pt-10 rounded-2xl border border-[#E8E0D4] inline-block mb-8 shadow-sm relative">
                {qrData?.qrCode ? (
                  <div className="relative">
                    <Image src={qrData.qrCode} alt="QR Code" width={240} height={240} unoptimized className="block rounded-xl border border-[#E8E0D4]" />
                  </div>
                ) : (
                  <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-4 text-[#8B7355]">
                    <RefreshCw className="w-10 h-10 animate-spin text-[#C8A97E]" />
                    <span className="text-sm font-bold uppercase tracking-wider">Đang tạo mã...</span>
                  </div>
                )}
              </div>

              {/* Bank Details Visual Card */}
              <div className="w-full space-y-3">
                 <div className="bg-[#FAF8F5] rounded-xl p-5 border border-[#E8E0D4]">
                    <div className="flex justify-between items-start mb-4">
                       <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">NGÂN HÀNG</p>
                       <span className="text-sm font-bold text-[#2C1E12]">{qrData?.bankName || qrData?.bankCode}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <div>
                          <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1">SỐ TÀI KHOẢN</p>
                          <p className="text-xl font-bold text-[#2C1E12]">{qrData?.bankAccount}</p>
                       </div>
                       <button
                         onClick={() => copyToClipboard(qrData?.bankAccount || '')}
                         className="w-10 h-10 rounded-lg bg-white border border-[#E8E0D4] flex items-center justify-center hover:bg-[#F0EBE3] hover:border-[#C8A97E] hover:text-[#C8A97E] transition-all active:scale-95 text-[#8B7355]"
                       >
                         {copied ? <Check className="w-5 h-5 text-[#2E7D32]" /> : <Copy className="w-5 h-5" />}
                       </button>
                    </div>
                 </div>

                 <div className="bg-[#2C1E12] text-white rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center">
                       <div>
                          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">NỘI DUNG (BẮT BUỘC)</p>
                          <p className="text-xl font-bold text-[#C8A97E]">{booking?.bookingCode}</p>
                       </div>
                       <button
                         onClick={() => booking && copyToClipboard(booking.bookingCode)}
                         className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 text-white"
                       >
                         {copied ? <Check className="w-5 h-5 text-[#2E7D32]" /> : <Copy className="w-5 h-5" />}
                       </button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Expiring Timer */}
            <div className="mt-8 flex flex-col items-center">
               <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3">Hiệu lực trong</p>
               <div className={cn(
                 "flex items-center gap-3 px-6 py-2.5 rounded-full transition-all",
                 countdown <= 60 ? "bg-red-50 text-red-600 font-bold border border-red-200" : "bg-[#F0EBE3] text-[#2C1E12] font-bold border border-[#E8E0D4]"
               )}>
                 <Clock className={cn("w-5 h-5", countdown <= 60 ? "animate-pulse" : "text-[#C8A97E]")} />
                 <span className="text-xl tracking-tight">{formatTime(countdown)}</span>
               </div>
            </div>

            {/* Waiting State */}
            <div className="mt-8 pt-6 border-t border-[#E8E0D4] flex flex-col items-center gap-4">
               <div className="flex gap-1.5 items-center">
                 <div className="w-1.5 h-1.5 bg-[#C8A97E] rounded-full animate-pulse" />
                 <div className="w-1.5 h-1.5 bg-[#C8A97E] rounded-full animate-pulse [animation-delay:0.2s]" />
                 <div className="w-1.5 h-1.5 bg-[#C8A97E] rounded-full animate-pulse [animation-delay:0.4s]" />
               </div>
               <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Hệ thống đang kiểm tra tiền về...</p>
            </div>

            {/* Footer Actions */}
            <div className="mt-8">
               <div className="p-4 rounded-xl bg-[#FFF8E1] border border-[#FFE082] flex gap-3 items-start mb-4">
                  <span className="text-[#F57F17] font-bold mt-0.5">!</span>
                  <p className="text-sm text-[#F57F17] leading-relaxed">
                    Số tiền cọc 50% sẽ được khấu trừ trực tiếp khi bạn thanh toán hóa đơn tại cửa hàng.
                  </p>
               </div>
               <button 
                className="w-full py-3.5 text-[#5C4A32] bg-[#F0EBE3] hover:bg-[#E8E0D4] border border-[#E8E0D4] rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                onClick={() => {
                  reset();
                  router.replace(`/my-bookings/${bookingId}`);
                }}
              >
                Thanh toán tại cửa hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
