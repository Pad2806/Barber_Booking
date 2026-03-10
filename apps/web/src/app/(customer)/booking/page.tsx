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
    <div className="min-h-screen bg-background pb-80">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-3xl border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-8 flex items-center justify-between">
          <button
            onClick={() => (currentStep > 1 ? prevStep() : router.back())}
            className="flex items-center gap-3 text-muted-foreground/40 hover:text-primary transition-all group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] font-mono italic">THOÁT</span>
          </button>
          <div className="text-center">
             <p className="text-[8px] font-bold text-primary uppercase tracking-[0.6em] mb-1">PREMIUM BARBER</p>
             <h3 className="text-lg font-heading font-black uppercase tracking-tight italic text-foreground tracking-[-0.05em]">{salon.name}</h3>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Premium Stepper */}
      <div className="bg-background sticky top-[95px] z-40 border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto py-8">
            {[
              { step: 1, label: 'DỊCH VỤ' },
              { step: 2, label: 'THỢ CẠO' },
              { step: 3, label: 'NGÀY' },
              { step: 4, label: 'GIỜ' },
            ].map((item) => {
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;
              return (
                <div key={item.step} className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-700",
                    isActive ? "bg-primary text-background shadow-2xl shadow-primary/30 scale-110" : isCompleted ? "bg-foreground text-background" : "bg-accent/5 text-muted-foreground/30 border border-border"
                  )}>
                    {isCompleted ? <Check className="w-5 h-5" /> : item.step}
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold tracking-[0.2em] italic uppercase",
                    isActive ? "text-foreground" : "text-muted-foreground/20"
                  )}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        {/* Step 1: Services */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 max-w-5xl mx-auto">
             <div className="text-center mb-24">
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.6em] mb-4 block">SELECT EXPERIENCES</span>
              <h2 className="text-5xl font-heading font-bold text-foreground tracking-tighter leading-none mb-6 uppercase italic">CHỌN DỊCH VỤ</h2>
              <div className="w-20 h-1 bg-primary mx-auto" />
            </div>

            <div className="space-y-24">
              {Object.entries(groupedServices).map(([category, catServices]) => (
                <div key={category}>
                   <h3 className="text-[11px] font-black text-primary/40 uppercase tracking-[0.5em] mb-10 italic border-l-4 border-primary/20 pl-6">{category}</h3>
                   <div className="grid md:grid-cols-2 gap-8">
                    {catServices.map(service => (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={cn(
                          "p-8 rounded-[48px] border-2 transition-all duration-700 cursor-pointer flex gap-8 group relative overflow-hidden",
                          isServiceSelected(service.id) ? "border-primary bg-accent/5 ring-8 ring-primary/5 shadow-2xl" : "border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-foreground/5"
                        )}
                      >
                        <div className="w-32 h-32 rounded-[32px] overflow-hidden relative shrink-0 bg-accent/5">
                          <Image 
                            src={service.image || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800&auto=format'} 
                            alt={service.name} 
                            fill 
                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-2">
                          <div>
                            <h4 className="font-heading font-bold text-2xl text-foreground uppercase tracking-tight italic group-hover:text-primary transition-colors mb-2">{service.name}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic line-clamp-2">{service.description}</p>
                          </div>
                          <div className="flex items-end justify-between mt-6">
                             <div className="flex flex-col">
                               <span className="text-[8px] font-bold text-primary/40 uppercase tracking-widest italic mb-1">PRICE</span>
                               <span className="text-3xl font-heading font-black text-foreground tracking-tighter">{formatPrice(service.price)}</span>
                             </div>
                             <span className="text-[10px] font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10 uppercase tracking-[0.2em] italic transition-all group-hover:tracking-[0.3em]">
                                {service.duration} MINS
                             </span>
                          </div>
                        </div>
                        {isServiceSelected(service.id) && (
                          <div className="absolute top-6 right-6 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/30 scale-110">
                            <Check className="w-5 h-5 text-background" />
                          </div>
                        )}
                      </div>
                    ))}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Staff */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 max-w-6xl mx-auto">
             <div className="text-center mb-24">
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.6em] mb-4 block">CHOOSE YOUR STYLIST</span>
              <h2 className="text-5xl font-heading font-bold text-foreground tracking-tighter leading-none mb-6 uppercase italic">THỢ CẠO TIN DÙNG</h2>
              <div className="w-20 h-1 bg-primary mx-auto" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               <div
                  onClick={() => setStaff(null)}
                  className={cn(
                    "p-10 rounded-[56px] border-2 transition-all duration-700 cursor-pointer text-center flex flex-col items-center gap-8 group overflow-hidden relative",
                    !selectedStaff ? "border-primary bg-accent/5 ring-8 ring-primary/5 shadow-2xl" : "border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-foreground/5"
                  )}
               >
                  <Avatar size="xl" variant="square" name="ANY" className={cn(!selectedStaff ? 'border-primary ring-4 ring-primary/20' : 'group-hover:ring-4 group-hover:ring-primary/10')} />
                  <div className="space-y-2 relative z-10">
                    <h4 className="font-heading font-bold text-2xl uppercase tracking-tighter italic leading-none">ANY BARBER</h4>
                    <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em] italic leading-relaxed">System pick best barber</p>
                  </div>
                  <div className="absolute top-0 right-0 p-8 text-5xl text-primary/5 font-black uppercase select-none pointer-events-none tracking-tighter">RT</div>
               </div>
               {staff.map(member => (
                 <div
                    key={member.id}
                    onClick={() => setStaff(member)}
                    className={cn(
                      "p-10 rounded-[56px] border-2 transition-all duration-700 cursor-pointer text-center flex flex-col items-center gap-8 group relative overflow-hidden",
                      selectedStaff?.id === member.id ? "border-primary bg-accent/5 ring-8 ring-primary/5 shadow-2xl" : "border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-foreground/5"
                    )}
                 >
                    <Avatar src={member.user.avatar} name={member.user.name} size="xl" variant="square" className={cn(selectedStaff?.id === member.id ? 'border-primary ring-4 ring-primary/20' : 'group-hover:ring-4 group-hover:ring-primary/10')} />
                    <div className="space-y-2 relative z-10">
                      <h4 className="font-heading font-bold text-2xl uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors">{member.user.name}</h4>
                      <p className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em] italic border-t border-primary/10 pt-2 inline-block">
                        {STAFF_POSITIONS[member.position]}
                      </p>
                    </div>
                    <div className="absolute top-10 right-10 flex items-center gap-1.5 px-3 py-1 bg-background/50 backdrop-blur-md rounded-full border border-border">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-[10px] font-bold italic">{member.rating.toFixed(1)}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Step 3: Date */}
        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 max-w-5xl mx-auto">
             <div className="text-center mb-24">
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.6em] mb-4 block">PICK YOUR SCHEDULE</span>
              <h2 className="text-5xl font-heading font-bold text-foreground tracking-tighter leading-none mb-6 uppercase italic text-[4rem]">CHỌN NGÀY</h2>
              <div className="w-20 h-1 bg-primary mx-auto" />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-6">
               {DATES.map(date => {
                 const dateStr = date.toISOString().split('T')[0];
                 const isSelected = selectedDate === dateStr;
                 const isToday = dateStr === new Date().toISOString().split('T')[0];
                 
                 return (
                    <button
                      key={dateStr}
                      onClick={() => setDate(dateStr)}
                      className={cn(
                        "p-10 rounded-[48px] border-2 transition-all duration-700 flex flex-col items-center justify-center gap-4 group relative overflow-hidden",
                        isSelected ? "bg-primary border-primary text-background shadow-2xl shadow-primary/40 scale-105 z-10" : "bg-background border-border text-foreground hover:border-primary/40 hover:shadow-2xl hover:-translate-y-2"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.3em] font-mono italic",
                        isSelected ? "text-background/50" : "text-muted-foreground/30"
                      )}>{DAYS[date.getDay()]}</span>
                      <span className="text-5xl font-heading font-black tracking-tighter leading-none">{date.getDate()}</span>
                      {isToday && (
                        <span className={cn(
                          "absolute top-4 right-4 text-[7px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest",
                          isSelected ? "bg-background/20 text-background" : "bg-primary/10 text-primary"
                        )}>TODAY</span>
                      )}
                    </button>
                 );
               })}
            </div>
          </div>
        )}

        {/* Step 4: Time */}
        {currentStep === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 max-w-5xl mx-auto">
             <div className="text-center mb-24">
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.6em] mb-4 block">PICK THE TIME</span>
              <h2 className="text-5xl font-heading font-bold text-foreground tracking-tighter leading-none mb-6 uppercase italic">GIỜ ĐẸP</h2>
              <div className="w-20 h-1 bg-primary mx-auto" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-32 gap-8 opacity-40">
                <Scissors className="w-16 h-16 animate-bounce text-primary" />
                <p className="text-[10px] font-bold italic tracking-[1em] uppercase">Scanning Slots...</p>
              </div>
            ) : timeSlots.length === 0 ? (
               <div className="text-center py-32 italic text-muted-foreground/20 uppercase tracking-[0.5em] text-2xl font-black">Day Fully Booked</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
                {timeSlots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setTimeSlot(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      "py-8 rounded-[32px] font-heading font-bold text-3xl italic transition-all duration-700 border-2 relative overflow-hidden group",
                      selectedTimeSlot === slot.time ? "bg-primary border-primary text-background shadow-2xl shadow-primary/40 scale-105 z-10" : slot.available ? "bg-background border-border text-foreground hover:border-primary/50 hover:text-primary hover:tracking-widest" : "hidden"
                    )}
                  >
                    {slot.time}
                    {selectedTimeSlot === slot.time && (
                       <Check className="absolute top-2 right-2 w-4 h-4 text-background/40" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-32 max-w-3xl mx-auto">
               <div className="flex items-center gap-6 mb-10 px-10">
                  <div className="w-12 h-[2px] bg-primary/20" />
                  <label className="text-[11px] font-black text-primary/40 uppercase tracking-[0.6em] italic font-mono">Special Instructions</label>
               </div>
               <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={5}
                placeholder="Ex: I want a vintage undercut with low fade..."
                className="w-full p-12 bg-accent/5 border-2 border-border rounded-[56px] focus:outline-none focus:border-primary focus:bg-background transition-all text-lg font-bold uppercase tracking-tight italic placeholder:text-muted-foreground/10"
               />
            </div>
          </div>
        )}
      </div>

      {/* Floating Global Premium Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-3xl border-t border-border p-8 sm:p-12 z-50 shadow-[0_-32px_128px_-16px_rgba(0,0,0,0.15)] transition-all duration-1000 translate-y-0 translate-y-in shadow-2xl">
        <div className="container mx-auto max-w-4xl flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-16">
             <div className="flex flex-col gap-2">
                <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.5em] font-mono italic">EST. TOTAL AMOUNT</p>
                <p className="text-4xl font-heading font-black italic tracking-tighter text-foreground">{formatPrice(totalAmount)}</p>
             </div>
             <div className="h-16 w-[1px] bg-border opacity-20" />
             <div className="flex flex-col gap-2">
                <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.5em] font-mono italic">DURATION</p>
                <div className="flex items-center gap-3">
                   <Clock className="w-4 h-4 text-primary" />
                   <p className="text-4xl font-heading font-black italic tracking-tighter text-foreground">{totalDuration} MINS</p>
                </div>
             </div>
          </div>
          
          <button
            onClick={handleContinue}
            disabled={!canContinue()}
            className={cn(
              "w-full md:w-auto px-16 py-7 rounded-full font-black text-[11px] uppercase tracking-[0.5em] italic flex items-center justify-center gap-6 transition-all duration-1000 active:scale-95 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative group overflow-hidden border-2",
              canContinue() ? "bg-primary text-background border-primary shadow-primary/30 hover:px-20" : "bg-accent/5 text-muted-foreground/10 border-border cursor-not-allowed"
            )}
          >
            {currentStep === 4 ? 'KẾT THÚC ĐẶT LỊCH' : 'TIẾP TỤC BƯỚC SAU'}
            <ChevronRight className="w-6 h-6 group-hover:translate-x-4 transition-transform duration-700" />
            {canContinue() && (
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
