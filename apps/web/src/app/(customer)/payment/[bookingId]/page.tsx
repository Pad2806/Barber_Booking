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
    <div className="min-h-screen bg-[#FDFCFB] py-12 pb-32">
      <div className="container mx-auto px-4 max-w-lg animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-gray-100">
          {/* Status Header */}
          <div className="bg-gray-900 p-10 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent/20 to-transparent pointer-events-none" />
             <div className="relative z-10">
               <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
                 <QrCode className="w-10 h-10 text-accent animate-pulse" />
               </div>
               <h1 className="text-3xl font-heading font-black text-white mb-2 tracking-tight">THANH TOÁN</h1>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] opacity-60">Quét mã bằng App ngân hàng</p>
             </div>
          </div>

          {/* QR & Bank Section */}
          <div className="p-8">
            <div className="text-center mb-8 bg-gray-50 rounded-2xl py-4 border border-gray-100">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Mã đặt lịch của bạn</p>
              <p className="text-xl font-black text-gray-900 tracking-tighter">{booking?.bookingCode}</p>
            </div>

            <div className="relative flex flex-col items-center">
              {/* Amount Pill */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-accent rounded-full text-white font-black text-lg shadow-xl shadow-accent/20 scale-110">
                {formatPrice(qrData?.amount || (booking?.totalAmount ? booking.totalAmount * 0.5 : 0))}
              </div>

              {/* QR Image Frame */}
              <div className="bg-white p-6 pt-10 rounded-[32px] border-2 border-gray-100 inline-block mb-10 shadow-2xl relative">
                {qrData?.qrCode ? (
                  <div className="relative group grayscale hover:grayscale-0 transition-all duration-700">
                    <Image src={qrData.qrCode} alt="QR Code" width={260} height={260} unoptimized className="block rounded-xl" />
                    <div className="absolute inset-x-0 -bottom-2 flex justify-center translate-y-full opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">ĐÃ TỐI ƯU CHO MOBILE BANKING</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-[260px] h-[260px] flex flex-col items-center justify-center gap-4 text-gray-200">
                    <RefreshCw className="w-12 h-12 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Đang tạo mã...</span>
                  </div>
                )}
              </div>

              {/* Bank Details Visual Card */}
              <div className="w-full bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 border border-gray-100 space-y-5">
                 <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Ngân hàng</span>
                    <span className="text-sm font-black text-gray-900">{qrData?.bankName || qrData?.bankCode}</span>
                 </div>
                 <div className="h-px bg-dashed border-t border-gray-200" />
                 <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 group">
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Số tài khoản</p>
                       <p className="text-lg font-black text-gray-900 font-mono tracking-tighter">{qrData?.bankAccount}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(qrData?.bankAccount || '')}
                      className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accent/10 transition-all active:scale-90"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                 </div>
                 <div className="flex justify-between items-center bg-accent/5 p-3 rounded-2xl border border-accent/10 group">
                    <div>
                       <p className="text-[10px] font-bold text-accent uppercase leading-none mb-1">Nội dung (BẮT BUỘC)</p>
                       <p className="text-lg font-black text-accent font-mono tracking-tighter">{booking?.bookingCode}</p>
                    </div>
                    <button
                      onClick={() => booking && copyToClipboard(booking.bookingCode)}
                      className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20 transition-all active:scale-90"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                 </div>
              </div>
            </div>

            {/* Expiring Timer */}
            <div className="mt-10 flex flex-col items-center">
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-3">Mã sẽ hết hạn sau</p>
               <div className={cn(
                 "flex items-center gap-3 px-8 py-3 rounded-2xl border-2 transition-all duration-500",
                 countdown <= 60 ? "border-red-100 bg-red-50 text-red-500 shadow-lg shadow-red-200/50" : "border-gray-50 bg-gray-50 text-accent font-black"
               )}>
                 <Clock className={cn("w-6 h-6", countdown <= 60 ? "animate-bounce" : "")} />
                 <span className="text-2xl font-black font-mono tracking-tighter">{formatTime(countdown)}</span>
               </div>
            </div>

            {/* Waiting State */}
            <div className="mt-10 pt-8 border-t border-dashed border-gray-100 flex flex-col items-center gap-4">
               <div className="flex gap-1.5 items-center">
                 <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                 <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                 <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" />
               </div>
               <p className="text-sm font-bold text-gray-400 tracking-tight">Đang đợi tiền về hệ thống...</p>
            </div>

            {/* Footer Actions */}
            <div className="mt-12 space-y-4">
               <div className="p-4 rounded-3xl bg-blue-50/50 border border-blue-100 flex gap-4 items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                     <span className="font-black text-xs">!</span>
                  </div>
                  <p className="text-xs text-blue-600/80 font-bold leading-relaxed">Tiền cọc 50% dùng để giữ lịch, bạn sẽ trả phần còn lại tại Salon sau khi hớt xong.</p>
               </div>
               <button 
                className="w-full py-5 text-gray-400 hover:text-gray-900 font-black text-xs uppercase tracking-widest transition-all"
                onClick={() => {
                  reset();
                  router.replace(`/my-bookings/${bookingId}`);
                }}
              >
                Hủy và thanh toán tại Salon sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
