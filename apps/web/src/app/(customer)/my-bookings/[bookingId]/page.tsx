'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeft, MapPin, Calendar, Clock, User, Scissors, Phone, XCircle } from 'lucide-react';
import { bookingApi, Booking } from '@/lib/api';
import {
  formatPrice,
  formatDate,
  formatDateTime,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  cn,
} from '@/lib/utils';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const totalPaid = booking?.payments
    ? booking.payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0)
    : 0;
  
  const remainingAmount = booking ? Math.max(0, booking.totalAmount - totalPaid) : 0;

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getById(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-bookings');
      return;
    }
    if (status === 'authenticated' && bookingId) {
      void fetchBooking();
    }
  }, [status, bookingId, router, fetchBooking]);

  const handleCancel = async () => {
    if (!booking) return;
    try {
      setCancelling(true);
      await bookingApi.cancel(booking.id, cancelReason);
      setShowCancelModal(false);
      await fetchBooking();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setCancelling(false);
    }
  };

  const canCancel =
    booking &&
    ['PENDING', 'CONFIRMED'].includes(booking.status) &&
    new Date(booking.date) > new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-semibold mb-2">Không tìm thấy lịch hẹn</h2>
        <Link href="/my-bookings" className="text-accent hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/my-bookings')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay lại
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Booking Code */}
        <div className="bg-accent text-white rounded-2xl p-6 text-center mb-6">
          <p className="text-white/80 mb-1">Mã đặt lịch</p>
          <p className="text-3xl font-bold font-mono">{booking.bookingCode}</p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium',
                  BOOKING_STATUS[booking.status]?.color || 'bg-gray-100'
                )}
              >
                {BOOKING_STATUS[booking.status]?.label || booking.status}
              </span>
              <span
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium',
                  PAYMENT_STATUS[booking.paymentStatus]?.color || 'bg-gray-100'
                )}
              >
                {PAYMENT_STATUS[booking.paymentStatus]?.label || booking.paymentStatus}
              </span>
            </div>
            <p className="text-sm text-gray-400">Đặt lúc: {formatDateTime(booking.createdAt)}</p>
          </div>
        </div>

        {/* Salon Info */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">{booking.salon.name}</h2>
          <div className="space-y-3">
            <p className="text-gray-600 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              {booking.salon.address}
            </p>
            <a
              href={`tel:${booking.salon.phone}`}
              className="text-accent flex items-center gap-2 hover:underline"
            >
              <Phone className="w-5 h-5" />
              {booking.salon.phone}
            </a>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h3 className="font-semibold mb-4">Thời gian</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
              <Calendar className="w-6 h-6 text-accent" />
              <div>
                <p className="text-sm text-gray-500">Ngày</p>
                <p className="font-semibold">{formatDate(booking.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
              <Clock className="w-6 h-6 text-accent" />
              <div>
                <p className="text-sm text-gray-500">Giờ</p>
                <p className="font-semibold">
                  {booking.timeSlot} - {booking.endTime}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Staff */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h3 className="font-semibold mb-4">Stylist</h3>
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <User className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="font-semibold">{booking.staff?.user.name || 'Bất kỳ Stylist'}</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h3 className="font-semibold mb-4">Dịch vụ ({booking.services.length})</h3>
          <div className="space-y-4">
            {booking.services.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Scissors className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{item.service.name}</p>
                    <p className="text-sm text-gray-400">{item.duration} phút</p>
                  </div>
                </div>
                <p className="font-semibold">{formatPrice(item.price)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <p>Tổng thời gian</p>
              <p><strong>{booking.totalDuration} phút</strong></p>
            </div>
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-700">Tổng tiền dịch vụ</p>
              <p className="font-medium">{formatPrice(booking.totalAmount)}</p>
            </div>
            {totalPaid > 0 && (
              <div className="flex justify-between items-center text-teal-600">
                <p className="text-sm">Đã đặt cọc</p>
                <p className="font-medium">-{formatPrice(totalPaid)}</p>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-gray-200">
              <p className="font-semibold text-lg text-gray-800">Cần thanh toán tại quầy</p>
              <p className="text-2xl font-bold text-accent">{formatPrice(remainingAmount)}</p>
            </div>
          </div>
        </div>

        {/* Note */}
        {booking.note && (
          <div className="bg-white rounded-2xl p-6 mb-4">
            <h3 className="font-semibold mb-2">Ghi chú</h3>
            <p className="text-gray-600">{booking.note}</p>
          </div>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Hủy lịch hẹn
          </button>
        )}

        {/* Payment button for unpaid */}
        {(booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'PENDING') &&
          ['PENDING', 'CONFIRMED'].includes(booking.status) && (
            <Link
              href={`/payment/${booking.id}`}
              className="block mt-6 w-full py-4 bg-accent text-white rounded-xl font-semibold text-center hover:bg-accent/90 transition-colors shadow-lg"
            >
              Thanh toán cọc (50%) ngay
            </Link>
          )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Hủy lịch hẹn</h3>
            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn hủy lịch hẹn này?</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Lý do hủy (không bắt buộc)"
              rows={3}
              className="w-full p-3 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={cn(
                  'flex-1 py-3 bg-red-500 text-white rounded-xl font-medium transition-colors',
                  cancelling ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                )}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
