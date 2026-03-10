'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, Clock, Phone, Check, Play, ArrowRight, ChevronRight } from 'lucide-react';
import { salonApi, serviceApi, staffApi, Salon, Service, Staff } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, STAFF_POSITIONS, cn } from '@/lib/utils';
import ServiceDetailModal from '@/components/ServiceDetailModal';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Avatar from '@/components/Avatar';

export default function SalonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { setSalon, selectedServices, toggleService, isServiceSelected } = useBookingStore();

  const [salon, setSalonData] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'staff' | 'info'>('services');

  const [selectedDetailService, setSelectedDetailService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const salonData = await salonApi.getBySlug(slug);
      setSalonData(salonData);

      const [servicesData, staffData] = await Promise.all([
        serviceApi.getBySalon(salonData.id),
        staffApi.getBySalon(salonData.id),
      ]);
      setServices(servicesData);
      setStaff(staffData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      void fetchData();
    }
  }, [slug, fetchData]);

  const handleBooking = () => {
    if (salon) {
      setSalon(salon);
      router.push('/booking');
    }
  };

  const groupedServices = services.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>
  );

  const totalSelected = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-[#2C1E12]">Không tìm thấy salon</h2>
        <Link href="/salons" className="text-sm font-medium text-[#C8A97E] hover:text-[#B8975E] underline underline-offset-4">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      <Header />

      {/* ─── Hero ─── */}
      <div className="relative h-[280px] md:h-[360px]">
        <div className="absolute inset-0 bg-[#E8E0D4] overflow-hidden">
          {salon.coverImage && (
            <Image src={salon.coverImage} alt={salon.name} fill className="object-cover" priority />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">{salon.name}</h1>
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span className="text-sm">{salon.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Info ─── */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D4] p-5 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C8A97E]/10 rounded-xl flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-[#C8A97E] fill-[#C8A97E]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#2C1E12] leading-tight">{salon.rating?.toFixed(1) || '5.0'}</p>
              <p className="text-[11px] text-[#8B7355]">{salon.totalReviews || 0} đánh giá</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-x border-[#E8E0D4] px-4">
            <div className="w-10 h-10 bg-[#C8A97E]/10 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[#C8A97E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2C1E12]">{salon.openTime} – {salon.closeTime}</p>
              <p className="text-[11px] text-[#8B7355]">Giờ mở cửa</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C8A97E]/10 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-[#C8A97E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2C1E12]">{salon.phone}</p>
              <p className="text-[11px] text-[#8B7355]">Liên hệ</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="flex gap-1 bg-[#F0EBE3] rounded-xl p-1">
          {[
            { id: 'services', label: 'Dịch vụ' },
            { id: 'staff', label: 'Đội ngũ' },
            { id: 'info', label: 'Thông tin' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer',
                activeTab === tab.id
                  ? 'bg-white text-[#2C1E12] shadow-sm'
                  : 'text-[#8B7355] hover:text-[#5C4A32]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        <div className="py-6">
          {/* Services */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <div className="w-4 h-[2px] bg-[#C8A97E] rounded-full" />
                    {category}
                  </h3>

                  <div className="space-y-2">
                    {categoryServices.map(service => {
                      const selected = isServiceSelected(service.id);
                      return (
                        <div
                          key={service.id}
                          onClick={() => toggleService(service)}
                          className={cn(
                            'flex items-center gap-4 p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer group',
                            selected
                              ? 'border-[#C8A97E] bg-[#C8A97E]/5 shadow-sm'
                              : 'border-transparent bg-white hover:border-[#E8E0D4] hover:shadow-sm'
                          )}
                        >
                          {/* Image */}
                          <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 bg-[#F0EBE3]">
                            <Image
                              src={service.image || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=400&auto=format'}
                              alt={service.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {service.videoUrl && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-[15px] text-[#2C1E12] leading-tight">{service.name}</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDetailService(service);
                                  setIsModalOpen(true);
                                }}
                                className="text-[11px] text-[#C8A97E] font-medium hover:text-[#B8975E] shrink-0 cursor-pointer"
                              >
                                Chi tiết
                              </button>
                            </div>
                            {service.description && (
                              <p className="text-xs text-[#8B7355] line-clamp-1 mt-0.5">{service.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-sm font-bold text-[#C8A97E]">{formatPrice(service.price)}</span>
                              <span className="text-[11px] text-[#8B7355] bg-[#F0EBE3] px-2 py-0.5 rounded-full">{service.duration} phút</span>
                            </div>
                          </div>

                          {/* Checkbox */}
                          <div className={cn(
                            'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300',
                            selected ? 'bg-[#C8A97E] border-[#C8A97E]' : 'border-[#D4C9BA] group-hover:border-[#C8A97E]'
                          )}>
                            {selected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Staff */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {staff.map(member => (
                <div key={member.id} className="bg-white rounded-2xl p-4 border border-[#E8E0D4] hover:shadow-sm transition-all flex flex-col items-center text-center gap-3">
                  <Avatar
                    src={member.user.avatar}
                    name={member.user.name}
                    size="lg"
                    variant="circle"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#2C1E12]">{member.user.name}</h4>
                    <p className="text-[11px] text-[#C8A97E] font-medium mt-0.5">
                      {STAFF_POSITIONS[member.position] || member.position}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-[#C8A97E] fill-[#C8A97E]" />
                      <span className="text-xs font-bold text-[#2C1E12]">{member.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-[#8B7355]">({member.totalReviews})</span>
                    </div>
                  </div>
                  {member.bio && (
                    <p className="text-[11px] text-[#8B7355] line-clamp-2 border-t border-[#E8E0D4] pt-3 w-full">{member.bio}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Address */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E0D4]">
                <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#C8A97E]" />
                  Địa chỉ
                </h3>
                <p className="text-sm font-medium text-[#2C1E12]">
                  {salon.address}{salon.ward && `, ${salon.ward}`}, {salon.district}, {salon.city}
                </p>
              </div>

              {/* Hours */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E0D4]">
                <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#C8A97E]" />
                  Giờ hoạt động
                </h3>
                <p className="text-lg font-bold text-[#2C1E12] mb-3">{salon.openTime} – {salon.closeTime}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {salon.workingDays.map(day => (
                    <span key={day} className="px-3 py-1.5 bg-[#F0EBE3] text-xs font-bold text-[#2C1E12] rounded-lg">{day}</span>
                  ))}
                </div>
              </div>

              {/* Description */}
              {salon.description && (
                <div className="bg-white rounded-2xl p-5 border border-[#E8E0D4]">
                  <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Giới thiệu</h3>
                  <p className="text-sm text-[#5C4A32] leading-relaxed">{salon.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#E8E0D4] shadow-[0_-2px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {selectedServices.length > 0 ? (
              <>
                <p className="text-[11px] text-[#8B7355]">
                  {selectedServices.length} dịch vụ · {totalDuration} phút
                </p>
                <p className="text-lg font-bold text-[#2C1E12] tracking-tight leading-tight">
                  {formatPrice(totalSelected)}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#8B7355]">Chọn dịch vụ để đặt lịch</p>
            )}
          </div>

          <button
            onClick={handleBooking}
            disabled={selectedServices.length === 0}
            className={cn(
              'shrink-0 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 cursor-pointer',
              selectedServices.length > 0
                ? 'bg-[#C8A97E] text-white hover:bg-[#B8975E] active:scale-[0.98] shadow-sm'
                : 'bg-[#E8E0D4] text-[#B8A98C] cursor-not-allowed'
            )}
          >
            Tiếp tục đặt lịch
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDetailService && (
        <ServiceDetailModal
          service={selectedDetailService}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={() => toggleService(selectedDetailService)}
          isSelected={isServiceSelected(selectedDetailService.id)}
        />
      )}
      <Footer />
    </div>
  );
}
