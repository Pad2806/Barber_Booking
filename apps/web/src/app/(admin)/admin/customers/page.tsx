'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Loader2,
  AlertCircle,
  Users,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
} from 'lucide-react';
import { adminApi, apiClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
  _count?: {
    bookings: number;
  };
}

interface CustomerDetail extends Customer {
  bookings: Array<{
    id: string;
    bookingCode: string;
    date: string;
    timeSlot: string;
    totalAmount: number;
    status: string;
    salon: { name: string };
    services: Array<{ service: { name: string } }>;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Vắng mặt',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'bookings'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Detail panel
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getAllUsers({ take: 200, role: 'CUSTOMER', search: search || undefined });
      const users = (data as any).users || (data as any).data || [];
      setCustomers(users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchCustomers(), 300);
    return () => clearTimeout(timeout);
  }, [fetchCustomers]);

  const viewCustomerDetail = async (customerId: string) => {
    try {
      setDetailLoading(true);
      setShowDetail(true);
      const response = await apiClient.get(`/admin/users/${customerId}`);
      setSelectedCustomer(response.data);
    } catch (err: any) {
      toast.error('Không thể tải chi tiết khách hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '') * dir;
    if (sortBy === 'bookings') return ((a._count?.bookings || 0) - (b._count?.bookings || 0)) * dir;
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
  });

  // Stats
  const totalCustomers = customers.length;
  const newThisMonth = customers.filter(c => {
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalBookings = customers.reduce((sum, c) => sum + (c._count?.bookings || 0), 0);

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-3">
        <AlertCircle className="w-10 h-10" />
        <p>{error}</p>
        <button onClick={fetchCustomers} className="px-4 py-2 bg-accent text-white rounded-lg">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Quản lý khách hàng</h1>
        <p className="text-gray-500">Xem thông tin và lịch sử đặt lịch của khách hàng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalCustomers}</p>
            <p className="text-sm text-gray-500">Tổng khách hàng</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{newThisMonth}</p>
            <p className="text-sm text-gray-500">Khách mới tháng này</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalBookings}</p>
            <p className="text-sm text-gray-500">Tổng lượt đặt lịch</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-gray-700">
                    Khách hàng <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Liên hệ</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
                  <button onClick={() => toggleSort('bookings')} className="flex items-center gap-1 hover:text-gray-700 mx-auto">
                    Lượt đặt <SortIcon field="bookings" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-gray-700">
                    Ngày tham gia <SortIcon field="createdAt" />
                  </button>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Không tìm thấy khách hàng nào
                  </td>
                </tr>
              ) : (
                sortedCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold shrink-0">
                          {customer.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={customer.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            customer.name?.charAt(0) || '?'
                          )}
                        </div>
                        <span className="font-medium text-gray-800">{customer.name || 'Chưa cập nhật'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="w-3.5 h-3.5" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3.5 h-3.5" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-sm">
                        {customer._count?.bookings || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => viewCustomerDetail(customer.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-accent"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Slide Panel */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDetail(false)} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold">Chi tiết khách hàng</h2>
              <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : selectedCustomer ? (
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-2xl shrink-0">
                    {selectedCustomer.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedCustomer.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      selectedCustomer.name?.charAt(0) || '?'
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                    <div className="space-y-1 mt-1">
                      {selectedCustomer.email && (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> {selectedCustomer.email}
                        </p>
                      )}
                      {selectedCustomer.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone className="w-4 h-4" /> {selectedCustomer.phone}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Tham gia: {new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Booking History */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    Lịch sử đặt lịch ({selectedCustomer.bookings?.length || 0})
                  </h4>
                  {selectedCustomer.bookings?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Chưa có lịch đặt nào</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedCustomer.bookings?.map(booking => (
                        <div key={booking.id} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-mono text-sm font-semibold text-gray-700">
                                #{booking.bookingCode}
                              </span>
                              <p className="text-sm text-gray-500">{booking.salon?.name}</p>
                            </div>
                            <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600')}>
                              {STATUS_LABELS[booking.status] || booking.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(booking.date).toLocaleDateString('vi-VN')}
                            </span>
                            <span>{booking.timeSlot}</span>
                            <span className="ml-auto font-semibold text-gray-700">
                              {formatPrice(booking.totalAmount)}
                            </span>
                          </div>
                          {booking.services?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {booking.services.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                                  {s.service?.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
