'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Scissors,
  Check,
  AlertCircle,
} from 'lucide-react';
import { bookingApi } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, formatDate, cn } from '@/lib/utils';

export default function BookingConfirmPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
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
    reset,
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
        <Link href="/salons" className="bg-accent text-white px-6 py-3 rounded-xl font-medium">
          Quay lại chọn salon
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => prevStep()}
            className="flex items-center gap-2 text-gray-600 hover:text-primary"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay lại
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-heading font-bold mb-6">Xác nhận đặt lịch</h1>

        {/* Booking Summary */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Salon Info */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-2">{salon.name}</h2>
            <p className="text-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {salon.address}
            </p>
          </div>

          {/* Date & Time */}
          <div className="p-6 border-b">
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">Thời gian</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                <Calendar className="w-6 h-6 text-accent" />
                <div>
                  <p className="text-sm text-gray-500">Ngày</p>
                  <p className="font-semibold">{formatDate(selectedDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                <Clock className="w-6 h-6 text-accent" />
                <div>
                  <p className="text-sm text-gray-500">Giờ</p>
                  <p className="font-semibold">{selectedTimeSlot}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Staff */}
          <div className="p-6 border-b">
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">Stylist</h3>
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold">{selectedStaff?.user.name || 'Bất kỳ Stylist'}</p>
                <p className="text-sm text-gray-500">
                  {selectedStaff ? 'Đã chọn' : 'Hệ thống tự động chọn'}
                </p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="p-6 border-b">
            <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">
              Dịch vụ ({selectedServices.length})
            </h3>
            <div className="space-y-3">
              {selectedServices.map(service => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Scissors className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-400">{service.duration} phút</p>
                    </div>
                  </div>
                  <p className="font-semibold">{formatPrice(service.price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {note && (
            <div className="p-6 border-b">
              <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Ghi chú</h3>
              <p className="text-gray-600">{note}</p>
            </div>
          )}

          {/* Total */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Tổng thời gian</p>
                <p className="font-medium">{totalDuration} phút</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Tổng thanh toán</p>
                <p className="text-2xl font-bold text-accent">{formatPrice(totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Login Notice */}
        {status !== 'authenticated' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Bạn chưa đăng nhập</p>
              <p className="text-sm text-yellow-600">
                Nhấn &quot;Xác nhận &amp; Thanh toán&quot; để đăng nhập trước khi hoàn tất đặt lịch
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Confirm Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="container mx-auto">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
              loading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-accent hover:bg-accent/90 text-white'
            )}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Xác nhận & Thanh toán
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
