'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, Clock, Phone, ChevronRight, Check, Play } from 'lucide-react';
import { salonApi, serviceApi, staffApi, Salon, Service, Staff } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, SERVICE_CATEGORIES, STAFF_POSITIONS, cn } from '@/lib/utils';
import ServiceDetailModal from '@/components/ServiceDetailModal';

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

  // Service Detail Modal
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

  // Group services by category
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-semibold mb-2">Không tìm thấy salon</h2>
        <Link href="/salons" className="text-accent hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-heading font-bold text-primary">
              Reetro<span className="text-accent">BarberShop</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-64 md:h-80">
        <div className="absolute inset-0 bg-gray-200">
          {salon.coverImage && (
            <Image src={salon.coverImage} alt={salon.name} fill className="object-cover" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">
              {salon.name}
            </h1>
            <p className="text-white/80 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {salon.address}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{salon.rating?.toFixed(1) || '5.0'}</p>
              <p className="text-sm text-gray-500">{salon.totalReviews || 0} đánh giá</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {salon.openTime} - {salon.closeTime}
              </p>
              <p className="text-sm text-gray-500">Giờ làm việc</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-semibold">{salon.phone}</p>
              <p className="text-sm text-gray-500">Liên hệ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex gap-2 border-b">
          {[
            { id: 'services', label: 'Dịch vụ' },
            { id: 'staff', label: 'Stylist' },
            { id: 'info', label: 'Thông tin' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-6 py-3 font-medium transition-colors relative',
                activeTab === tab.id ? 'text-accent' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {activeTab === 'services' && (
            <div className="space-y-8">
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {SERVICE_CATEGORIES[category]?.icon}
                    {SERVICE_CATEGORIES[category]?.label || category}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {categoryServices.map(service => (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={cn(
                          'bg-white rounded-2xl p-4 cursor-pointer transition-all border-2 relative group flex gap-4',
                          isServiceSelected(service.id)
                            ? 'border-accent bg-accent/5 ring-4 ring-accent/5'
                            : 'border-gray-50 hover:border-accent/20 hover:shadow-xl hover:shadow-gray-200/50'
                        )}
                      >
                        {/* Thumbnail Wrap */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-inner">
                          <Image
                            src={service.image || '/images/service-placeholder.jpg'}
                            alt={service.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 112px, 128px"
                          />
                          
                          {/* Media Overlays */}
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          {service.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg">
                                <Play className="w-4 h-4 fill-white" />
                              </div>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetailService(service);
                              setIsModalOpen(true);
                            }}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/90 hover:bg-white text-[10px] font-black text-gray-900 rounded-xl shadow-xl backdrop-blur-sm transition-all active:scale-95 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                          >
                            KHÁM PHÁ
                          </button>
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-heading font-bold text-lg text-gray-900 line-clamp-1 leading-tight">{service.name}</h4>
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
                                  isServiceSelected(service.id)
                                    ? 'bg-accent border-accent scale-110 shadow-lg shadow-accent/20'
                                    : 'border-gray-200 group-hover:border-accent/30'
                                )}
                              >
                                {isServiceSelected(service.id) && (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                            </div>
                            {service.description && (
                              <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{service.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-end justify-between mt-auto">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Chỉ từ</span>
                              <span className="text-xl font-black text-accent tracking-tighter">
                                {formatPrice(service.price)}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                              ⏱ {service.duration} PHÚT
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map(member => (
                <div key={member.id} className="bg-white rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 relative">
                      {member.user.avatar ? (
                        <Image
                          src={member.user.avatar}
                          alt={member.user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          👤
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{member.user.name}</h4>
                      <p className="text-sm text-accent">
                        {STAFF_POSITIONS[member.position] || member.position}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-600">
                          {member.rating.toFixed(1)} ({member.totalReviews})
                        </span>
                      </div>
                    </div>
                  </div>
                  {member.bio && <p className="text-sm text-gray-500 mt-4">{member.bio}</p>}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">Địa chỉ</h3>
                <p className="text-gray-600">
                  {salon.address}, {salon.ward && `${salon.ward}, `}
                  {salon.district}, {salon.city}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6">
                <h3 className="font-semibold mb-3">Giờ làm việc</h3>
                <p className="text-gray-600">
                  {salon.openTime} - {salon.closeTime}
                </p>
                <p className="text-sm text-gray-400 mt-1">{salon.workingDays.join(', ')}</p>
              </div>
              {salon.description && (
                <div className="bg-white rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Giới thiệu</h3>
                  <p className="text-gray-600">{salon.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Book Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              Đã chọn: <span className="font-semibold">{selectedServices.length} dịch vụ</span>
            </p>
            {selectedServices.length > 0 && (
              <p className="text-accent font-semibold">
                {formatPrice(selectedServices.reduce((sum, s) => sum + Number(s.price), 0))}
              </p>
            )}
          </div>
          <button
            onClick={handleBooking}
            disabled={selectedServices.length === 0}
            className={cn(
              'px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all',
              selectedServices.length > 0
                ? 'bg-accent hover:bg-accent/90 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Tiếp tục đặt lịch
            <ChevronRight className="w-5 h-5" />
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
    </div>
  );
}
