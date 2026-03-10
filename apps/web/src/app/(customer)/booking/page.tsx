'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Scissors } from 'lucide-react';
import { staffApi, Staff } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, STAFF_POSITIONS, cn } from '@/lib/utils';

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
  } = useBookingStore();

  const DATES = useMemo(() => {
    if (!salon) return [];
    const dates = [];
    const today = new Date();

    // Check if today is past working hours
    const now = new Date();
    let isPastWorkingHours = false;

    let closeTime = salon.closeTime;
    if (now.getDay() === 0) {
      // Sunday works only morning (ends at 12:00)
      closeTime = '12:00';
    }

    if (closeTime) {
      const [h, m] = closeTime.split(':').map(Number);
      const closeDate = new Date();
      closeDate.setHours(h, m, 0, 0);

      // If current time + minimum booking duration >= closing time, we can't book today
      // Setting a 1 hour buffer
      closeDate.setHours(closeDate.getHours() - 1);
      if (now >= closeDate) {
        isPastWorkingHours = true;
      }
    }

    let startOffset = isPastWorkingHours ? 1 : 0;

    for (let i = startOffset; i < 14 + startOffset; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [salon]);

  const [staff, setStaffList] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    if (!salon) return;
    try {
      const data = await staffApi.getBySalon(salon.id);
      // Filter out only stylist/barber roles
      const barbers = data.filter(staff => {
        const role = staff.position.toUpperCase();
        return role === 'STYLIST' || role === 'SENIOR_STYLIST' || role === 'MASTER_STYLIST';
      });
      setStaffList(barbers);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
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
        // Filter out past slots with a 1-hour buffer like Zalo Mini App
        const now = new Date();
        now.setHours(now.getHours() + 1);

        const filteredData = slotsData.map((slot: { time: string; available: boolean }) => {
          const [h, m] = slot.time.split(':').map(Number);
          const slotTime = new Date();
          slotTime.setHours(h, m, 0, 0);

          if (slotTime < now) {
            return { ...slot, available: false };
          }
          return slot;
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
    // Redirect if no salon or services selected
    if (!salon || selectedServices.length === 0) {
      router.push('/salons');
      return;
    }
    void fetchStaff();
  }, [fetchStaff, router, salon, selectedServices.length]);

  useEffect(() => {
    if (selectedDate && salon) {
      void fetchTimeSlots();
    }
  }, [fetchTimeSlots, selectedDate, salon]);

  const handleContinue = () => {
    if (currentStep === 3) {
      router.push('/booking/confirm');
    } else {
      nextStep();
    }
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return true; // Staff is optional
      case 2:
        return !!selectedDate;
      case 3:
        return !!selectedTimeSlot;
      default:
        return false;
    }
  };

  if (!salon) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-96">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-3xl border-b border-border sticky top-0 z-50 transition-all duration-700">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => (currentStep > 1 ? prevStep() : router.back())}
            className="flex items-center gap-3 text-muted-foreground/40 hover:text-primary transition-all duration-500 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] font-mono italic">GO BACK</span>
          </button>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="bg-background/80 backdrop-blur-3xl sticky top-[84px] z-40 border-b border-border shadow-sm overflow-x-auto no-scrollbar py-10 transition-all duration-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative px-10">
            {/* Background Line */}
            <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-border/20 -translate-y-1/2 z-0" />
            
            {[
              { step: 1, label: 'BƯỚC 1', sub: 'THỢ CẠO' },
              { step: 2, label: 'BƯỚC 2', sub: 'NGÀY HỨT' },
              { step: 3, label: 'BƯỚC 3', sub: 'GIỜ ĐẸP' },
            ].map((item) => {
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;
              
              return (
                <div key={item.step} className="relative z-10 flex flex-col items-center">
                  <button
                    onClick={() => (isCompleted || isActive) && setStep(item.step)}
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-1000 font-bold text-[11px] tracking-widest relative overflow-hidden',
                      isActive 
                        ? 'bg-primary text-background shadow-2xl shadow-primary/30 scale-125 border-2 border-primary' 
                        : isCompleted 
                          ? 'bg-foreground text-background border-2 border-foreground' 
                          : 'bg-background text-muted-foreground/30 border-2 border-border/50'
                    )}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : item.step}
                  </button>
                  <div className="absolute top-16 flex flex-col items-center w-32">
                    <span className={cn(
                      "text-[8px] font-bold tracking-[0.4em] transition-all duration-700 mb-1 font-mono",
                      isActive ? "text-primary" : "text-muted-foreground/20"
                    )}>
                      {item.label}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-700 whitespace-nowrap italic",
                      isActive ? "text-foreground" : "text-muted-foreground/20"
                    )}>
                      {item.sub}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-10" /> {/* Spacer for labels */}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="text-center mb-16">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mb-4 block">SELECT STYLIST</span>
              <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight leading-none mb-4 uppercase">THỢ CẠO TIN DÙNG</h2>
              <div className="w-12 h-0.5 bg-primary mx-auto" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
              {/* Any Stylist option */}
              <div
                onClick={() => setStaff(null)}
                className={cn(
                  'bg-background rounded-[48px] p-10 cursor-pointer transition-all duration-700 border-2 relative group overflow-hidden flex flex-col items-center text-center',
                  !selectedStaff
                    ? 'border-primary shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] bg-accent/5'
                    : 'border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-foreground/5'
                )}
              >
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-28 h-28 rounded-[32px] bg-primary/5 border border-primary/20 flex items-center justify-center text-5xl mb-8 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0">
                    🎩
                  </div>
                  <h4 className="font-heading font-bold text-2xl text-foreground tracking-tight mb-2 uppercase italic">CHỌN NGẪU NHIÊN</h4>
                  <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em] italic mb-8">Xếp thợ giỏi nhất cho bạn</p>
                  <div className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                    !selectedStaff ? "bg-primary border-primary text-background shadow-xl shadow-primary/30" : "border-border text-transparent"
                  )}>
                    <Check className="w-6 h-6" />
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-8 text-4xl text-primary/5 font-black uppercase select-none pointer-events-none">ANY</div>
              </div>

              {staff.map((member, idx) => (
                <div
                  key={member.id}
                  onClick={() => setStaff(member)}
                  className={cn(
                    'bg-background rounded-[48px] p-10 cursor-pointer transition-all duration-700 border-2 relative group overflow-hidden animate-in fade-in slide-in-from-bottom-8 flex flex-col items-center text-center',
                    selectedStaff?.id === member.id
                      ? 'border-primary shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] bg-accent/5'
                      : 'border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-foreground/5'
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-accent/5 relative mb-8 group-hover:scale-110 transition-transform duration-1000 border-4 border-background shadow-xl">
                      {member.user.avatar ? (
                        <Image
                          src={member.user.avatar}
                          alt={member.user.name}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                          sizes="112px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-accent/5 text-primary/20">
                          👤
                        </div>
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-2xl text-foreground tracking-tight mb-1 uppercase italic">{member.user.name}</h4>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-mono mb-6 italic">
                      {STAFF_POSITIONS[member.position]?.toUpperCase() || member.position.toUpperCase()}
                    </p>
                    <div className="flex items-center gap-2 mb-8 px-5 py-2 bg-accent/5 rounded-full border border-border">
                       <span className="text-foreground text-[10px] font-bold uppercase tracking-widest italic">★ {member.rating.toFixed(1)}</span>
                       <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-tight">({member.totalReviews})</span>
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                      selectedStaff?.id === member.id ? "bg-primary border-primary text-background shadow-xl shadow-primary/30" : "border-border text-transparent"
                    )}>
                      <Check className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Date */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="text-center mb-16">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mb-4 block">PICK A DATE</span>
              <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight leading-none mb-4 uppercase">CHỌN NGÀY ĐẸP</h2>
              <div className="w-12 h-0.5 bg-primary mx-auto" />
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-6 max-w-5xl mx-auto">
              {DATES.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={dateStr}
                    onClick={() => setDate(dateStr)}
                    className={cn(
                      'p-8 rounded-[40px] transition-all duration-1000 text-center flex flex-col items-center justify-center border-2 animate-in fade-in scale-95 relative overflow-hidden',
                      isSelected 
                        ? 'bg-primary border-primary text-background shadow-2xl shadow-primary/30 scale-110 z-10' 
                        : 'bg-background border-border text-foreground hover:border-primary/40 hover:shadow-2xl hover:shadow-foreground/5 italic'
                    )}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <p
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-[0.2em] mb-3 font-mono',
                        isSelected ? 'text-background/40' : 'text-muted-foreground/30'
                      )}
                    >
                      {DAYS[date.getDay()]}
                    </p>
                    <p
                      className={cn(
                        'text-4xl font-heading font-bold tracking-tighter mb-4 leading-none',
                        isSelected ? 'text-background' : 'text-foreground'
                      )}
                    >
                      {date.getDate()}
                    </p>
                    {isToday && (
                      <span className={cn(
                        'text-[7px] font-bold uppercase tracking-[0.3em] px-3 py-1.5 rounded-full font-mono transition-all', 
                        isSelected ? 'bg-background/10 text-background' : 'bg-primary/10 text-primary'
                      )}>
                        TODAY
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Choose Time */}
        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="text-center mb-16">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mb-4 block">SELECT TIME</span>
              <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight leading-none mb-4 uppercase">CHỌN GIỜ ĐẸP</h2>
              <div className="w-12 h-0.5 bg-primary mx-auto" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-8">
                <div className="w-16 h-16 border-[6px] border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">ĐANG TÌM GIỜ CÒN TRỐNG...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-black uppercase tracking-widest">Không còn giờ rảnh, vui lòng chọn ngày khác</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 max-w-6xl mx-auto">
                {timeSlots.map((slot, idx) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setTimeSlot(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      'py-6 rounded-[24px] text-2xl font-heading font-bold transition-all duration-700 border-2 animate-in zoom-in-95 italic',
                      selectedTimeSlot === slot.time
                        ? 'bg-primary border-primary text-background shadow-2xl shadow-primary/30 scale-110 z-10'
                        : slot.available
                          ? 'bg-background border-border text-foreground hover:border-primary/50 hover:text-primary hover:tracking-widest'
                          : 'bg-accent/5 border-transparent text-muted-foreground/10 cursor-not-allowed hidden'
                    )}
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}

            {/* Note */}
            <div className="mt-20 max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-10 h-[1px] bg-primary/40" />
                 <label className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.5em] italic font-mono">
                   SPECIAL INSTRUCTIONS
                 </label>
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="VÍ DỤ: TÓC TÔI DÀY, MUỐN CẮT KIỂU UNDERCUT BỒNG BỀNH..."
                rows={4}
                className="w-full p-8 bg-accent/5 border-2 border-border rounded-[32px] focus:outline-none focus:border-primary focus:bg-background transition-all text-foreground text-sm font-bold uppercase tracking-tight placeholder:text-muted-foreground/20 italic"
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Global Summary Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-3xl border-t border-border shadow-[0_-32px_96px_-16px_rgba(0,0,0,0.1)] py-6 px-4 sm:px-6 z-50">
        <div className="container mx-auto max-w-lg">
          {/* Tighter Summary Bar */}
          <div className="flex items-center justify-between mb-6 bg-foreground text-background p-4 sm:p-5 rounded-[24px] shadow-2xl shadow-foreground/20 relative overflow-hidden border border-primary/20 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-background/5 border border-background/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-background/30 uppercase tracking-[0.3em] font-mono italic">TOTAL AMOUNT</p>
                <p className="text-xl font-heading font-bold tracking-tighter italic">{formatPrice(totalAmount)}</p>
              </div>
            </div>
            <div className="text-right relative z-10 border-l border-background/10 pl-6">
              <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">{totalDuration} MINS</p>
              <p className="text-[8px] font-bold text-background/20 truncate max-w-[100px] uppercase tracking-widest font-mono italic">{salon.name}</p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!canContinue()}
            className={cn(
              'w-full py-5 rounded-full font-bold text-[10px] flex items-center justify-center gap-3 transition-all duration-1000 active:scale-95 transform hover:-translate-y-1 uppercase tracking-[0.3em] italic shadow-2xl relative overflow-hidden group',
              canContinue()
                ? 'bg-primary text-background shadow-primary/30 hover:tracking-[0.5em] border-2 border-primary'
                : 'bg-accent/5 text-muted-foreground/20 cursor-not-allowed border-2 border-border/50'
            )}
          >
            {currentStep === 3 ? 'KẾT THÚC ĐẶT LỊCH' : 'TIẾP TỤC BƯỚC SAU'}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
