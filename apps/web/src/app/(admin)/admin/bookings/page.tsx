'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatPrice, formatDate, BOOKING_STATUS, cn } from '@/lib/utils';
import { adminApi } from '@/lib/api';

interface Booking {
  id: string;
  bookingCode: string;
  customer: { name: string; phone: string };
  salon: { name: string };
  staff: { name: string } | null;
  services: { name: string }[];
  bookingDate: string;
  timeSlot: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const data = await adminApi.getAllBookings(params);
      setBookings((data as any).bookings || data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách đặt lịch');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.bookingCode?.toLowerCase().includes(search.toLowerCase()) ||
      booking.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.customer?.phone?.includes(search);
    return matchesSearch;
  });

  const handleConfirm = async (bookingId: string) => {
    try {
      await adminApi.updateBookingStatus(bookingId, 'CONFIRMED');
      setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b)));
      setSelectedBooking(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xác nhận đặt lịch');
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await adminApi.updateBookingStatus(bookingId, 'CANCELLED');
      setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b)));
      setSelectedBooking(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể hủy đặt lịch');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-800">Quản lý đặt lịch</h1>
          <p className="text-gray-500">Xem và quản lý tất cả đặt lịch</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo mã, tên, SĐT..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(BOOKING_STATUS).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Mã đặt lịch
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Khách hàng
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Chi nhánh / Stylist
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Thời gian</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Dịch vụ</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Tổng tiền</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Trạng thái
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium text-accent">{booking.bookingCode}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{booking.customer.name}</p>
                    <p className="text-sm text-gray-500">{booking.customer.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{booking.salon.name}</p>
                    <p className="text-sm text-gray-500">
                      {booking.staff?.name || 'Chưa chỉ định'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="flex items-center gap-1 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(booking.bookingDate)}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {booking.timeSlot}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">
                      {booking.services?.map(s => s.name || s).join(', ') || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{formatPrice(booking.totalAmount)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        BOOKING_STATUS[booking.status]?.color || 'bg-gray-100'
                      )}
                    >
                      {BOOKING_STATUS[booking.status]?.label || booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setSelectedBooking(selectedBooking === booking.id ? null : booking.id)
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>

                      {selectedBooking === booking.id && (
                        <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[150px]">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Xem chi tiết
                          </Link>
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleConfirm(booking.id)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full text-green-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Xác nhận
                              </button>
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full text-red-600"
                              >
                                <XCircle className="w-4 h-4" />
                                Hủy đặt lịch
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy đặt lịch nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
