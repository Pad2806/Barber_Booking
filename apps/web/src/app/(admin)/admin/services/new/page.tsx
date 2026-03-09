'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { SERVICE_CATEGORIES } from '@/lib/utils';

export default function NewServicePage() {
  const router = useRouter();
  const [salons, setSalons] = useState<{ id: string; name: string }[]>([]);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: 'HAIRCUT',
    isActive: true,
    salonId: '',
  });

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      const data = await adminApi.getAllSalons({ take: 100 });
      setSalons(data.data || []);
      if (data.data?.length > 0) {
        setFormData(prev => ({ ...prev, salonId: data.data[0].id }));
      }
    } catch (err) {
      toast.error('Không thể tải danh sách chi nhánh');
    } finally {
      setLoadingSalons(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.duration || !formData.salonId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.createService({
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category,
        isActive: formData.isActive,
        salonId: formData.salonId,
      });
      toast.success('Tạo dịch vụ thành công!');
      router.push('/admin/services');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tạo dịch vụ thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/services" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-800">Thêm dịch vụ mới</h1>
          <p className="text-gray-500">Tạo dịch vụ mới cho salon</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên dịch vụ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Cắt tóc nam"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Mô tả chi tiết về dịch vụ..."
              rows={4}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="100000"
                min="0"
                step="1000"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian (phút) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="30"
                min="1"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
              >
                {Object.entries(SERVICE_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Salon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chi nhánh <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.salonId}
                onChange={e => setFormData({ ...formData, salonId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                required
                disabled={loadingSalons}
              >
                {loadingSalons ? (
                  <option>Đang tải chi nhánh...</option>
                ) : (
                  salons.map(salon => (
                    <option key={salon.id} value={salon.id}>
                      {salon.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-accent rounded focus:ring-2 focus:ring-accent"
                />
                <span className="text-sm text-gray-700">Đang hoạt động</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Tạo dịch vụ
                </>
              )}
            </button>
            <Link
              href="/admin/services"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
