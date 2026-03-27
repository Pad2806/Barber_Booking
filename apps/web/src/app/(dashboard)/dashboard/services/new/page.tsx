'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft, Loader2, Image as ImageIcon, Check, Store } from 'lucide-react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { SERVICE_CATEGORIES, cn } from '@/lib/utils';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import VideoUpload from '@/components/VideoUpload';
import { useQueryClient } from '@tanstack/react-query';

export default function NewServicePage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    selectedSalonIds: [] as string[],
    image: '',
    videoUrl: '',
    gallery: [] as string[],
  });

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      const data = await adminApi.getAllSalons({ limit: 100 });
      setSalons(data.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách chi nhánh');
    } finally {
      setLoadingSalons(false);
    }
  };

  const toggleSalon = (salonId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSalonIds: prev.selectedSalonIds.includes(salonId)
        ? prev.selectedSalonIds.filter(id => id !== salonId)
        : [...prev.selectedSalonIds, salonId],
    }));
  };

  const selectAllSalons = () => {
    setFormData(prev => ({
      ...prev,
      selectedSalonIds: prev.selectedSalonIds.length === salons.length
        ? []
        : salons.map(s => s.id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.duration) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.selectedSalonIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 chi nhánh');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category,
        isActive: formData.isActive,
        image: formData.image || undefined,
        videoUrl: formData.videoUrl || undefined,
        gallery: formData.gallery,
      };

      if (formData.selectedSalonIds.length === 1) {
        // Single salon — use original endpoint
        await adminApi.createService({
          ...payload,
          salonId: formData.selectedSalonIds[0],
        });
        toast.success('Tạo dịch vụ thành công!');
      } else {
        // Multiple salons — use bulk endpoint
        const result = await adminApi.bulkCreateService({
          ...payload,
          salonIds: formData.selectedSalonIds,
        });
        toast.success(`Đã tạo dịch vụ cho ${result.count} chi nhánh!`);
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
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
          <h1 className="text-2xl font-bold text-gray-800">Thêm dịch vụ mới</h1>
          <p className="text-gray-500">Tạo dịch vụ mới cho một hoặc nhiều chi nhánh</p>
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

          {/* ═══ Multi-Salon Selection ═══ */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Store className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Chi nhánh áp dụng <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={selectAllSalons}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {formData.selectedSalonIds.length === salons.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            {loadingSalons ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải chi nhánh...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {salons.map(salon => {
                  const isSelected = formData.selectedSalonIds.includes(salon.id);
                  return (
                    <button
                      key={salon.id}
                      type="button"
                      onClick={() => toggleSalon(salon.id)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0',
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-gray-300'
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{salon.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {formData.selectedSalonIds.length > 0 && (
              <p className="text-xs text-primary font-semibold mt-2">
                Đã chọn {formData.selectedSalonIds.length}/{salons.length} chi nhánh
              </p>
            )}
          </div>

          <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Hình ảnh & Video
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Main Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh đại diện dịch vụ
                </label>
                <ImageUpload
                  value={formData.image}
                  onChange={url => setFormData({ ...formData, image: url })}
                  folder="services"
                />
              </div>

              {/* Video */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video giới thiệu
                </label>
                <VideoUpload
                  value={formData.videoUrl}
                  onChange={url => setFormData({ ...formData, videoUrl: url })}
                  folder="services"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tải video lên hoặc dán link Youtube/Cloudinary.
                </p>
              </div>
            </div>

            {/* Gallery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bộ sưu tập ảnh mẫu (Gallery)
              </label>
              <MultiImageUpload
                value={formData.gallery}
                onChange={urls => setFormData({ ...formData, gallery: urls })}
                folder="services"
              />
              <p className="text-xs text-gray-500 mt-2">
                Nên thêm 3-5 ảnh kết quả thực tế để khách hàng tham khảo.
              </p>
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
                  {formData.selectedSalonIds.length > 1
                    ? `Tạo cho ${formData.selectedSalonIds.length} chi nhánh`
                    : 'Tạo dịch vụ'
                  }
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
