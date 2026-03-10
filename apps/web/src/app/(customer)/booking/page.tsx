'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Scissors, Star, MapPin, Clock } from 'lucide-react';
import { staffApi, serviceApi, Staff, Service } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, STAFF_POSITIONS, cn } from '@/lib/utils';
import Avatar from '@/components/Avatar';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function BookingPage() {
  const router = useRouter();
  const {
    salon,
    selectedServices,
    selectedStaff,
    selectedDate,
    selectedTimeSlot,
    totalDuration,
    totalAmount,
    note,
    currentStep,
    setStaff,
    setDate,
    setTimeSlot,
    setNote,
    setStep,
    nextStep,
    prevStep,
    isServiceSelected,
    toggleService,
  } = useBookingStore();

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaffList] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  const DATES = useMemo(() => {
    if (!salon) return [];
    const dates = [];
    const today = new Date();
    const now = new Date();
    let startOffset = 0;

    let closeTime = salon.closeTime;
    if (now.getDay() === 0) closeTime = '12:00';

    if (closeTime) {
      const [h, m] = closeTime.split(':').map(Number);
      const closeDate = new Date();
      closeDate.setHours(h, m, 0, 0);
      closeDate.setHours(closeDate.getHours() - 1);
      if (now >= closeDate) startOffset = 1;
    }

    for (let i = startOffset; i < 14 + startOffset; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [salon]);

  const fetchData = useCallback(async () => {
    if (!salon) return;
    try {
      setLoading(true);
      const [servicesData, staffData] = await Promise.all([
        serviceApi.getBySalon(salon.id),
        staffApi.getBySalon(salon.id),
      ]);
      setServices(servicesData);
      
      const barbers = staffData.filter(barber => {
        const role = barber.position.toUpperCase();
        return role === 'STYLIST' || role === 'SENIOR_STYLIST' || role === 'MASTER_STYLIST';
      });
      setStaffList(barbers);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [salon]);

  const fetchTimeSlots = useCallback(async () => {
    if (!salon || !selectedDate) return;
    try {
      setLoading(true);
      const data = await staffApi.getAvailableSlots(
        salon.id,
        selectedDate,
        totalDuration,
        selectedStaff?.id
      );

      const slotsData = Array.isArray(data) ? data : [];
      const isToday = selectedDate === new Date().toISOString().split('T')[0];
      if (isToday) {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const filteredData = slotsData.map((slot: any) => {
          const [h, m] = slot.time.split(':').map(Number);
          const slotTime = new Date();
          slotTime.setHours(h, m, 0, 0);
          return slotTime < now ? { ...slot, available: false } : slot;
        });
        setTimeSlots(filteredData);
      } else {
        setTimeSlots(slotsData);
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    } finally {
      setLoading(false);
    }
  }, [salon, selectedDate, totalDuration, selectedStaff?.id]);

  useEffect(() => {
    if (!salon) {
      router.push('/salons');
      return;
    }
    void fetchData();
  }, [fetchData, router, salon]);

  useEffect(() => {
    if (selectedDate && salon) {
      void fetchTimeSlots();
    }
  }, [fetchTimeSlots, selectedDate, salon]);

  const handleContinue = () => {
    if (currentStep === 4) {
      router.push('/booking/confirm');
    } else {
      nextStep();
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1: return selectedServices.length > 0;
      case 2: return true; // Optional Staff
      case 3: return !!selectedDate;
      case 4: return !!selectedTimeSlot;
      default: return false;
    }
  };

  const groupedServices = useMemo(() => {
    return services.reduce((acc, service) => {
      const cat = service.category || 'DỊCH VỤ KHÁC';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services]);

  if (!salon) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-[450px] selection:bg-primary/20">
      {/* Header - Editorial Style */}
      <header className="bg-white/80 backdrop-blur-3xl border-b border-primary/5 sticky top-0 z-[60] py-10">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => (currentStep > 1 ? prevStep() : router.back())}
            className="flex items-center gap-4 text-primary/30 hover:text-primary transition-all group scale-90 origin-left"
          >
            <div className="w-12 h-12 rounded-full border border-primary/10 flex items-center justify-center group-hover:border-primary/30 transition-colors">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.5em] font-mono italic">BACK</span>
          </button>
          
          <div className="text-center absolute left-1/2 -translate-x-1/2">
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-primary/40 uppercase tracking-[1em] mb-2 scale-75">REETRO EST. 2024</span>
                <h3 className="text-3xl font-heading font-black uppercase tracking-[-0.08em] italic text-[#1A1A1A] leading-none drop-shadow-sm">{salon.name}</h3>
             </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
             <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
             </div>
             <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/40 italic">DISTRICT 3, HCMC</span>
          </div>
        </div>
      </header>

      {/* Luxury Stepper - Artistic View */}
      <div className="sticky top-[110px] z-50 py-12 bg-gradient-to-b from-white/95 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-primary/10 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 transition-all duration-1000 z-0 ease-in-out" 
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            />

            {[
              { step: 1, label: 'SERVICE' },
              { step: 2, label: 'ARTIST' },
              { step: 3, label: 'CALENDAR' },
              { step: 4, label: 'SCHEDULE' },
            ].map((item) => {
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;
              return (
                <div key={item.step} className="relative z-10 bg-[#FDFBF7] px-4 flex flex-col items-center gap-4 group">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-1000 border-2",
                    isActive 
                      ? "bg-primary text-background border-primary shadow-[0_20px_40px_-10px_rgba(218,165,32,0.5)] scale-110 -rotate-3" 
                      : isCompleted 
                        ? "bg-[#1A1A1A] text-background border-[#1A1A1A] rotate-3" 
                        : "bg-white text-primary/20 border-primary/10 group-hover:border-primary/40"
                  )}>
                    {isCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : <span className="font-mono italic">{item.step.toString().padStart(2, '0')}</span>}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black tracking-[0.4em] italic uppercase transition-all duration-700",
                    isActive ? "text-[#1A1A1A] opacity-100" : "text-primary/20 group-hover:text-primary/40"
                  )}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-24 pb-48">
        {/* Step 1: Services - Magazine Grid */}
        {currentStep === 1 && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-12 border-b border-primary/10 pb-16">
                <div className="space-y-6">
                  <span className="text-[12px] font-black text-primary uppercase tracking-[0.8em] mb-4 block animate-pulse">01 // SELECT SERVICES</span>
                  <h2 className="text-7xl md:text-9xl font-heading font-black text-[#1A1A1A] tracking-[-0.1em] leading-[0.8] uppercase italic">
                    HAIR <span className="text-primary/20">&</span> <br />EXPERIENCE
                  </h2>
                </div>
                <p className="max-w-xs text-[11px] font-bold text-primary/40 uppercase tracking-widest italic leading-loose text-right">
                  Our services are more than just a cut. We provide a full sensory experience of traditional grooming.
                </p>
            </div>

            <div className="space-y-40">
              {Object.entries(groupedServices).map(([category, catServices]) => (
                <div key={category} className="relative">
                   <div className="sticky top-[280px] z-10 mb-16 flex items-center gap-8">
                     <span className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-[0.6em] italic font-mono whitespace-nowrap">{category}</span>
                     <div className="h-[1px] w-full bg-gradient-to-r from-primary/30 to-transparent" />
                   </div>
                   
                   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {catServices.map(service => (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={cn(
                          "group relative bg-white rounded-[64px] transition-all duration-700 cursor-pointer overflow-hidden border border-primary/5",
                          isServiceSelected(service.id) 
                            ? "ring-1 ring-primary shadow-[0_40px_80px_-20px_rgba(218,165,32,0.2)] -translate-y-4" 
                            : "hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] hover:-translate-y-2"
                        )}
                      >
                        <div className="aspect-[4/5] relative overflow-hidden">
                          <Image 
                            src={service.image || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800&auto=format'} 
                            alt={service.name} 
                            fill 
                            className={cn(
                              "object-cover transition-all duration-1000 scale-105 group-hover:scale-110",
                              !isServiceSelected(service.id) && "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100"
                            )} 
                          />
                          {/* Inner Shadow Mesh */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                          
                          <div className="absolute bottom-12 left-12 right-12 text-white">
                             <div className="flex items-center gap-4 mb-4">
                               <div className="h-[1px] w-8 bg-primary" />
                               <span className="text-[10px] font-bold uppercase tracking-[0.4em] italic">{service.duration} MINS</span>
                             </div>
                             <h4 className="text-4xl font-heading font-black uppercase italic tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">{service.name}</h4>
                             <p className="text-[11px] font-medium opacity-60 uppercase tracking-widest italic line-clamp-1">{service.description}</p>
                          </div>

                          {isServiceSelected(service.id) && (
                            <div className="absolute top-10 right-10 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-2xl scale-110 animate-in zoom-in duration-500">
                              <Check className="w-7 h-7 text-white stroke-[4]" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-10 flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.4em] italic mb-1">FEE STARTS</span>
                              <span className="text-4xl font-heading font-black text-[#1A1A1A] tracking-tighter italic">{formatPrice(service.price)}</span>
                           </div>
                           <div className={cn(
                             "w-16 h-16 rounded-full border flex items-center justify-center transition-all duration-700",
                             isServiceSelected(service.id) ? "bg-primary border-primary text-white" : "border-primary/20 text-primary group-hover:border-primary group-hover:rotate-45"
                           )}>
                             <ChevronRight className="w-7 h-7" />
                           </div>
                        </div>
                      </div>
                    ))}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Staff - Exclusive Artist Grid */}
        {currentStep === 2 && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 max-w-7xl mx-auto">
             <div className="text-center mb-32 space-y-8">
              <span className="text-[12px] font-black text-primary uppercase tracking-[1em] mb-4 block">02 // SELECT ARTIST</span>
              <h2 className="text-7xl md:text-9xl font-heading font-black text-[#1A1A1A] tracking-[-0.12em] leading-none uppercase italic">MASTERS <br />OF <span className="text-primary/20">CRAFT</span></h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
               {/* Any Barber Option - Reimagined */}
               <div
                  onClick={() => setStaff(null)}
                  className={cn(
                    "relative aspect-[3/4] rounded-[56px] border-2 transition-all duration-1000 cursor-pointer overflow-hidden p-12 flex flex-col items-center justify-center group",
                    !selectedStaff 
                      ? "bg-[#1A1A1A] border-[#1A1A1A] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] scale-105" 
                      : "bg-white border-primary/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5"
                  )}
               >
                  <div className={cn(
                    "w-32 h-32 rounded-[32px] flex items-center justify-center transition-all duration-1000 rotate-12 group-hover:rotate-0",
                    !selectedStaff ? "bg-primary text-white shadow-[0_0_40px_rgba(218,165,32,0.3)]" : "bg-primary/5 text-primary group-hover:bg-primary/10"
                  )}>
                    <Scissors className="w-16 h-16 stroke-[1.5]" />
                  </div>
                  <div className="mt-10 text-center space-y-3">
                    <h4 className={cn(
                      "font-heading font-black text-3xl uppercase tracking-tighter italic leading-none",
                      !selectedStaff ? "text-white" : "text-[#1A1A1A]"
                    )}>FREE CHOICE</h4>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.3em] italic leading-relaxed",
                      !selectedStaff ? "text-white/40" : "text-primary/40"
                    )}>Auto-assign master</p>
                  </div>
                  <div className="absolute -bottom-4 right-0 p-12 text-[10rem] text-primary/[0.03] font-black uppercase select-none pointer-events-none italic tracking-tighter leading-none">RT</div>
               </div>

               {staff.map(member => (
                 <div
                    key={member.id}
                    onClick={() => setStaff(member)}
                    className={cn(
                      "group relative aspect-[3/4] rounded-[56px] bg-white transition-all duration-1000 cursor-pointer overflow-hidden border border-primary/5",
                      selectedStaff?.id === member.id 
                        ? "ring-2 ring-primary shadow-[0_40px_80px_-20px_rgba(218,165,32,0.2)] scale-105 z-10" 
                        : "hover:shadow-2xl hover:border-primary/30 hover:-translate-y-2 opacity-80 hover:opacity-100"
                    )}
                 >
                    <div className="absolute inset-0 z-0">
                       <Avatar 
                        src={member.user.avatar} 
                        name={member.user.name} 
                        size="2xl" 
                        variant="square" 
                        className="w-full h-full border-none rounded-none grayscale group-hover:grayscale-0 transition-all duration-1000 opacity-90 group-hover:opacity-100 group-hover:scale-110" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    </div>
                    
                    <div className="absolute top-10 right-10 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-[10px] font-black text-white italic">{member.rating.toFixed(1)}</span>
                    </div>

                    <div className="absolute bottom-10 left-10 right-10 z-20 space-y-3">
                      <h4 className="font-heading font-black text-3xl uppercase tracking-tighter italic leading-none text-white group-hover:text-primary transition-colors">{member.user.name}</h4>
                      <div className="h-[2px] w-0 group-hover:w-full bg-primary transition-all duration-1000" />
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] italic">
                        {STAFF_POSITIONS[member.position]}
                      </p>
                    </div>

                    {selectedStaff?.id === member.id && (
                      <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] z-10" />
                    )}
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Step 3: Date - Modern Grid */}
        {currentStep === 3 && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 max-w-6xl mx-auto">
             <div className="text-center mb-32 space-y-8">
              <span className="text-[12px] font-black text-primary uppercase tracking-[1em] mb-4 block">03 // CHOOSE DATE</span>
              <h2 className="text-7xl md:text-9xl font-heading font-black text-[#1A1A1A] tracking-[-0.1em] leading-none uppercase italic">PICK THE <br /><span className="text-primary/20">OCCASION</span></h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
               {DATES.map((date, idx) => {
                 const dateStr = date.toISOString().split('T')[0];
                 const isSelected = selectedDate === dateStr;
                 const isToday = dateStr === new Date().toISOString().split('T')[0];
                 
                 return (
                    <button
                      key={dateStr}
                      onClick={() => setDate(dateStr)}
                      style={{ transitionDelay: `${idx * 50}ms` }}
                      className={cn(
                        "group relative aspect-square p-8 rounded-[48px] border-2 transition-all duration-1000 flex flex-col items-center justify-center gap-4 overflow-hidden",
                        isSelected 
                          ? "bg-primary border-primary text-white shadow-[0_30px_60px_-15px_rgba(218,165,32,0.4)] scale-110 z-10 -rotate-2" 
                          : "bg-white border-primary/5 text-[#1A1A1A] hover:border-primary/40 hover:shadow-2xl hover:-translate-y-3"
                      )}
                    >
                      <span className={cn(
                        "text-[11px] font-black uppercase tracking-[0.4em] font-mono italic transition-all duration-700",
                        isSelected ? "text-white/60" : "text-primary/40 group-hover:text-primary"
                      )}>{DAYS[date.getDay()]}</span>
                      <span className="text-6xl font-heading font-black tracking-tighter leading-none mb-2">{date.getDate()}</span>
                      
                      {isToday && (
                        <div className={cn(
                          "px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                          isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                        )}>TODAY</div>
                      )}
                      
                      <div className={cn(
                        "absolute -bottom-6 -right-6 text-9xl font-black italic opacity-[0.03] select-none uppercase tracking-tighter",
                        isSelected ? "text-white" : "text-primary"
                      )}>{date.getDate()}</div>
                    </button>
                 );
               })}
            </div>
          </div>
        )}

        {/* Step 4: Time - Precision Selection */}
        {currentStep === 4 && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 max-w-6xl mx-auto">
             <div className="text-center mb-32 space-y-8">
              <span className="text-[12px] font-black text-primary uppercase tracking-[1em] mb-4 block">04 // PICK TIME</span>
              <h2 className="text-7xl md:text-9xl font-heading font-black text-[#1A1A1A] tracking-[-0.08em] leading-none uppercase italic">TIME FOR <br /><span className="text-primary/20">SILK</span></h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-40 gap-12">
                <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                <p className="text-[12px] font-black italic tracking-[1em] uppercase text-primary/40 animate-pulse">Analyzing Space-Time...</p>
              </div>
            ) : timeSlots.length === 0 ? (
               <div className="text-center py-40 italic text-primary/20 uppercase tracking-[0.8em] text-4xl font-black border-2 border-dashed border-primary/10 rounded-[64px]">No Space Left</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                {timeSlots.map((slot, idx) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setTimeSlot(slot.time)}
                    disabled={!slot.available}
                    style={{ transitionDelay: `${idx * 20}ms` }}
                    className={cn(
                      "py-10 rounded-[32px] font-heading font-black text-4xl italic transition-all duration-700 border-2 relative overflow-hidden group/slot",
                      selectedTimeSlot === slot.time 
                         ? "bg-primary border-primary text-white shadow-[0_20px_40px_-10px_rgba(218,165,32,0.4)] scale-110 z-10 rotate-1" 
                         : slot.available 
                            ? "bg-white border-primary/5 text-[#1A1A1A] hover:border-primary/50 hover:text-primary hover:tracking-widest" 
                            : "hidden"
                    )}
                  >
                    <span className="relative z-10">{slot.time}</span>
                    {selectedTimeSlot === slot.time && (
                       <Check className="absolute top-3 right-3 w-5 h-5 text-white/40" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover/slot:scale-x-100 transition-transform duration-700" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-40 max-w-4xl mx-auto">
               <div className="flex items-center gap-8 mb-12">
                  <div className="h-[1px] w-24 bg-primary/20" />
                  <label className="text-[13px] font-black text-[#1A1A1A] uppercase tracking-[0.6em] italic font-mono">PERSONALIZE YOUR VISIT</label>
                  <div className="h-[1px] w-full bg-primary/10" />
               </div>
               <div className="relative group/note">
                 <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={6}
                  placeholder="Tell us more about your style..."
                  className="w-full p-16 bg-white border-2 border-primary/5 rounded-[72px] focus:outline-none focus:border-primary focus:shadow-[0_40px_80px_-20px_rgba(218,165,32,0.1)] transition-all text-2xl font-black uppercase tracking-tight italic placeholder:text-primary/10 selection:bg-primary/10"
                 />
                 <Scissors className="absolute bottom-16 right-16 w-10 h-10 text-primary/5 group-hover/note:text-primary/20 transition-colors" />
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Global Premium Summary - Editorial/Glassmorphism */}
      <div className="fixed bottom-0 left-0 right-0 p-10 sm:p-14 z-[70] translate-y-0 transition-all duration-1000 animate-in slide-in-from-bottom-full duration-1000">
        <div className="container mx-auto max-w-7xl">
           <div className="relative bg-[#1A1A1A]/95 backdrop-blur-[60px] border border-white/10 rounded-[72px] p-12 sm:p-16 flex flex-col md:flex-row items-center justify-between gap-16 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Luxury Detail Patterns */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-[0.03] pointer-events-none" />
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 blur-[100px] -translate-x-1/2 -translate-y-1/2" />
              
              <div className="flex flex-wrap items-center gap-16 md:gap-24 relative z-10">
                 <div className="flex flex-col gap-4">
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.8em] font-mono italic">TOTAL ESTIMATE</p>
                    <div className="flex items-baseline gap-4">
                      <p className="text-6xl md:text-8xl font-heading font-black italic tracking-tighter text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">{formatPrice(totalAmount)}</p>
                      <span className="text-primary text-2xl font-black italic tracking-tighter">VND</span>
                    </div>
                 </div>
                 
                 <div className="h-28 w-[1px] bg-white/10 hidden lg:block" />
                 
                 <div className="flex flex-col gap-4">
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.8em] font-mono italic">DURATION</p>
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-primary" />
                       </div>
                       <p className="text-5xl md:text-6xl font-heading font-black italic tracking-tighter text-white">{totalDuration} <span className="text-2xl text-white/40 uppercase tracking-[0.1em]">MINS</span></p>
                    </div>
                 </div>
              </div>
              
              <button
                onClick={handleContinue}
                disabled={!canContinue()}
                className={cn(
                  "w-full md:w-auto px-24 py-11 rounded-[40px] font-black text-[14px] uppercase tracking-[0.6em] italic flex items-center justify-center gap-10 transition-all duration-700 active:scale-95 shadow-2xl relative group overflow-hidden border-2",
                  canContinue() 
                    ? "bg-primary text-white border-primary shadow-[0_20px_60px_-10px_rgba(218,165,32,0.5)] hover:px-28 hover:shadow-[0_30px_80px_-10px_rgba(218,165,32,0.6)]" 
                    : "bg-white/5 text-white/10 border-white/5 cursor-not-allowed"
                )}
              >
                <span className="relative z-10">{currentStep === 4 ? 'RESERVE NOW' : 'NEXT EXPERIENCES'}</span>
                <ChevronRight className="w-8 h-8 group-hover:translate-x-6 transition-transform duration-700 relative z-10" />
                
                {canContinue() && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[1.2s] ease-in-out" />
                    <div className="absolute inset-0 bg-[#D4AF37] opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                  </>
                )}
              </button>
           </div>
           
           <div className="mt-8 flex justify-center gap-12 text-[10px] font-bold text-primary/30 uppercase tracking-[0.4em] italic leading-none">
              <span>SECURE RESERVATION</span>
              <div className="w-1 h-1 rounded-full bg-primary/20" />
              <span>TERMS & CONDITIONS</span>
              <div className="w-1 h-1 rounded-full bg-primary/20" />
              <span>CANCEL ANYTIME</span>
           </div>
        </div>
      </div>
    </div>
  );
}
