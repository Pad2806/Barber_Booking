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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-[6px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-8xl mb-12 grayscale opacity-20">😕</div>
        <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter italic">Không tìm thấy salon</h2>
        <Link href="/salons" className="text-foreground font-bold text-[11px] uppercase tracking-wider underline decoration-2 underline-offset-8">
          QUAY LẠI DANH SÁCH
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      {/* Hero - Premium Monochrome Overlay */}
      <div className="relative h-[400px] md:h-[500px]">
        <div className="absolute inset-0 bg-gray-100 overflow-hidden">
          {salon.coverImage && (
            <Image src={salon.coverImage} alt={salon.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 md:p-20">
          <div className="container mx-auto">
             <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 block">PREMIUM LOCATION</span>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-background mb-6 tracking-tight uppercase leading-none">
              {salon.name}
            </h1>
            <div className="flex items-center gap-4 text-white/70">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{salon.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Grid - High Contrast */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-background rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-border p-8 md:p-12 grid md:grid-cols-3 gap-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-foreground rounded-[24px] flex items-center justify-center shadow-xl shadow-foreground/10 shrink-0">
              <Star className="w-6 h-6 text-primary fill-primary" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mb-1 italic">RATING</p>
              <p className="text-3xl font-heading font-bold text-foreground tracking-tight leading-none mb-1">{salon.rating?.toFixed(1) || '5.0'}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest italic">({salon.totalReviews || 0} REVIEWS)</p>
            </div>
          </div>
          <div className="flex items-center gap-6 md:border-x border-border md:px-12">
            <div className="w-16 h-16 bg-accent/5 rounded-[24px] flex items-center justify-center border border-border shrink-0">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mb-1 italic">OPENING HOURS</p>
              <p className="text-lg font-heading font-bold text-foreground uppercase tracking-tight leading-tight">
                {salon.openTime} - {salon.closeTime}
              </p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest italic">DAILY OPERATIONS</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-accent/5 rounded-[24px] flex items-center justify-center border border-border shrink-0 transition-all hover:bg-primary group">
              <Phone className="w-6 h-6 text-muted-foreground group-hover:text-background transition-colors" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mb-1 italic">CONTACT</p>
              <p className="text-lg font-heading font-bold text-foreground tracking-tight leading-tight">{salon.phone}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest italic">HOTLINE SUPPORT</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Monochrome High Contrast */}
      <div className="container mx-auto px-4 mt-20">
        <div className="flex gap-16 border-b border-border overflow-x-auto no-scrollbar justify-center md:justify-start">
          {[
            { id: 'services', label: 'Dịch vụ' },
            { id: 'staff', label: 'Stylist' },
            { id: 'info', label: 'Thông tin' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'pb-8 text-[11px] font-bold uppercase tracking-[0.3em] transition-all duration-700 relative shrink-0 flex flex-col items-center gap-2 italic',
                activeTab === tab.id ? 'text-primary' : 'text-muted-foreground/40 hover:text-foreground'
              )}
            >
              {tab.label}
              <span className={cn(
                  "w-2 h-2 rounded-full bg-primary transition-all duration-700 opacity-0 transform translate-y-2",
                  activeTab === tab.id && "opacity-100 translate-y-0"
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
                  <div className="flex items-center gap-4 mb-16">
                     <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.5em] italic">{category.toUpperCase()}</span>
                     <div className="h-[1px] bg-border flex-1 opacity-20" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-10">
                    {categoryServices.map(service => (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={cn(
                          'bg-background rounded-[48px] p-8 cursor-pointer transition-all duration-700 border-2 relative group flex flex-col xl:flex-row gap-10',
                          isServiceSelected(service.id)
                            ? 'border-primary bg-accent/5 ring-8 ring-primary/5'
                            : 'border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-foreground/5'
                        )}
                      >
                        {/* Thumbnail Wrap */}
                        <div className="relative w-full xl:w-44 h-48 xl:h-44 rounded-[32px] overflow-hidden flex-shrink-0 bg-accent/5">
                          <Image
                            src={service.image || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800&auto=format'}
                            alt={service.name}
                            fill
                            className="object-cover transition-all duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                            sizes="(max-width: 1280px) 100vw, 176px"
                          />
                          
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          {service.videoUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-2xl scale-75 group-hover:scale-100 transition-transform">
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
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-background text-[9px] font-bold text-foreground rounded-full shadow-2xl transition-all hover:bg-primary hover:text-background active:scale-90 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 uppercase tracking-widest"
                          >
                            XEM CHI TIẾT
                          </button>
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-2">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-heading font-bold text-2xl text-foreground uppercase tracking-tight italic transition-colors group-hover:text-primary leading-none">{service.name}</h4>
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-500',
                                  isServiceSelected(service.id)
                                    ? 'bg-primary border-primary scale-110 shadow-xl shadow-primary/20'
                                    : 'border-border group-hover:border-primary/40'
                                )}
                              >
                                {isServiceSelected(service.id) && (
                                  <Check className="w-4 h-4 text-background" />
                                )}
                              </div>
                            </div>
                            {service.description && (
                              <p className="text-xs font-bold text-muted-foreground/50 line-clamp-2 leading-relaxed tracking-tight uppercase italic">{service.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-end justify-between mt-8">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] italic">STARTING AT</span>
                              <span className="text-2xl font-heading font-bold text-foreground tracking-tight leading-none">
                                {formatPrice(service.price)}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold text-primary bg-accent/5 px-4 py-2 rounded-full border border-border uppercase tracking-widest italic group-hover:tracking-[0.2em] transition-all">
                               {service.duration} MINS
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
                <div key={member.id} className="group bg-background rounded-[56px] p-12 border border-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] hover:shadow-2xl hover:shadow-foreground/5 transition-all duration-700 flex flex-col items-center text-center">
                  <div className="mb-10 transition-transform duration-700 group-hover:scale-105">
                    <Avatar 
                      src={member.user.avatar} 
                      name={member.user.name} 
                      size="xl" 
                      variant="square" 
                      className="ring-8 ring-primary/5 group-hover:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-4 mb-8">
                    <h4 className="text-3xl font-heading font-bold text-foreground uppercase tracking-tight italic leading-none">{member.user.name}</h4>
                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-6 py-2 rounded-full border border-primary/20 uppercase tracking-[0.2em] inline-block italic">
                      {STAFF_POSITIONS[member.position]?.toUpperCase() || member.position.toUpperCase()}
                    </span>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Star className="w-4 h-4 text-primary fill-primary" />
                      <span className="text-[11px] font-bold text-foreground uppercase tracking-widest italic">
                        {member.rating.toFixed(1)} <span className="text-muted-foreground/40 font-normal ml-1">({member.totalReviews})</span>
                      </span>
                    </div>
                  </div>
                  {member.bio && (
                    <div className="pt-8 border-t border-border w-full">
                       <p className="text-xs font-bold text-muted-foreground/30 uppercase italic leading-relaxed tracking-tight line-clamp-3">
                        &quot;{member.bio}&quot;
                       </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="max-w-4xl mx-auto space-y-16">
              <div className="bg-background rounded-[56px] p-12 sm:p-16 border border-border shadow-sm space-y-8 relative overflow-hidden group">
                <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.5em] mb-2 block italic">THE LOCATION</span>
                <p className="text-3xl font-heading font-bold text-foreground uppercase tracking-tight leading-tight lg:w-3/4 italic">
                  {salon.address}, {salon.ward && `${salon.ward}, `}
                  {salon.district}, {salon.city}
                </p>
                 <div className="h-72 w-full bg-accent/5 rounded-[40px] border border-border flex items-center justify-center overflow-hidden grayscale opacity-20 group-hover:opacity-40 transition-opacity">
                    <MapPin className="w-16 h-16 text-primary" />
                 </div>
              </div>
              <div className="bg-background rounded-[56px] p-12 sm:p-16 border border-border shadow-sm space-y-8 italic">
                 <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.5em] mb-2 block font-mono tracking-[0.6em]">EST. TIME SCHEDULE</span>
                <p className="text-4xl font-heading font-bold text-foreground uppercase tracking-tighter leading-none">
                  {salon.openTime} - {salon.closeTime}
                </p>
                <div className="flex gap-4 flex-wrap pt-4">
                   {salon.workingDays.map(day => (
                      <span key={day} className="px-6 py-3 bg-accent/5 border border-border text-[9px] font-bold uppercase tracking-[0.2em] text-foreground rounded-full hover:bg-primary hover:text-background transition-all cursor-default">{day}</span>
                   ))}
                </div>
              </div>
              {salon.description && (
                <div className="bg-background rounded-[56px] p-12 sm:p-16 border border-border shadow-sm space-y-8 relative">
                   <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.5em] mb-2 block italic">THE PHILOSOPHY</span>
                  <p className="text-2xl font-heading font-bold text-muted-foreground leading-snug italic uppercase tracking-tight">&quot;{salon.description}&quot;</p>
                  <div className="absolute top-12 right-12 text-6xl text-primary/5 font-serif font-black select-none pointer-events-none uppercase">RT</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Book Button - High Contrast Bold */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-[60] pointer-events-none">
        <div className="container mx-auto flex items-center justify-center">
            <div className="bg-foreground text-background rounded-[40px] p-10 md:p-14 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center justify-between gap-12 w-full max-w-6xl pointer-events-auto border border-primary/20 backdrop-blur-3xl animate-in slide-in-from-bottom-10 duration-1000">
              <div className="text-center md:text-left space-y-3">
                 <div className="flex items-center gap-4 justify-center md:justify-start">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-background/40 font-mono">EST. READY TO RESERVE</p>
                 </div>
                <h4 className="text-3xl font-heading font-bold tracking-tight uppercase italic">{selectedServices.length} DỊCH VỤ ĐÃ CHỌN</h4>
                {selectedServices.length > 0 && (
                  <div className="flex items-baseline gap-3 justify-center md:justify-start pt-2">
                    <p className="text-primary text-[11px] font-bold uppercase tracking-[0.3em] font-mono">TOTAL ESTIMATE:</p>
                    <p className="text-4xl font-heading font-bold tracking-tighter text-background">
                      {formatPrice(selectedServices.reduce((sum, s) => sum + Number(s.price), 0))}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleBooking}
                disabled={selectedServices.length === 0}
                className={cn(
                  'w-full md:w-auto px-16 py-6 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-6 transition-all duration-1000 shadow-2xl active:scale-95 group italic overflow-hidden relative',
                  selectedServices.length > 0
                    ? 'bg-primary text-background hover:bg-background hover:text-foreground border-2 border-primary hover:tracking-[0.6em]'
                    : 'bg-background/5 text-background/10 border-2 border-background/20 cursor-not-allowed'
                )}
              >
                TIẾP TỤC ĐẶT LỊCH
                <ArrowRight className="w-5 h-5 group-hover:translate-x-4 transition-transform duration-700" />
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
