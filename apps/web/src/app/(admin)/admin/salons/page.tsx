'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Plus,
  MapPin,
  Phone,
  Clock,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminApi } from '@/lib/api';

interface SalonData {
  id: string;
  name: string;
  slug: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  openTime: string;
  closeTime: string;
  rating: number;
  isActive: boolean;
  coverImage: string | null;
  _count: {
    staff: number;
    services: number;
    bookings: number;
  };
}

export default function AdminSalonsPage() {
  const [salons, setSalons] = useState<SalonData[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSalon, setSelectedSalon] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllSalons({ take: 100 });
      setSalons((data.data || []) as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(
    salon =>
      salon.name?.toLowerCase().includes(search.toLowerCase()) ||
      salon.address?.toLowerCase().includes(search.toLowerCase()) ||
      salon.district?.toLowerCase().includes(search.toLowerCase())
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
          onClick={fetchSalons}
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
          <h1 className="text-2xl font-heading font-bold text-gray-800">Quản lý chi nhánh</h1>
          <p className="text-gray-500">Quản lý thông tin các salon</p>
        </div>
        <Link
          href="/admin/salons/new"
          className="bg-accent text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm chi nhánh
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm chi nhánh..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Salons Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSalons.map(salon => (
          <div key={salon.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
            {/* Cover Image */}
            <div className="relative h-40 bg-gradient-to-br from-accent/20 to-primary/20">
              {salon.coverImage && (
                <Image src={salon.coverImage} alt={salon.name} fill className="object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-xl font-semibold text-white">{salon.name}</h3>
              </div>

              {/* Actions Menu */}
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => setSelectedSalon(selectedSalon === salon.id ? null : salon.id)}
                  className="p-2 bg-white/90 hover:bg-white rounded-lg"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {selectedSalon === salon.id && (
                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[150px]">
                    <Link
                      href={`/admin/salons/${salon.id}`}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Xem chi tiết
                    </Link>
                    <Link
                      href={`/admin/salons/${salon.id}/edit`}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Chỉnh sửa
                    </Link>
                    <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full text-red-600">
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {salon.address}, {salon.district}
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {salon.phone}
                </p>
                <p className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {salon.openTime} - {salon.closeTime}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-500 font-semibold">
                    <Star className="w-4 h-4 fill-yellow-500" />
                    {salon.rating?.toFixed(1) || '0.0'}
                  </div>
                  <p className="text-xs text-gray-500">Đánh giá</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">{salon._count?.staff || 0}</p>
                  <p className="text-xs text-gray-500">Nhân viên</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800">{salon._count?.bookings || 0}</p>
                  <p className="text-xs text-gray-500">Đặt lịch</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span
                  className={cn(
                    'text-sm font-medium',
                    salon.isActive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {salon.isActive ? '✅ Đang hoạt động' : '⚠️ Tạm đóng'}
                </span>
                <Link
                  href={`/salons/${salon.slug}`}
                  target="_blank"
                  className="text-sm text-accent hover:underline"
                >
                  Xem trang →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSalons.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-gray-500">Không tìm thấy chi nhánh nào</p>
        </div>
      )}
    </div>
  );
}
