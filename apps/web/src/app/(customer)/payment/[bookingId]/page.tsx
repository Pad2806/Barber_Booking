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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {/* Header */}
          <div className="bg-accent p-6 text-white text-center">
            <QrCode className="w-12 h-12 mx-auto mb-2" />
            <h1 className="text-2xl font-heading font-bold">Quét mã để thanh toán</h1>
            <p className="text-white/80 mt-1">Sử dụng App ngân hàng để quét</p>
          </div>

          {/* QR Code Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Mã đặt lịch</p>
              <p className="font-semibold text-gray-800">{booking?.bookingCode}</p>
            </div>

            <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
              {/* Amount */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Số tiền đặt cọc (50%)</p>
                <p className="text-3xl font-bold text-accent">
                  {formatPrice(qrData?.amount || (booking?.totalAmount ? booking.totalAmount * 0.5 : 0))}
                </p>
              </div>

              {/* QR Image */}
              {qrData?.qrCode && (
                <div className="bg-white p-3 rounded-2xl border border-gray-100 inline-block mb-6 shadow-sm">
                  <Image src={qrData.qrCode} alt="QR Code" width={224} height={224} unoptimized className="block" />
                </div>
              )}

              {/* Bank Info */}
              {qrData && (
                <div className="bg-gray-50/80 rounded-xl p-4 space-y-3 text-left">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Ngân hàng</span>
                    <span className="font-semibold">{qrData?.bankName || qrData?.bankCode}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Số tài khoản</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono">{qrData?.bankAccount}</span>
                      <button
                        onClick={() => copyToClipboard(qrData?.bankAccount || '')}
                        className="text-accent hover:text-accent/80 p-1"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {booking && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Nội dung chuyển khoản</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono text-accent">{booking.bookingCode}</span>
                        <button
                          onClick={() => copyToClipboard(booking.bookingCode)}
                          className="text-accent hover:text-accent/80 p-1"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 mb-1">Thời gian còn lại</p>
                <div className="flex items-center justify-center gap-2">
                  <Clock
                    className={cn('w-4 h-4', countdown <= 60 ? 'text-red-500' : 'text-accent')}
                  />
                  <span
                    className={cn('text-xl font-bold font-mono', countdown <= 60 ? 'text-red-500' : 'text-accent')}
                  >
                    {formatTime(countdown)}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Đang chờ xác nhận thanh toán...</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <span className="text-xs font-bold">i</span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">Hướng dẫn thanh toán</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>1. Mở ứng dụng ngân hàng của bạn</li>
                <li>2. Quét mã QR phía trên</li>
                <li>3. Kiểm tra thông tin và xác nhận chuyển khoản</li>
                <li>4. Hệ thống sẽ tự động xác nhận sau khi nhận được tiền</li>
              </ul>
            </div>

            {/* Pay Later */}
            <div className="mt-6">
              <button 
                className="block w-full text-center py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                onClick={() => {
                  reset();
                  router.replace(`/my-bookings/${bookingId}`);
                }}
              >
                Thanh toán sau tại salon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
