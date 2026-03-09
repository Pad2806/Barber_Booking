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
  const bookingId = params.bookingId as string;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Payment Success
  if (paymentStatus === 'PAID') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-2">
            Đặt cọc thành công!
          </h1>
          <p className="text-gray-500 mb-6">
            Cảm ơn bạn đã đặt cọc để giữ lịch. Thông tin chi tiết đã được gửi về email/điện thoại của bạn.
            Phần còn lại sẽ được thanh toán tại cửa hàng sau khi trải nghiệm dịch vụ xong.
          </p>
          {booking && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-2">Mã đặt lịch</p>
              <p className="text-xl font-bold text-accent">{booking.bookingCode}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.replace(`/my-bookings/${bookingId}`)}
              className="bg-accent text-white py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
            >
              Xem chi tiết đặt lịch
            </button>
            <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-2">
            Thanh toán thất bại
          </h1>
          <p className="text-gray-500 mb-6">Thời gian thanh toán đã hết. Vui lòng thử lại.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setPaymentStatus('PENDING');
                setCountdown(600);
                fetchData();
              }}
              className="bg-accent text-white py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Thử lại
            </button>
            <Link href="/salons" className="text-gray-600 hover:text-primary transition-colors">
              Đặt lịch mới
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment Pending - Show QR
  return (
    <div className="min-h-screen bg-white py-12 pb-32">
      <div className="container mx-auto px-4 max-w-lg animate-in fade-in zoom-in-95 duration-1000">
        <div className="bg-white rounded-[40px] overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.12)] border border-gray-100">
          {/* Status Header */}
          <div className="bg-black p-12 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
             <div className="relative z-10">
               <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-8 backdrop-blur-3xl border border-white/10 ring-1 ring-white/20">
                 <QrCode className="w-12 h-12 text-white animate-pulse" />
               </div>
               <h1 className="text-4xl font-heading font-black text-white mb-3 tracking-tighter">PAYMENT</h1>
               <div className="h-0.5 w-12 bg-white/20 mx-auto mb-4" />
               <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Quét mã để giữ chỗ ngay</p>
             </div>
          </div>

          {/* QR & Bank Section */}
          <div className="p-10">
            <div className="text-center mb-10 bg-gray-50 rounded-3xl py-6 border border-gray-100">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2">MÃ ĐẶT LỊCH</p>
              <p className="text-3xl font-black text-gray-900 tracking-tighter font-mono">{booking?.bookingCode}</p>
            </div>

            <div className="relative flex flex-col items-center">
              {/* Amount Pill */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 px-10 py-4 bg-black rounded-full text-white font-black text-2xl shadow-2xl scale-110 tracking-tighter">
                {formatPrice(qrData?.amount || (booking?.totalAmount ? booking.totalAmount * 0.5 : 0))}
              </div>

              {/* QR Image Frame */}
              <div className="bg-white p-10 pt-16 rounded-[48px] border-2 border-gray-50 inline-block mb-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] relative transform hover:scale-[1.02] transition-transform duration-700">
                {qrData?.qrCode ? (
                  <div className="relative group grayscale hover:grayscale-0 transition-all duration-1000">
                    <Image src={qrData.qrCode} alt="QR Code" width={300} height={300} unoptimized className="block rounded-3xl" />
                    <div className="absolute inset-x-0 -bottom-4 flex justify-center translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sử dụng App Ngân hàng bất kỳ</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-[300px] h-[300px] flex flex-col items-center justify-center gap-6 text-gray-100">
                    <RefreshCw className="w-16 h-16 animate-spin text-gray-200" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">TẠO MÃ THANH TOÁN...</span>
                  </div>
                )}
              </div>

              {/* Bank Details Visual Card */}
              <div className="w-full space-y-4">
                 <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 group transition-all duration-500 hover:bg-white hover:shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">NGÂN HÀNG</p>
                       <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{qrData?.bankName || qrData?.bankCode}</span>
                    </div>
                    <div className="flex justify-between items-center group">
                       <div>
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1">SỐ TÀI KHOẢN</p>
                          <p className="text-2xl font-black text-gray-900 font-mono tracking-tighter">{qrData?.bankAccount}</p>
                       </div>
                       <button
                         onClick={() => copyToClipboard(qrData?.bankAccount || '')}
                         className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all duration-500 active:scale-90 shadow-sm"
                       >
                         {copied ? <Check className="w-6 h-6 text-gray-900" /> : <Copy className="w-6 h-6" />}
                       </button>
                    </div>
                 </div>

                 <div className="bg-black text-white rounded-[32px] p-8 group transition-all duration-500 shadow-2xl shadow-black/10">
                    <div className="flex justify-between items-center">
                       <div>
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">NỘI DUNG (BẮT BUỘC)</p>
                          <p className="text-2xl font-black text-white font-mono tracking-tighter underline decoration-white/20 underline-offset-8">{booking?.bookingCode}</p>
                       </div>
                       <button
                         onClick={() => booking && copyToClipboard(booking.bookingCode)}
                         className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-500 active:scale-90"
                       >
                         {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                       </button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Expiring Timer */}
            <div className="mt-14 flex flex-col items-center">
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-5 italic font-mono">EXPIRES IN</p>
               <div className={cn(
                 "flex items-center gap-4 px-12 py-4 rounded-full border-2 transition-all duration-700",
                 countdown <= 60 ? "border-black bg-black text-white shadow-2xl" : "border-gray-50 bg-gray-50 text-black font-black"
               )}>
                 <Clock className={cn("w-7 h-7", countdown <= 60 ? "animate-spin duration-[3000ms]" : "")} />
                 <span className="text-4xl font-black font-mono tracking-tighter leading-none">{formatTime(countdown)}</span>
               </div>
            </div>

            {/* Waiting State */}
            <div className="mt-16 pt-10 border-t border-dashed border-gray-100 flex flex-col items-center gap-6">
               <div className="flex gap-2 items-center">
                 <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                 <div className="w-2 h-2 bg-black rounded-full animate-pulse [animation-delay:0.2s]" />
                 <div className="w-2 h-2 bg-black rounded-full animate-pulse [animation-delay:0.4s]" />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Hệ thống đang kiểm tra tiền về...</p>
            </div>

            {/* Footer Actions */}
            <div className="mt-16 space-y-6">
               <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100 flex gap-6 items-center">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black flex-shrink-0 shadow-sm font-black text-lg">!</div>
                  <p className="text-xs text-gray-500 font-bold leading-relaxed uppercase tracking-tight">Số tiền cọc 50% sẽ được khấu trừ trực tiếp khi bạn thanh toán hóa đơn tại cửa hàng.</p>
               </div>
               <button 
                className="w-full py-6 text-gray-300 hover:text-black font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 hover:tracking-[0.6em]"
                onClick={() => {
                  reset();
                  router.replace(`/my-bookings/${bookingId}`);
                }}
              >
                THANH TOÁN TẠI CỬA HÀNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
