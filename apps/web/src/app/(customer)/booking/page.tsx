'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Scissors, Star, Clock, CalendarDays, User, Sparkles } from 'lucide-react';
import { staffApi, serviceApi, Staff, Service } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, STAFF_POSITIONS, cn } from '@/lib/utils';
import Avatar from '@/components/Avatar';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

const STEP_INFO = [
  { step: 1, label: 'Dịch vụ', icon: Scissors, desc: 'Chọn dịch vụ bạn muốn' },
  { step: 2, label: 'Thợ cắt', icon: User, desc: 'Chọn thợ yêu thích' },
  { step: 3, label: 'Ngày', icon: CalendarDays, desc: 'Chọn ngày phù hợp' },
  { step: 4, label: 'Giờ', icon: Clock, desc: 'Chọn giờ rảnh' },
];

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
      case 2: return true;
      case 3: return !!selectedDate;
      case 4: return !!selectedTimeSlot;
      default: return false;
    }
  };

  const groupedServices = useMemo(() => {
    return services.reduce((acc, service) => {
      const cat = service.category || 'Dịch vụ khác';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services]);

  // Format selected date for display
  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate);
    return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }, [selectedDate]);

  if (!salon) return null;

  const currentStepInfo = STEP_INFO[currentStep - 1];
  const StepIcon = currentStepInfo.icon;

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-32">
      {/* ────── Compact Header ────── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#E8E0D4] sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => (currentStep > 1 ? prevStep() : router.back())}
            className="flex items-center gap-2 text-[#8B7355] hover:text-[#5C4A32] transition-colors -ml-1 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">{currentStep > 1 ? 'Quay lại' : 'Thoát'}</span>
          </button>

          <div className="text-center">
            <h1 className="text-base font-bold text-[#2C1E12] tracking-tight">{salon.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B7355] font-medium">Bước {currentStep}/4</span>
          </div>
        </div>
      </header>

      {/* ────── Progress Stepper ────── */}
      <div className="bg-white border-b border-[#E8E0D4] sticky top-14 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Progress Bar */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex-1 h-1 rounded-full overflow-hidden bg-[#E8E0D4]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    currentStep >= step ? "bg-[#C8A97E] w-full" : "w-0"
                  )}
                />
              </div>
            ))}
          </div>

          {/* Current Step Label */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C8A97E]/10 flex items-center justify-center">
              <StepIcon className="w-4 h-4 text-[#C8A97E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2C1E12]">{currentStepInfo.desc}</p>
              <p className="text-[11px] text-[#8B7355]">Bước {currentStep} — {currentStepInfo.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ────── Main Content ────── */}
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ═══════ Step 1: Services ═══════ */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {Object.entries(groupedServices).map(([category, catServices]) => (
              <div key={category}>
                <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-[#C8A97E] rounded-full" />
                  {category}
                </h3>

                <div className="space-y-2.5">
                  {catServices.map(service => {
                    const selected = isServiceSelected(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={cn(
                          "flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer group",
                          selected
                            ? "border-[#C8A97E] bg-[#C8A97E]/5 shadow-sm"
                            : "border-transparent bg-white hover:border-[#E8E0D4] hover:shadow-sm"
                        )}
                      >
                        {/* Service Image */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 bg-[#F0EBE3]">
                          <Image
                            src={service.image || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=400&auto=format'}
                            alt={service.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Service Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[15px] text-[#2C1E12] leading-tight mb-0.5">{service.name}</h4>
                          <p className="text-xs text-[#8B7355] line-clamp-1">{service.description}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-sm font-bold text-[#C8A97E]">{formatPrice(service.price)}</span>
                            <span className="text-[11px] text-[#8B7355] bg-[#F0EBE3] px-2 py-0.5 rounded-full">{service.duration} phút</span>
                          </div>
                        </div>

                        {/* Checkbox */}
                        <div className={cn(
                          "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                          selected ? "bg-[#C8A97E] border-[#C8A97E]" : "border-[#D4C9BA] group-hover:border-[#C8A97E]"
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

        {/* ═══════ Step 2: Staff ═══════ */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Any Barber */}
              <div
                onClick={() => setStaff(null)}
                className={cn(
                  "relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center gap-3 text-center group",
                  !selectedStaff
                    ? "border-[#C8A97E] bg-[#C8A97E]/5 shadow-sm"
                    : "border-transparent bg-white hover:border-[#E8E0D4] hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                  !selectedStaff ? "bg-[#C8A97E] text-white" : "bg-[#F0EBE3] text-[#C8A97E] group-hover:bg-[#E8E0D4]"
                )}>
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#2C1E12]">Tự động chọn</h4>
                  <p className="text-[11px] text-[#8B7355] mt-0.5">Hệ thống chọn thợ phù hợp</p>
                </div>
                {!selectedStaff && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#C8A97E] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Staff Members */}
              {staff.map(member => {
                const selected = selectedStaff?.id === member.id;
                return (
                  <div
                    key={member.id}
                    onClick={() => setStaff(member)}
                    className={cn(
                      "relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center gap-3 text-center group",
                      selected
                        ? "border-[#C8A97E] bg-[#C8A97E]/5 shadow-sm"
                        : "border-transparent bg-white hover:border-[#E8E0D4] hover:shadow-sm"
                    )}
                  >
                    <Avatar
                      src={member.user.avatar}
                      name={member.user.name}
                      size="lg"
                      variant="circle"
                      className={cn(selected && "ring-2 ring-[#C8A97E] ring-offset-2")}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#2C1E12]">{member.user.name}</h4>
                      <p className="text-[11px] text-[#8B7355] mt-0.5">{STAFF_POSITIONS[member.position]}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-[#C8A97E] fill-[#C8A97E]" />
                        <span className="text-xs font-bold text-[#2C1E12]">{member.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    {selected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-[#C8A97E] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════ Step 3: Date ═══════ */}
        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-7 gap-2">
              {DATES.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={dateStr}
                    onClick={() => setDate(dateStr)}
                    className={cn(
                      "relative flex flex-col items-center py-3 px-1 rounded-xl border-2 transition-all duration-300 cursor-pointer group",
                      isSelected
                        ? "border-[#C8A97E] bg-[#C8A97E] text-white shadow-md"
                        : "border-transparent bg-white hover:border-[#E8E0D4] text-[#2C1E12] hover:shadow-sm"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-bold uppercase mb-1",
                      isSelected ? "text-white/70" : "text-[#8B7355]"
                    )}>{DAYS[date.getDay()]}</span>
                    <span className="text-lg font-bold leading-tight">{date.getDate()}</span>
                    <span className={cn(
                      "text-[9px] mt-0.5",
                      isSelected ? "text-white/70" : "text-[#8B7355]"
                    )}>Th{date.getMonth() + 1}</span>
                    {isToday && (
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-1",
                        isSelected ? "bg-white" : "bg-[#C8A97E]"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════ Step 4: Time ═══════ */}
        {currentStep === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center py-16 gap-4">
                <div className="w-10 h-10 border-3 border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
                <p className="text-sm text-[#8B7355]">Đang tải khung giờ...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#E8E0D4]">
                <CalendarDays className="w-10 h-10 text-[#D4C9BA] mx-auto mb-3" />
                <p className="text-base font-bold text-[#2C1E12]">Hết lịch trống</p>
                <p className="text-sm text-[#8B7355] mt-1">Vui lòng chọn ngày khác</p>
              </div>
            ) : (
              <>
                {/* Time Period Labels */}
                {(() => {
                  const morning = timeSlots.filter(s => s.available && parseInt(s.time) < 12);
                  const afternoon = timeSlots.filter(s => s.available && parseInt(s.time) >= 12 && parseInt(s.time) < 17);
                  const evening = timeSlots.filter(s => s.available && parseInt(s.time) >= 17);
                  const sections = [
                    { label: 'Buổi sáng', slots: morning },
                    { label: 'Buổi chiều', slots: afternoon },
                    { label: 'Buổi tối', slots: evening },
                  ].filter(s => s.slots.length > 0);

                  return sections.map(section => (
                    <div key={section.label}>
                      <h4 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <div className="w-4 h-[2px] bg-[#C8A97E] rounded-full" />
                        {section.label}
                      </h4>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {section.slots.map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => setTimeSlot(slot.time)}
                            className={cn(
                              "py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer border-2",
                              selectedTimeSlot === slot.time
                                ? "bg-[#C8A97E] border-[#C8A97E] text-white shadow-md"
                                : "bg-white border-transparent text-[#2C1E12] hover:border-[#E8E0D4] hover:shadow-sm"
                            )}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ));
                })()}

                {/* Note */}
                <div>
                  <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <div className="w-4 h-[2px] bg-[#C8A97E] rounded-full" />
                    Ghi chú cho thợ (tuỳ chọn)
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={3}
                    placeholder="VD: Tôi muốn kiểu undercut fade thấp..."
                    className="w-full p-4 bg-white border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E]/20 transition-all text-sm text-[#2C1E12] placeholder:text-[#C4B9A8] resize-none"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ────── Sticky Bottom Bar ────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#E8E0D4] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Summary */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              {selectedServices.length > 0 ? (
                <>
                  <p className="text-[11px] text-[#8B7355] font-medium">
                    {selectedServices.length} dịch vụ · {totalDuration} phút
                  </p>
                  <p className="text-lg font-bold text-[#2C1E12] tracking-tight leading-tight">
                    {formatPrice(totalAmount)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#8B7355]">Chưa chọn dịch vụ</p>
              )}
            </div>

            {/* Mini selected info chips */}
            {currentStep >= 3 && selectedDate && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#8B7355] bg-[#F0EBE3] px-2.5 py-1 rounded-full shrink-0">
                <CalendarDays className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>
            )}
            {currentStep >= 4 && selectedTimeSlot && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#8B7355] bg-[#F0EBE3] px-2.5 py-1 rounded-full shrink-0">
                <Clock className="w-3 h-3" />
                <span>{selectedTimeSlot}</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleContinue}
            disabled={!canContinue()}
            className={cn(
              "shrink-0 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 cursor-pointer",
              canContinue()
                ? "bg-[#C8A97E] text-white hover:bg-[#B8975E] active:scale-[0.98] shadow-sm"
                : "bg-[#E8E0D4] text-[#B8A98C] cursor-not-allowed"
            )}
          >
            {currentStep === 4 ? 'Xác nhận đặt lịch' : 'Tiếp tục'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
