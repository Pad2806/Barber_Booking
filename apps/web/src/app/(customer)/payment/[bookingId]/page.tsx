'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Copy, Check, RefreshCw, QrCode } from 'lucide-react';
import { bookingApi, paymentApi, Booking } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, cn } from '@/lib/utils';

export default function PaymentPage() {
  const params = useParams();
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
            Thanh toán thành công!
          </h1>
          <p className="text-gray-500 mb-6">
            Cảm ơn bạn đã đặt lịch. Thông tin chi tiết đã được gửi về email/điện thoại của bạn.
          </p>
          {booking && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-500 mb-2">Mã đặt lịch</p>
              <p className="text-xl font-bold text-accent">{booking.bookingCode}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Link
              href={`/my-bookings/${bookingId}`}
              className="bg-accent text-white py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
            >
              Xem chi tiết đặt lịch
            </Link>
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
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          {/* Header */}
          <div className="bg-accent p-6 text-white text-center">
            <QrCode className="w-12 h-12 mx-auto mb-2" />
            <h1 className="text-2xl font-heading font-bold">Quét mã để thanh toán</h1>
            <p className="text-white/80 mt-1">Sử dụng App ngân hàng để quét</p>
          </div>

          {/* QR Code */}
          <div className="p-8 text-center">
            {/* Countdown */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Clock
                className={cn('w-5 h-5', countdown <= 60 ? 'text-red-500' : 'text-gray-400')}
              />
              <span
                className={cn('font-medium', countdown <= 60 ? 'text-red-500' : 'text-gray-600')}
              >
                Còn lại: {formatTime(countdown)}
              </span>
            </div>

            {qrData?.qrCode && (
              <div className="bg-white p-4 rounded-2xl inline-block shadow-sm border mb-6">
                <Image src={qrData.qrCode} alt="QR Code" width={256} height={256} unoptimized />
              </div>
            )}

            {/* Amount */}
            <div className="mb-6">
              <p className="text-gray-500 mb-1">Số tiền thanh toán</p>
              <p className="text-3xl font-bold text-accent">
                {formatPrice(qrData?.amount || booking?.totalAmount || 0)}
              </p>
            </div>

            {/* Bank Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ngân hàng</span>
                <span className="font-medium">{qrData?.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số tài khoản</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium font-mono">{qrData?.bankAccount}</span>
                  <button
                    onClick={() => copyToClipboard(qrData?.bankAccount || '')}
                    className="text-accent hover:text-accent/80"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {booking && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Nội dung CK</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium font-mono">{booking.bookingCode}</span>
                    <button
                      onClick={() => copyToClipboard(booking.bookingCode)}
                      className="text-accent hover:text-accent/80"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Đang chờ thanh toán...
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-yellow-50 p-4 text-center">
            <p className="text-sm text-yellow-700">
              💡 Sau khi thanh toán, hệ thống sẽ tự động xác nhận trong vài giây
            </p>
          </div>
        </div>

        {/* Cancel */}
        <div className="text-center mt-6">
          <Link href="/salons" className="text-gray-500 hover:text-gray-700 transition-colors">
            Hủy và đặt lịch mới
          </Link>
        </div>
      </div>
    </div>
  );
}
