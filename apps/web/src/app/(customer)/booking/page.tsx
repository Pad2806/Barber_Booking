'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Scissors, Star, CalendarDays, Sparkles, X, MessageSquare, Eye } from 'lucide-react';
import { staffApi, serviceApi, Staff } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, STAFF_POSITIONS, cn } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import BarberProfileSheet from '@/components/booking/BarberProfileSheet';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const FULL_DAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

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
  } = useBookingStore();

  const [staff, setStaffList] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [profileStaffId, setProfileStaffId] = useState<string | null>(null);

  // This page uses 2 internal steps mapped to store's currentStep:
  // Internal step 1 → store step 1 (Choose barber)
  // Internal step 2 → store step 2 (Choose date+time)
  // Services are pre-selected from salon detail page

  const DATES = useMemo(() => {
    if (!salon) return [];
    const dates = [];
    const now = dayjs.tz(undefined, VIETNAM_TZ);
    const today = now.startOf('day');
    let startOffset = 0;

    const closeTime = salon.closeTime;
    if (closeTime) {
      const [h, m] = closeTime.split(':').map(Number);
      const closeTimeToday = today.set('hour', h).set('minute', m);
      // If now is less than 1 hour before closing, start from tomorrow
      if (now.isAfter(closeTimeToday.subtract(1, 'hour'))) {
        startOffset = 1;
      }
    }

    for (let i = startOffset; i < 14 + startOffset; i++) {
      dates.push(today.add(i, 'day'));
    }
    return dates;
  }, [salon]);

  const fetchData = useCallback(async () => {
    if (!salon) return;
    try {
      setLoading(true);
      const [_, staffData] = await Promise.all([
        serviceApi.getBySalon(salon.id),
        staffApi.getBySalon(salon.id),
      ]);

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
      const todayStr = dayjs.tz(undefined, VIETNAM_TZ).format('YYYY-MM-DD');
      const isToday = selectedDate === todayStr;
      
      if (isToday) {
        const now = dayjs.tz(undefined, VIETNAM_TZ);
        const limit = now.add(1, 'hour');
        
        const filteredData = slotsData.map((slot: any) => {
          const time = typeof slot === 'string' ? slot : slot.time;
          const [h, m] = time.split(':').map(Number);
          const slotTime = dayjs.tz(selectedDate, VIETNAM_TZ).set('hour', h).set('minute', m);
          return slotTime.isBefore(limit) 
            ? { time, available: false } 
            : { time, available: true };
        });
        setTimeSlots(filteredData);
      } else {
        const formattedSlots = slotsData.map((slot: any) => 
          typeof slot === 'string' ? { time: slot, available: true } : slot
        );
        setTimeSlots(formattedSlots);
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
    // If no services selected, go back to salon detail
    if (selectedServices.length === 0) {
      router.back();
      return;
    }
    void fetchData();
    // Set step to 1 on mount
    setStep(1);
  }, [salon, router, selectedServices.length, fetchData, setStep]);

  useEffect(() => {
    if (selectedDate && salon) {
      void fetchTimeSlots();
    }
  }, [fetchTimeSlots, selectedDate, salon]);

  // Map internal 2-step flow
  const internalStep = currentStep <= 1 ? 1 : 2;
  const totalSteps = 2;

  const handleBack = () => {
    if (internalStep === 2) {
      setStep(1);
    } else {
      router.back();
    }
  };

  const handleContinue = () => {
    if (internalStep === 1) {
      // Move to date+time step
      setStep(2);
    } else {
      // Confirm booking
      router.push('/booking/confirm');
    }
  };

  const canContinue = () => {
    if (internalStep === 1) return true; // Staff is optional
    return !!selectedDate && !!selectedTimeSlot;
  };

  // Format selected date for display
  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    // Use dayjs to parse date string strictly to avoid timezone shift
    const d = dayjs.tz(selectedDate, VIETNAM_TZ);
    return `${FULL_DAYS[d.day()]}, ${d.date()} ${MONTHS[d.month()]}`;
  }, [selectedDate]);

  // Time sections
  const timeSections = useMemo(() => {
    const morning = timeSlots.filter(s => s.available && parseInt(s.time.split(':')[0]) < 12);
    const afternoon = timeSlots.filter(s => s.available && parseInt(s.time.split(':')[0]) >= 12 && parseInt(s.time.split(':')[0]) < 16);
    const evening = timeSlots.filter(s => s.available && parseInt(s.time.split(':')[0]) >= 16);
    return [
      { label: 'Sáng', slots: morning, icon: '🌅' },
      { label: 'Chiều', slots: afternoon, icon: '☀️' },
      { label: 'Tối', slots: evening, icon: '🌙' },
    ].filter(s => s.slots.length > 0);
  }, [timeSlots]);

  if (!salon) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      {/* ─── Header ─── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#E8E0D4] sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-[#8B7355] hover:text-[#5C4A32] transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">{internalStep > 1 ? 'Quay lại' : 'Thoát'}</span>
          </button>
          <div className="text-center">
            <h1 className="text-[15px] font-bold text-[#2C1E12]">Đặt lịch hẹn</h1>
          </div>
          <span className="text-xs text-[#8B7355] font-medium tabular-nums">{internalStep}/{totalSteps}</span>
        </div>
      </header>

      {/* ─── Progress ─── */}
      <div className="bg-white border-b border-[#E8E0D4] sticky top-14 z-40">
        <div className="max-w-2xl mx-auto px-4 py-2.5">
          <div className="flex gap-2">
            <div className="flex-1 h-1 rounded-full bg-[#C8A97E]" />
            <div className={cn("flex-1 h-1 rounded-full transition-colors duration-500", internalStep >= 2 ? "bg-[#C8A97E]" : "bg-[#E8E0D4]")} />
          </div>
        </div>
      </div>

      {/* ─── Selected Services Summary (Always visible) ─── */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
        <div className="bg-white rounded-2xl border border-[#E8E0D4] p-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5" />
              Dịch vụ đã chọn
            </h3>
            <button
              onClick={() => router.back()}
              className="text-[11px] font-medium text-[#C8A97E] hover:text-[#B8975E] cursor-pointer transition-colors"
            >
              Thay đổi
            </button>
          </div>
          <div className="space-y-2">
            {selectedServices.map(service => (
              <div key={service.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden relative bg-[#F0EBE3] shrink-0">
                    <Image
                      src={service.image || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=200&auto=format'}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#2C1E12]">{service.name}</p>
                    <p className="text-[11px] text-[#8B7355]">{service.duration} phút</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#2C1E12]">{formatPrice(service.price)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#E8E0D4] flex items-center justify-between">
            <span className="text-xs text-[#8B7355]">{selectedServices.length} dịch vụ · {totalDuration} phút</span>
            <span className="text-sm font-bold text-[#C8A97E]">{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* ═══ Step 1: Choose Barber ═══ */}
        {internalStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
            <h2 className="text-base font-bold text-[#2C1E12] mb-1">Chọn thợ cắt</h2>
            <p className="text-sm text-[#8B7355] mb-4">Bạn có thể để hệ thống tự chọn hoặc chọn thợ yêu thích</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Auto-assign */}
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
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                  !selectedStaff ? "bg-[#C8A97E] text-white" : "bg-[#F0EBE3] text-[#C8A97E] group-hover:bg-[#E8E0D4]"
                )}>
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#2C1E12]">Tự động</h4>
                  <p className="text-[11px] text-[#8B7355] mt-0.5">Chọn thợ phù hợp nhất</p>
                </div>
                {!selectedStaff && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#C8A97E] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Staff */}
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
                    <button
                      onClick={(e) => { e.stopPropagation(); setProfileStaffId(member.id); }}
                      className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#C8A97E] hover:text-[#B8975E] transition-colors"
                    >
                      <Eye className="w-3 h-3" /> Xem hồ sơ
                    </button>
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

        {/* ═══ Step 2: Date + Time (Combined) ═══ */}
        {internalStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 text-left">

            {/* ── Date Selection ── */}
            <div>
              <h2 className="text-base font-bold text-[#2C1E12] mb-1">Chọn ngày</h2>
              <p className="text-sm text-[#8B7355] mb-4">14 ngày tiếp theo</p>

              <div className="grid grid-cols-7 gap-1.5">
                {DATES.map(date => {
                  const dateStr = date.format('YYYY-MM-DD');
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === dayjs.tz(undefined, VIETNAM_TZ).format('YYYY-MM-DD');

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setDate(dateStr)}
                      className={cn(
                        "relative flex flex-col items-center py-2.5 px-1 rounded-xl border-2 transition-all duration-300 cursor-pointer",
                        isSelected
                          ? "border-[#C8A97E] bg-[#C8A97E] text-white shadow-sm"
                          : "border-transparent bg-white hover:border-[#E8E0D4] text-[#2C1E12] hover:shadow-sm"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold uppercase mb-0.5",
                        isSelected ? "text-white/70" : "text-[#8B7355]"
                      )}>{DAYS[date.day()]}</span>
                      <span className="text-base font-bold leading-tight">{date.date()}</span>
                      {isToday && (
                        <div className={cn(
                          "w-1 h-1 rounded-full mt-0.5",
                          isSelected ? "bg-white" : "bg-[#C8A97E]"
                        )} />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <p className="text-sm text-[#C8A97E] font-medium mt-3 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formattedDate}
                </p>
              )}
            </div>

            {/* ── Time Selection (auto-shows after date) ── */}
            {selectedDate && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-base font-bold text-[#2C1E12] mb-1">Chọn giờ</h2>
                <p className="text-sm text-[#8B7355] mb-4">Các khung giờ còn trống</p>

                {loading ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <div className="w-8 h-8 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
                    <p className="text-sm text-[#8B7355]">Đang tải...</p>
                  </div>
                ) : timeSections.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-[#E8E0D4]">
                    <CalendarDays className="w-8 h-8 text-[#D4C9BA] mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#2C1E12]">Hết lịch trống</p>
                    <p className="text-xs text-[#8B7355] mt-1">Vui lòng chọn ngày khác</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeSections.map(section => (
                      <div key={section.label}>
                        <h4 className="text-xs font-bold text-[#8B7355] mb-2 flex items-center gap-1.5">
                          <span>{section.icon}</span>
                          {section.label}
                          <span className="text-[#C4B9A8] font-normal">({section.slots.length} khung giờ)</span>
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                          {section.slots.map(slot => (
                            <button
                              key={slot.time}
                              onClick={() => setTimeSlot(slot.time)}
                              className={cn(
                                "py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer border-2",
                                selectedTimeSlot === slot.time
                                  ? "bg-[#C8A97E] border-[#C8A97E] text-white shadow-sm"
                                  : "bg-white border-transparent text-[#2C1E12] hover:border-[#E8E0D4] hover:shadow-sm"
                              )}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Note (collapsible) ── */}
            {selectedTimeSlot && (
              <div className="animate-in fade-in duration-500">
                {!showNoteInput ? (
                  <button
                    onClick={() => setShowNoteInput(true)}
                    className="flex items-center gap-2 text-sm text-[#8B7355] hover:text-[#C8A97E] transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Thêm ghi chú cho thợ cắt</span>
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#8B7355] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Ghi chú (tuỳ chọn)
                      </label>
                      <button onClick={() => { setShowNoteInput(false); setNote(''); }} className="text-[#8B7355] hover:text-[#5C4A32] cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={2}
                      placeholder="VD: Tôi muốn kiểu undercut fade thấp..."
                      className="w-full p-3 bg-white border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E]/20 transition-all text-sm text-[#2C1E12] placeholder:text-[#C4B9A8] resize-none"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#E8E0D4] shadow-[0_-2px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 text-left">
            <p className="text-[11px] text-[#8B7355] line-clamp-1">
              {selectedServices.length} dịch vụ · {totalDuration} phút
              {selectedDate && ` · ${DAYS[new Date(selectedDate).getDay()]} ${new Date(selectedDate).getDate()}`}
              {selectedTimeSlot && ` · ${selectedTimeSlot}`}
            </p>
            <p className="text-lg font-bold text-[#2C1E12] tracking-tight leading-tight">
              {formatPrice(totalAmount)}
            </p>
          </div>

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
            {internalStep === 2 ? 'Xác nhận đặt lịch' : 'Tiếp tục'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barber Profile Sheet */}
      {profileStaffId && (
        <BarberProfileSheet
          staffId={profileStaffId}
          onClose={() => setProfileStaffId(null)}
          onSelect={() => {
            const member = staff.find(s => s.id === profileStaffId);
            if (member) setStaff(member);
            setProfileStaffId(null);
          }}
        />
      )}
    </div>
  );
}
