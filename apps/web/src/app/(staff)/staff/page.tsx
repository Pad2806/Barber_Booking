'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Star,
  TrendingUp,
  Scissors,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TodayBooking {
  id: string;
  bookingCode: string;
  timeSlot: string;
  status: string;
  totalAmount: number;
  customer: {
    name: string;
    phone: string;
  };
  services: Array<{
    service: {
      name: string;
    };
  }>;
}

interface StaffStats {
  todayBookings: number;
  completedToday: number;
  todayRevenue: number;
  monthRevenue: number;
  rating: number;
  totalReviews: number;
}

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'bg-purple-100 text-purple-800', icon: Scissors },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function StaffDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<TodayBooking[]>([]);
  const [stats, setStats] = useState<StaffStats>({
    todayBookings: 0,
    completedToday: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    rating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/staff');
      return;
    }
    if (status === 'authenticated') {
      fetchStaffData();
    }
  }, [status, router]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      // Mock data - Replace with actual API calls
      // const response = await apiClient.get('/staff/my-bookings/today');
      // setBookings(response.data);

      // For now, show empty state
      setBookings([]);
      setStats({
        todayBookings: 0,
        completedToday: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        rating: 4.8,
        totalReviews: 156,
      });
    } catch (error) {
      console.error('Failed to fetch staff data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công!');
      fetchStaffData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-heading font-bold text-primary">
                Reetro<span className="text-accent">Staff</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Xin chào, <span className="font-semibold text-gray-900">{session?.user?.name}</span>
              </span>
              <Link href="/profile" className="text-gray-600 hover:text-primary transition-colors">
                Hồ sơ
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Dashboard Stylist</h1>
          <p className="text-gray-600">Quản lý lịch làm việc và khách hàng của bạn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.todayBookings}</span>
            </div>
            <p className="text-gray-600 text-sm">Lịch hôm nay</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.completedToday}</span>
            </div>
            <p className="text-gray-600 text-sm">Đã hoàn thành</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(stats.monthRevenue)}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Doanh thu tháng</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">{stats.rating}</span>
                <span className="text-sm text-gray-500 ml-1">({stats.totalReviews})</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm">Đánh giá</p>
          </div>
        </div>

        {/* Today's Bookings */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-heading font-bold text-gray-900">Lịch làm việc hôm nay</h2>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Chưa có lịch hẹn nào hôm nay</p>
              <p className="text-sm text-gray-400">
                Các lịch hẹn sẽ hiển thị ở đây khi có khách đặt
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {bookings.map(booking => {
                const StatusIcon =
                  STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;
                const statusClass =
                  STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG]?.color ||
                  'bg-gray-100 text-gray-800';

                return (
                  <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {booking.timeSlot}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass} flex items-center gap-1`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG]?.label}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-1">
                          <User className="w-4 h-4 inline mr-2" />
                          {booking.customer.name} • {booking.customer.phone}
                        </p>
                        <p className="text-sm text-gray-500">
                          Mã: <span className="font-mono font-semibold">{booking.bookingCode}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-accent mb-1">
                          {formatPrice(booking.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Dịch vụ:</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.services.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
                          >
                            {item.service.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {booking.status === 'CONFIRMED' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'IN_PROGRESS')}
                          className="flex-1 bg-accent hover:bg-accent/90 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          Bắt đầu
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                          className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    )}

                    {booking.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Hoàn thành
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
