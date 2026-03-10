'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, MapPin, Phone, Clock, Star, Users, Scissors, Calendar, TrendingUp, Edit } from 'lucide-react';
import { salonApi, apiClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SalonDetailPage() {
  const params = useParams();
  const salonId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [salonData, statsData] = await Promise.all([
        salonApi.getById(salonId),
        apiClient.get(`/salons/${salonId}/stats`).then(res => res.data)
      ]);
      setSalon(salonData);
      setStats(statsData);
    } catch (error: any) {
      toast.error('Không thể tải thông tin chi nhánh');
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);




  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!salon) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/salons" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{salon.name}</h1>
            <p className="text-gray-500">Chi tiết chi nhánh và thống kê</p>
          </div>
        </div>
        <Link
          href={`/admin/salons/${salon.id}/edit`}
          className="bg-accent text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-accent/90 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Chỉnh sửa chi nhánh
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lịch hôm nay</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.todayBookings || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Doanh thu tháng</p>
              <p className="text-2xl font-bold text-gray-800">{formatPrice(stats?.monthRevenue || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
              <Star className="w-6 h-6 fill-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đánh giá TB</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng khách hàng</p>
              <p className="text-2xl font-bold text-gray-800">{salon._count?.bookings || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="relative h-48">
              {salon.coverImage ? (
                <Image src={salon.coverImage} className="w-full h-full object-cover" alt={salon.name} fill />
              ) : (
                <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                  <Scissors className="w-12 h-12 text-accent/20" />
                </div>
              )}
              {salon.logo && (
                <div className="absolute -bottom-6 left-6 w-20 h-20 rounded-xl border-4 border-white overflow-hidden shadow-lg bg-white">
                  <Image src={salon.logo} className="w-full h-full object-cover" alt="Logo" fill />
                </div>
              )}
            </div>
            <div className="p-6 pt-10 space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-gray-600">{salon.address}, {salon.district}, {salon.city}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                  <p className="text-gray-600">{salon.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                  <p className="text-gray-600">{salon.openTime} - {salon.closeTime}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Trạng thái</p>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  salon.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {salon.isActive ? 'Đang hoạt động' : 'Tạm đóng'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Đội ngũ nhân viên ({salon.staff?.length || 0})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salon.staff?.map((s: any) => (
                <Link 
                  key={s.id} 
                  href={`/admin/staff?action=view&id=${s.id}`}
                  className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    {s.user.avatar ? (
                      <Image src={s.user.avatar} className="w-full h-full object-cover" alt={s.user.name} fill />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                        {s.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{s.user.name}</p>
                    <p className="text-xs text-gray-500">{s.position}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-accent" />
              Dịch vụ tiêu biểu ({salon.services?.length || 0})
            </h3>
            <div className="space-y-3">
              {salon.services?.slice(0, 5).map((service: any) => (
                <div key={service.id} className="flex items-center justify-between p-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-gray-500">{service.duration} phút</p>
                  </div>
                  <p className="font-bold text-accent">{formatPrice(service.price)}</p>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/admin/services" className="text-accent text-sm font-medium hover:underline">
                  Quản lý tất cả dịch vụ →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

