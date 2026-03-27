'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { salonApi } from '@/lib/api';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/ImageUpload';
import { slugify } from '@/lib/utils';

export default function NewSalonPage(): React.JSX.Element {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    city: 'Hồ Chí Minh',
    district: '',
    ward: '',
    phone: '',
    email: '',
    openTime: '08:30',
    closeTime: '20:30',
    bankCode: '',
    bankAccount: '',
    bankName: '',
    logo: '',
    coverImage: '',
    isActive: true,
  });

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.address || !formData.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setSubmitting(true);
      await salonApi.create(formData as any);
      toast.success('Tạo chi nhánh thành công!');
      router.push('/admin/salons');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tạo chi nhánh thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/salons" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thêm chi nhánh mới</h1>
          <p className="text-gray-500">Tạo cơ sở mới trong hệ thống</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h3 className="font-semibold text-lg border-b pb-4">Thông tin cơ bản</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên chi nhánh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Reetro Barber Quận 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-gray-50"
                  placeholder="reetro-barber-q1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0901234567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Giới thiệu về chi nhánh..."
                rows={4}
              />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h3 className="font-semibold text-lg border-b pb-4">Địa chỉ</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="123 Nguyễn Huệ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh / Thành phố</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Hồ Chí Minh"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quận / Huyện</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Quận 1"
                />
              </div>
            </div>
          </div>

          {/* Business Hours & Payment */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="font-semibold text-lg border-b pb-4">Giờ hoạt động</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mở cửa</label>
                    <input
                      type="time"
                      value={formData.openTime}
                      onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Đóng cửa</label>
                    <input
                      type="time"
                      value={formData.closeTime}
                      onChange={e => setFormData({ ...formData, closeTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-semibold text-lg border-b pb-4">Thanh toán (QR)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngân hàng</label>
                    <input
                      type="text"
                      value={formData.bankCode}
                      onChange={e => setFormData({ ...formData, bankCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="VCB, MB, VIB..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số tài khoản</label>
                    <input
                      type="text"
                      value={formData.bankAccount}
                      onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h3 className="font-semibold text-lg border-b pb-4">Hình ảnh</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <ImageUpload
                value={formData.logo}
                onChange={url => setFormData({ ...formData, logo: url })}
                variant="avatar"
                folder="salons"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh bìa</label>
              <ImageUpload
                value={formData.coverImage}
                onChange={url => setFormData({ ...formData, coverImage: url })}
                variant="cover"
                folder="salons"
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h3 className="font-semibold text-lg border-b pb-4">Trạng thái</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-accent rounded focus:ring-2 focus:ring-accent"
              />
              <span className="text-gray-700">Đang hoạt động</span>
            </label>
            <p className="text-xs text-gray-500 italic">
              Nếu tắt, khách hàng sẽ không thể đặt lịch tại chi nhánh này.
            </p>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tạo chi nhánh...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Tạo chi nhánh
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
