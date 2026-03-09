'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, Clock, Phone, Check, Play, ArrowRight, User as UserIcon } from 'lucide-react';
import { salonApi, serviceApi, staffApi, Salon, Service, Staff } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, STAFF_POSITIONS, cn } from '@/lib/utils';
import ServiceDetailModal from '@/components/ServiceDetailModal';
import Header from '@/components/header';
import Footer from '@/components/footer';

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-[6px] border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-8xl mb-12 grayscale opacity-20">😕</div>
        <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter italic">Không tìm thấy salon</h2>
        <Link href="/salons" className="text-black font-black text-xs uppercase tracking-[0.3em] underline decoration-2 underline-offset-8">
          QUAY LẠI DANH SÁCH
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <Header />

      {/* Hero - Premium Monochrome Overlay */}
      <div className="relative h-[400px] md:h-[500px]">
        <div className="absolute inset-0 bg-gray-100 overflow-hidden">
          {salon.coverImage && (
            <Image src={salon.coverImage} alt={salon.name} fill className="object-cover grayscale transition-transform duration-1000 group-hover:scale-105" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 md:p-20">
          <div className="container mx-auto">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mb-4 block">PREMIUM LOCATION</span>
            <h1 className="text-5xl md:text-8xl font-heading font-black text-white mb-6 tracking-tighter uppercase italic leading-none">
              {salon.name}
            </h1>
            <div className="flex items-center gap-4 text-white/70">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <MapPin className="w-4 h-4 text-white" />
                <span className="text-xs font-black uppercase tracking-widest">{salon.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Grid - High Contrast */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 p-10 grid md:grid-cols-3 gap-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shadow-xl shadow-black/20 shrink-0">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 italic">RATING</p>
              <p className="text-3xl font-black text-gray-900 tracking-tighter italic">{salon.rating?.toFixed(1) || '5.0'}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">({salon.totalReviews || 0} REVIEWS)</p>
            </div>
          </div>
          <div className="flex items-center gap-6 md:border-x border-gray-100 md:px-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shrink-0">
              <Clock className="w-6 h-6 text-black" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 italic">OPENING HOURS</p>
              <p className="text-lg font-black text-gray-900 uppercase tracking-tighter italic">
                {salon.openTime} - {salon.closeTime}
              </p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">DAILY OPERATIONS</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shrink-0 transition-all hover:bg-black hover:text-white group">
              <Phone className="w-6 h-6 text-black group-hover:text-white transition-colors" />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 italic">CONTACT</p>
              <p className="text-lg font-black text-gray-900 tracking-tighter italic">{salon.phone}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">HOTLINE SUPPORT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Monochrome High Contrast */}
      <div className="container mx-auto px-4 mt-20">
        <div className="flex gap-12 border-b border-gray-100 overflow-x-auto no-scrollbar">
          {[
            { id: 'services', label: 'Dịch vụ' },
            { id: 'staff', label: 'Stylist' },
            { id: 'info', label: 'Thông tin' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'pb-8 text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700 relative shrink-0',
                activeTab === tab.id ? 'text-black' : 'text-gray-300 hover:text-gray-900'
              )}
            >
              {tab.label}
              <span className={cn(
                  "absolute bottom-0 left-0 w-full h-1 bg-black transition-all duration-700 origin-left scale-x-0",
                  activeTab === tab.id && "scale-x-100"
                )} />
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-20">
          {activeTab === 'services' && (
            <div className="space-y-24">
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category}>
                  <div className="flex items-center gap-4 mb-12">
                     <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">{category.toUpperCase()}</span>
                     <div className="h-[1px] bg-gray-100 flex-1" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-10">
                    {categoryServices.map(service => (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={cn(
                          'bg-white rounded-[40px] p-8 cursor-pointer transition-all duration-700 border-2 relative group flex flex-col md:flex-row gap-10',
                          isServiceSelected(service.id)
                            ? 'border-black bg-gray-50 ring-8 ring-black/5 scale-[1.02]'
                            : 'border-gray-50 hover:border-black/10 hover:shadow-2xl hover:shadow-black/5'
                        )}
                      >
                        {/* Thumbnail Wrap */}
                        <div className="relative w-full md:w-44 h-44 rounded-[24px] overflow-hidden flex-shrink-0 bg-gray-50 shadow-inner">
                          <Image
                            src={service.image || '/images/service-placeholder.jpg'}
                            alt={service.name}
                            fill
                            className="object-cover grayscale transition-transform duration-700 group-hover:grayscale-0 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 176px"
                          />
                          
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          {service.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-2xl">
                                <Play className="w-5 h-5 fill-white" />
                              </div>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetailService(service);
                              setIsModalOpen(true);
                            }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-white text-[10px] font-black text-gray-900 rounded-full shadow-2xl transition-all hover:bg-black hover:text-white active:scale-95 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                          >
                            XEM CHI TIẾT
                          </button>
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-heading font-black text-2xl text-gray-900 uppercase tracking-tighter italic">{service.name}</h4>
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-700',
                                  isServiceSelected(service.id)
                                    ? 'bg-black border-black scale-110 shadow-xl shadow-black/20'
                                    : 'border-gray-100 group-hover:border-black/30'
                                )}
                              >
                                {isServiceSelected(service.id) && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </div>
                            </div>
                            {service.description && (
                              <p className="text-sm font-light text-gray-400 line-clamp-2 leading-relaxed tracking-tight">{service.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-end justify-between mt-8">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic mb-1">PRICE STARTS FROM</span>
                              <span className="text-3xl font-black text-black tracking-tighter italic">
                                {formatPrice(service.price)}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 uppercase tracking-tight italic">
                              ⏱ {service.duration} MINS
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {staff.map(member => (
                <div key={member.id} className="group bg-white rounded-[48px] p-10 border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:shadow-black/5 transition-all duration-700">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-50 relative mb-8 border-4 border-white shadow-2xl transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0">
                      {member.user.avatar ? (
                        <Image
                          src={member.user.avatar}
                          alt={member.user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-50">
                          <UserIcon className="w-12 h-12 text-gray-200" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">{member.user.name}</h4>
                      <p className="text-[10px] font-black text-black bg-gray-50 px-6 py-2 rounded-full border border-gray-100 uppercase tracking-[0.2em] italic inline-block">
                        {STAFF_POSITIONS[member.position]?.toUpperCase() || member.position.toUpperCase()}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Star className="w-4 h-4 text-black fill-black" />
                        <span className="text-sm font-black text-gray-900 tracking-tighter italic">
                          {member.rating.toFixed(1)} <span className="text-gray-300 font-light not-italic ml-1">/{member.totalReviews} REVIEWS</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {member.bio && <p className="text-sm font-light text-gray-400 mt-8 text-center leading-relaxed italic line-clamp-3">&quot;{member.bio}&quot;</p>}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="bg-white rounded-[48px] p-12 border border-gray-50 shadow-sm space-y-6">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-2 block">LOCATION</span>
                <p className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-snug lg:w-2/3 italic">
                  {salon.address}, {salon.ward && `${salon.ward}, `}
                  {salon.district}, {salon.city}
                </p>
                 <div className="h-64 w-full bg-gray-50 rounded-[32px] border border-gray-100 flex items-center justify-center overflow-hidden grayscale opacity-50">
                    <MapPin className="w-12 h-12 text-gray-300" />
                 </div>
              </div>
              <div className="bg-white rounded-[48px] p-12 border border-gray-50 shadow-sm space-y-6">
                 <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-2 block">TIME SCHEDULE</span>
                <p className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
                  {salon.openTime} - {salon.closeTime}
                </p>
                <div className="flex gap-2 flex-wrap">
                   {salon.workingDays.map(day => (
                      <span key={day} className="px-5 py-2 bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-full">{day}</span>
                   ))}
                </div>
              </div>
              {salon.description && (
                <div className="bg-white rounded-[48px] p-12 border border-gray-50 shadow-sm space-y-6">
                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-2 block">THE PHILOSOPHY</span>
                  <p className="text-xl font-light text-gray-500 leading-relaxed italic italic-serif">&quot;{salon.description}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Book Button - High Contrast Bold */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="container mx-auto flex items-center justify-center">
            <div className="bg-black text-white rounded-[32px] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-center justify-between gap-10 w-full max-w-5xl pointer-events-auto border border-white/10 backdrop-blur-3xl">
              <div className="text-center md:text-left space-y-2">
                 <div className="flex items-center gap-3 justify-center md:justify-start">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">READY TO RESERVE</p>
                 </div>
                <h4 className="text-2xl font-black tracking-tighter uppercase italic">{selectedServices.length} DỊCH VỤ ĐÃ CHỌN</h4>
                {selectedServices.length > 0 && (
                  <p className="text-white bg-white/10 px-4 py-2 rounded-full inline-block text-xl font-black italic tracking-tight">
                    TOTAL: {formatPrice(selectedServices.reduce((sum, s) => sum + Number(s.price), 0))}
                  </p>
                )}
              </div>
              <button
                onClick={handleBooking}
                disabled={selectedServices.length === 0}
                className={cn(
                  'w-full md:w-auto px-16 py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all duration-700 shadow-2xl active:scale-95 group',
                  selectedServices.length > 0
                    ? 'bg-white text-black hover:bg-black hover:text-white border-2 border-white'
                    : 'bg-white/5 text-gray-600 border-2 border-white/10 cursor-not-allowed opacity-50'
                )}
              >
                TIẾP TỤC ĐẶT LỊCH
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
              </button>
            </div>
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
