'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Copy, Check, RefreshCw, QrCode, Shield, ArrowLeft, CreditCard, Banknote } from 'lucide-react';
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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(600);

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
    if (bookingId) void fetchData();
  }, [bookingId, fetchData]);

  // Poll for payment status
  useEffect(() => {
    if (paymentStatus !== 'PENDING') return;
    const pollInterval = setInterval(async () => {
      try {
        const status = await paymentApi.getStatus(bookingId);
        if (status.paymentStatus === 'PAID') {
          setPaymentStatus('PAID');
          reset();
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
          bookingApi.cancel(bookingId, 'Hết thời gian thanh toán cọc').catch(err =>
            console.error('Failed to auto-cancel booking on timeout:', err)
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStatus, countdown, bookingId]);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const depositAmount = qrData?.amount || (booking?.totalAmount ? Math.round(booking.totalAmount * 0.25) : 0);

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#8B7355]">Đang tạo giao dịch...</p>
        </div>
      </div>
    );
  }

  // ── Payment Success ──────────────────────────────────────────
  if (paymentStatus === 'PAID') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full text-center shadow-lg border border-[#E8E0D4]">
          {/* Success animation */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#2C1E12] mb-2">Đặt cọc thành công!</h1>
          <p className="text-sm text-[#8B7355] mb-6 leading-relaxed max-w-xs mx-auto">
            Cảm ơn bạn! Thông tin đã được gửi về email. Thanh toán phần còn lại tại salon.
          </p>

          {booking && (
            <div className="bg-gradient-to-br from-[#2C1E12] to-[#3D2E1F] rounded-2xl p-6 mb-6 text-center">
              <p className="text-[10px] font-bold text-[#C8A97E] mb-2 uppercase tracking-[0.2em]">Mã đặt lịch</p>
              <p className="text-3xl font-bold text-white tracking-wider">{booking.bookingCode}</p>
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-center gap-6">
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Đặt cọc</p>
                  <p className="text-sm font-bold text-[#C8A97E]">{formatPrice(depositAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase">Còn lại</p>
                  <p className="text-sm font-bold text-white">{formatPrice((booking.totalAmount || 0) - depositAmount)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.replace(`/my-bookings/${bookingId}`)}
              className="bg-[#C8A97E] text-white py-3.5 rounded-xl font-bold hover:bg-[#B8975E] transition-all active:scale-[0.98] shadow-md shadow-[#C8A97E]/20 cursor-pointer"
            >
              Xem chi tiết đặt lịch
            </button>
            <Link href="/" className="text-sm font-bold text-[#8B7355] hover:text-[#5C4A32] transition-colors py-2 block">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Failed ───────────────────────────────────────────
  if (paymentStatus === 'FAILED') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-10 max-w-md w-full text-center shadow-lg border border-[#E8E0D4]">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-100">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C1E12] mb-2">Hết thời gian thanh toán</h1>
          <p className="text-sm text-[#8B7355] mb-8 max-w-xs mx-auto">
            Phiên giao dịch đã hết hạn. Bạn có thể thử lại hoặc thanh toán trực tiếp tại salon.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setPaymentStatus('PENDING');
                setCountdown(600);
                fetchData();
              }}
              className="bg-[#C8A97E] text-white py-3.5 rounded-xl font-bold hover:bg-[#B8975E] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-[#C8A97E]/20 cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              Thử lại
            </button>
            <button
              className="py-3.5 text-[#5C4A32] bg-[#F0EBE3] hover:bg-[#E8E0D4] rounded-xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer"
              onClick={() => {
                reset();
                router.replace(`/my-bookings/${bookingId}`);
              }}
            >
              Thanh toán tại salon
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Pending — QR ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#E8E0D4] sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[#8B7355] hover:text-[#5C4A32] transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-bold text-[#2C1E12]">Thanh toán cọc</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Timer Bar */}
        <div className={cn(
          'flex items-center justify-between p-3.5 rounded-2xl border transition-all',
          countdown <= 60
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-[#E8E0D4]'
        )}>
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              countdown <= 60 ? 'bg-red-100' : 'bg-[#F0EBE3]'
            )}>
              <Clock className={cn('w-4 h-4', countdown <= 60 ? 'text-red-500 animate-pulse' : 'text-[#C8A97E]')} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B7355]">Thời gian còn lại</p>
              <p className={cn('text-lg font-bold tabular-nums', countdown <= 60 ? 'text-red-600' : 'text-[#2C1E12]')}>
                {formatTime(countdown)}
              </p>
            </div>
          </div>
          {/* Progress ring */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" className="stroke-[#E8E0D4]" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                className={cn('transition-all duration-1000', countdown <= 60 ? 'stroke-red-400' : 'stroke-[#C8A97E]')}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(countdown / 600) * 94.2} 94.2`}
              />
            </svg>
          </div>
        </div>

        {/* Amount + Booking Code Card */}
        <div className="bg-gradient-to-br from-[#2C1E12] to-[#3D2E1F] rounded-2xl p-5 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8A97E]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#C8A97E]/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <p className="text-[10px] font-bold text-[#C8A97E] uppercase tracking-[0.2em] mb-1">Số tiền cọc</p>
            <p className="text-3xl font-bold text-white mb-3">{formatPrice(depositAmount)}</p>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span className="text-xs font-bold text-white/80">Mã: {booking?.bookingCode}</span>
              <button
                onClick={() => booking && copyToClipboard(booking.bookingCode, 'code')}
                className="ml-1 hover:text-[#C8A97E] transition-colors cursor-pointer"
              >
                {copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-4 h-4 text-[#C8A97E]" />
            <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Quét mã QR để thanh toán</h3>
          </div>

          <div className="flex justify-center">
            {qrData?.qrCode ? (
              <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-[#E8E0D4] inline-block">
                <Image
                  src={qrData.qrCode}
                  alt="QR Code thanh toán"
                  width={220}
                  height={220}
                  unoptimized
                  className="block rounded-xl"
                />
              </div>
            ) : (
              <div className="w-[220px] h-[220px] flex flex-col items-center justify-center gap-3 text-[#8B7355] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E0D4]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#C8A97E]" />
                <span className="text-xs font-bold">Đang tạo mã...</span>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-2xl border border-[#E8E0D4] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E8E0D4] flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[#C8A97E]" />
            <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Hoặc chuyển khoản thủ công</h3>
          </div>

          <div className="divide-y divide-[#F0EBE3]">
            {/* Bank name */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-0.5">Ngân hàng</p>
                <p className="text-sm font-bold text-[#2C1E12]">{qrData?.bankName || qrData?.bankCode}</p>
              </div>
            </div>

            {/* Account number */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-0.5">Số tài khoản</p>
                <p className="text-lg font-bold text-[#2C1E12] tracking-wider">{qrData?.bankAccount}</p>
              </div>
              <button
                onClick={() => copyToClipboard(qrData?.bankAccount || '', 'account')}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer border',
                  copiedField === 'account'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-[#FAF8F5] border-[#E8E0D4] text-[#8B7355] hover:border-[#C8A97E] hover:text-[#C8A97E]'
                )}
              >
                {copiedField === 'account' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Transfer content */}
            <div className="px-5 py-3.5 flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <p className="text-[10px] font-bold text-[#C8A97E] uppercase tracking-wider mb-0.5">
                  Nội dung chuyển khoản <span className="text-red-400">(bắt buộc)</span>
                </p>
                <p className="text-lg font-bold text-[#2C1E12]">{booking?.bookingCode}</p>
              </div>
              <button
                onClick={() => booking && copyToClipboard(booking.bookingCode, 'content')}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer border',
                  copiedField === 'content'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-white border-[#E8E0D4] text-[#8B7355] hover:border-[#C8A97E] hover:text-[#C8A97E]'
                )}
              >
                {copiedField === 'content' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Amount */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-0.5">Số tiền</p>
                <p className="text-lg font-bold text-[#C8A97E]">{formatPrice(depositAmount)}</p>
              </div>
              <button
                onClick={() => copyToClipboard(String(depositAmount), 'amount')}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer border',
                  copiedField === 'amount'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-[#FAF8F5] border-[#E8E0D4] text-[#8B7355] hover:border-[#C8A97E] hover:text-[#C8A97E]'
                )}
              >
                {copiedField === 'amount' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Checking status indicator */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-[#C8A97E] rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-[#C8A97E] rounded-full animate-pulse [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-[#C8A97E] rounded-full animate-pulse [animation-delay:0.4s]" />
          </div>
          <p className="text-xs font-medium text-[#8B7355]">Đang chờ xác nhận thanh toán...</p>
        </div>

        {/* Info + Actions */}
        <div className="space-y-3 pb-6">
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 flex gap-3 items-start">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Tiền cọc <strong>25%</strong> sẽ được khấu trừ khi thanh toán tại salon. Giao dịch được bảo mật bởi hệ thống.
            </p>
          </div>
          <button
            className="w-full py-3.5 text-[#5C4A32] bg-white hover:bg-[#F0EBE3] border border-[#E8E0D4] rounded-xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer"
            onClick={() => {
              reset();
              router.replace(`/my-bookings/${bookingId}`);
            }}
          >
            Thanh toán tại salon
          </button>
        </div>
      </div>
    </div>
  );
}
