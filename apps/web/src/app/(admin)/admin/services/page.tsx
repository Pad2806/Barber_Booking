'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, MoreVertical, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { formatPrice, SERVICE_CATEGORIES, cn } from '@/lib/utils';
import { adminApi } from '@/lib/api';

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  category: string;
  isActive: boolean;
  totalBookings: number;
  salon: { id: string; name: string };
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { take: 100 };
      if (categoryFilter !== 'ALL') {
        params.category = categoryFilter;
      }
      const data = await adminApi.getAllServices(params);
      setServices((data.data || []) as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) return;
    try {
      await adminApi.deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      setSelectedService(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa dịch vụ');
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Group by category
  const groupedServices = filteredServices.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, ServiceItem[]>
  );

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
          onClick={fetchServices}
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
          <h1 className="text-2xl font-heading font-bold text-gray-800">Quản lý dịch vụ</h1>
          <p className="text-gray-500">Quản lý bảng giá và dịch vụ</p>
        </div>
        <Link
          href="/admin/services/new"
          className="bg-accent text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm dịch vụ
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm dịch vụ..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="ALL">Tất cả danh mục</option>
          {Object.entries(SERVICE_CATEGORIES).map(([key, value]) => (
            <option key={key} value={key}>
              {value.icon} {value.label}
            </option>
          ))}
        </select>
      </div>

      {/* Services by Category */}
      {Object.keys(groupedServices).length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">✂️</div>
          <p className="text-gray-500">Không tìm thấy dịch vụ nào</p>
        </div>
      ) : (
        Object.entries(groupedServices).map(([category, categoryServices]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                {SERVICE_CATEGORIES[category]?.icon}
                {SERVICE_CATEGORIES[category]?.label || category}
                <span className="text-sm font-normal text-gray-500">
                  ({categoryServices.length} dịch vụ)
                </span>
              </h2>
            </div>
            <div className="divide-y">
              {categoryServices.map(service => (
                <div
                  key={service.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-accent font-semibold">
                        {formatPrice(service.price)}
                      </span>
                      <span className="text-sm text-gray-400">⏱ {service.duration} phút</span>
                      <span className="text-sm text-gray-400">
                        📅 {service.totalBookings} đặt lịch
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        service.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}
                    >
                      {service.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                    </span>

                    <div className="relative">
                      <button
                        onClick={() =>
                          setSelectedService(selectedService === service.id ? null : service.id)
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>

                      {selectedService === service.id && (
                        <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[150px]">
                          <Link
                            href={`/admin/services/${service.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Chỉnh sửa
                          </Link>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
