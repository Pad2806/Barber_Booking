'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatPrice, formatDate, BOOKING_STATUS } from '@/lib/utils';
import { adminApi, type AdminBookingDetail } from '@/lib/api';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getBookingById(bookingId);
      setBooking(data);
    } catch (error: any) {
      toast.error('Không thể tải thông tin đặt lịch');
      router.push('/admin/bookings');
    } finally {
      setLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    void fetchBooking();
  }, [fetchBooking]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!booking) return;
    try {
      setUpdating(true);
      await adminApi.updateBookingStatus(bookingId, newStatus);
      toast.success('Cập nhật trạng thái thành công!');
      await fetchBooking();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">Không tìm thấy thông tin đặt lịch</p>
        <Link href="/admin/bookings" className="text-accent hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const statusConfig = BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS] || {
    label: booking.status,
    color: 'gray',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/bookings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-800">
              Chi tiết đặt lịch #{booking.bookingCode}
            </h1>
            <p className="text-gray-500">Quản lý thông tin đặt lịch</p>
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium bg-${statusConfig.color}-50 text-${statusConfig.color}-600`}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Họ tên</p>
                  <p className="font-medium">{booking.customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium">{booking.customer.phone}</p>
                </div>
              </div>
              {booking.customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{booking.customer.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Salon & Staff Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin dịch vụ</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Salon</p>
                  <p className="font-medium">{booking.salon.name}</p>
                  <p className="text-sm text-gray-600">{booking.salon.address}</p>
                </div>
              </div>
              {booking.staff && booking.staff.user?.name && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {booking.staff.user.avatar ? (
                      <Image
                        src={booking.staff.user.avatar}
                        alt={booking.staff.user.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent font-semibold">
                        {booking.staff.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stylist</p>
                    <p className="font-medium">{booking.staff.user.name}</p>
                    <p className="text-xs text-gray-500">{booking.staff.position}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Dịch vụ đã chọn</h2>
            <div className="space-y-3">
              {booking.services && booking.services.length > 0 ? (
                booking.services.map((bs, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{bs.service.name}</p>
                      <p className="text-sm text-gray-500">{bs.duration} phút</p>
                    </div>
                    <p className="font-semibold text-accent">{formatPrice(bs.price)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Chưa có dịch vụ nào</p>
              )}
              <div className="flex justify-between items-center pt-3 border-t-2">
                <p className="font-semibold text-lg">Tổng cộng</p>
                <p className="font-bold text-xl text-accent">{formatPrice(booking.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Note */}
          {booking.note && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Ghi chú</h2>
              <p className="text-gray-600">{booking.note}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Time */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Thời gian</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-gray-500">Ngày đặt</p>
                  <p className="font-medium">{formatDate(booking.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-gray-500">Giờ</p>
                  <p className="font-medium">{booking.timeSlot}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Thanh toán</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phương thức</p>
                  <p className="font-medium">
                    {booking.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full ${booking.paymentStatus === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <p className="font-medium">
                    {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Hành động</h2>
            <div className="space-y-2">
              {booking.status === 'PENDING' && (
                <button
                  onClick={() => handleUpdateStatus('CONFIRMED')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Xác nhận
                </button>
              )}
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Bắt đầu dịch vụ
                </button>
              )}
              {booking.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Hoàn thành
                </button>
              )}
              {!['CANCELLED', 'COMPLETED'].includes(booking.status) && (
                <button
                  onClick={() => handleUpdateStatus('CANCELLED')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Hủy lịch
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
