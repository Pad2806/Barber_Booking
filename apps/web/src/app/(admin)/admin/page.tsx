'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Scissors,
  Loader2,
  Store,
} from 'lucide-react';
import { adminApi, DashboardStats } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'text-yellow-600', icon: Clock },
  CONFIRMED: { label: 'Đã xác nhận', color: 'text-blue-600', icon: CheckCircle },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'text-indigo-600', icon: TrendingUp },
  COMPLETED: { label: 'Hoàn thành', color: 'text-green-600', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: 'text-red-600', icon: XCircle },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
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
          onClick={fetchDashboard}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Đặt lịch hôm nay',
      value: stats?.todayBookings || 0,
      change: `${stats?.bookingGrowth || 0}%`,
      changeType: (stats?.bookingGrowth || 0) >= 0 ? 'positive' : 'negative',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Doanh thu tháng',
      value: stats?.monthRevenue || 0,
      isCurrency: true,
      change: `${stats?.revenueGrowth || 0}%`,
      changeType: (stats?.revenueGrowth || 0) >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Tổng người dùng',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Tổng salon',
      value: stats?.totalSalons || 0,
      icon: Store,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Tổng quan hoạt động kinh doanh</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div
                className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.change && (
                <span
                  className={cn(
                    'text-sm font-medium',
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {stat.changeType === 'positive' ? '+' : ''}
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stat.isCurrency ? formatPrice(stat.value as number) : stat.value.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Đặt lịch gần đây</h2>
            <Link href="/admin/bookings" className="text-accent text-sm hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Mã</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Khách hàng
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Salon</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats?.recentBookings?.length ? (
                  stats.recentBookings.map((booking: any) => {
                    const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-sm">{booking.bookingCode}</td>
                        <td className="px-6 py-4 font-medium">{booking.customer?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">{booking.salon?.name || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-sm font-medium',
                              statusConfig.color
                            )}
                          >
                            <statusConfig.icon className="w-4 h-4" />
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Chưa có đặt lịch
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
          <div className="space-y-3">
            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Quản lý đặt lịch</span>
            </Link>
            <Link
              href="/admin/staff"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Quản lý nhân viên</span>
            </Link>
            <Link
              href="/admin/services"
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Scissors className="w-5 h-5" />
              <span className="font-medium">Quản lý dịch vụ</span>
            </Link>
          </div>
          {(stats?.pendingBookings || 0) > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {stats?.pendingBookings} đặt lịch chờ xác nhận
                  </p>
                  <Link
                    href="/admin/bookings?status=PENDING"
                    className="text-sm text-yellow-600 hover:underline"
                  >
                    Xem ngay →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-gray-500 text-sm mb-2">Tổng đặt lịch</h3>
          <p className="text-3xl font-bold text-gray-800">
            {stats?.totalBookings?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Tất cả thời gian</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-gray-500 text-sm mb-2">Đặt lịch tháng này</h3>
          <p className="text-3xl font-bold text-gray-800">
            {stats?.monthBookings?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-green-600 mt-1">
            {stats?.bookingGrowth && stats.bookingGrowth > 0 ? '+' : ''}
            {stats?.bookingGrowth || 0}% so với tháng trước
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-gray-500 text-sm mb-2">Chờ xử lý</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stats?.pendingBookings?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Cần xác nhận</p>
        </div>
      </div>
    </div>
  );
}
