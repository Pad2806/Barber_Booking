'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft, Check, Scissors, Star, CalendarDays, Sparkles, X,
  MessageSquare, Eye, MapPin, Calendar, User, AlertCircle, RefreshCw,
  ChevronRight, Clock,
} from 'lucide-react';
import { staffApi, serviceApi, bookingApi, Staff } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, formatDate, STAFF_POSITIONS, cn } from '@/lib/utils';
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
  const { status } = useSession();
  const {
    salon, selectedServices, selectedStaff, selectedDate, selectedTimeSlot,
    totalDuration, totalAmount, note,
    setStaff, setDate, setTimeSlot, setNote,
  } = useBookingStore();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [profileStaffId, setProfileStaffId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const dateScrollRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  // ── Date list: next 14 days ──────────────────────────────────
  const DATES = useMemo(() => {
    if (!salon) return [];
    const now = dayjs.tz(undefined, VIETNAM_TZ);
    const today = now.startOf('day');
    let startOffset = 0;
    if (salon.closeTime) {
      const [h, m] = salon.closeTime.split(':').map(Number);
      const closeTimeToday = today.set('hour', h).set('minute', m);
      if (now.isAfter(closeTimeToday.subtract(1, 'hour'))) startOffset = 1;
    }
    return Array.from({ length: 14 }, (_, i) => today.add(i + startOffset, 'day'));
  }, [salon]);

  // ── Fetch staff ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!salon) return;
    try {
      setLoading(true);
      const [, staffData] = await Promise.all([
        serviceApi.getBySalon(salon.id),
        staffApi.getBySalon(salon.id),
      ]);
      setStaffList(staffData.filter(b => {
        const role = b.position.toUpperCase();
        return role === 'STYLIST' || role === 'SENIOR_STYLIST' || role === 'MASTER_STYLIST';
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [salon]);

  // ── Fetch time slots ─────────────────────────────────────────
  const fetchTimeSlots = useCallback(async () => {
    if (!salon || !selectedDate) return;
    try {
      setLoadingSlots(true);
      const data = await staffApi.getAvailableSlots(salon.id, selectedDate, totalDuration, selectedStaff?.id);
      const slotsData = Array.isArray(data) ? data : [];
      const todayStr = dayjs.tz(undefined, VIETNAM_TZ).format('YYYY-MM-DD');
      const isToday = selectedDate === todayStr;

      if (isToday) {
        const limit = dayjs.tz(undefined, VIETNAM_TZ).add(1, 'hour');
        setTimeSlots(slotsData.map((slot: any) => {
          const time = typeof slot === 'string' ? slot : slot.time;
          const [h, m] = time.split(':').map(Number);
          const slotTime = dayjs.tz(selectedDate, VIETNAM_TZ).set('hour', h).set('minute', m);
          return { time, available: !slotTime.isBefore(limit) };
        }));
      } else {
        setTimeSlots(slotsData.map((slot: any) =>
          typeof slot === 'string' ? { time: slot, available: true } : slot
        ));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlots(false);
    }
  }, [salon, selectedDate, totalDuration, selectedStaff?.id]);

  // ── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    if (!salon) { router.push('/salons'); return; }
    if (selectedServices.length === 0) { router.back(); return; }
    void fetchData();
  }, [salon, router, selectedServices.length, fetchData]);

  useEffect(() => {
    if (selectedDate && salon) void fetchTimeSlots();
  }, [fetchTimeSlots, selectedDate, salon]);

  useEffect(() => {
    if (selectedTimeSlot) {
      setShowSummary(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSummaryVisible(true));
      });
    } else {
      setSummaryVisible(false);
      const t = setTimeout(() => setShowSummary(false), 350);
      return () => clearTimeout(t);
    }
  }, [selectedTimeSlot]);

  const closeSummary = () => {
    setSummaryVisible(false);
    setTimeout(() => setShowSummary(false), 350);
  };

  // ── Time sections (morning / afternoon / evening) ────────────
  const timeSections = useMemo(() => {
    const available = timeSlots.filter(s => s.available);
    return [
      { label: 'Sáng', icon: '🌅', slots: available.filter(s => parseInt(s.time) < 12) },
      { label: 'Chiều', icon: '☀️', slots: available.filter(s => parseInt(s.time) >= 12 && parseInt(s.time) < 16) },
      { label: 'Tối', icon: '🌙', slots: available.filter(s => parseInt(s.time) >= 16) },
    ].filter(s => s.slots.length > 0);
  }, [timeSlots]);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const d = dayjs.tz(selectedDate, VIETNAM_TZ);
    return `${FULL_DAYS[d.day()]}, ${d.date()} ${MONTHS[d.month()]}`;
  }, [selectedDate]);

  // ── Date scroll helpers ──────────────────────────────────────
  const scrollDates = (dir: 'left' | 'right') => {
    if (!dateScrollRef.current) return;
    const amount = dir === 'left' ? -200 : 200;
    dateScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // ── Confirm booking ──────────────────────────────────────────
  const handleConfirm = async () => {
    if (!salon || !selectedDate || !selectedTimeSlot) return;
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent('/booking')}`);
      return;
    }
    try {
      setConfirming(true);
      setConfirmError(null);
      const booking = await bookingApi.create({
        salonId: salon.id,
        staffId: selectedStaff?.id,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        serviceIds: selectedServices.map(s => s.id),
        note: note || undefined,
      });
      router.push(`/payment/${booking.id}`);
    } catch (err: any) {
      setConfirmError(err.response?.data?.message || 'Đặt lịch thất bại. Vui lòng thử lại.');
    } finally {
      setConfirming(false);
    }
  };

  if (!salon) return null;
  const depositAmount = Math.round(totalAmount * 0.25);

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-6">
      {/* ─── Header ─── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#E8E0D4] sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[#8B7355] hover:text-[#5C4A32] transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Thoát</span>
          </button>
          <h1 className="text-[15px] font-bold text-[#2C1E12]">Đặt lịch hẹn</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">

        {/* ─── Selected Services ─── */}
        <div className="bg-white rounded-2xl border border-[#E8E0D4] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5" /> Dịch vụ đã chọn
            </h3>
            <button onClick={() => router.back()} className="text-[11px] font-medium text-[#C8A97E] hover:text-[#B8975E] cursor-pointer transition-colors">
              Thay đổi
            </button>
          </div>
          <div className="space-y-2">
            {selectedServices.map(service => (
              <div key={service.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden relative bg-[#F0EBE3] shrink-0">
                    <OptimizedImage
                      src={service.image || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=200&auto=format'}
                      alt={service.name} fill className="object-cover" enableBlur
                    />
                  </div>
                  <div>
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

        {/* ─── Section 1: Choose Barber ─── */}
        <div>
          <h2 className="text-base font-bold text-[#2C1E12] mb-1">Chọn thợ cắt</h2>
          <p className="text-sm text-[#8B7355] mb-3">Bạn có thể để hệ thống tự chọn hoặc chọn thợ yêu thích</p>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-7 h-7 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Auto-assign */}
              <div
                onClick={() => setStaff(null)}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                  !selectedStaff ? 'border-[#C8A97E] bg-[#C8A97E]/5' : 'border-transparent bg-white hover:border-[#E8E0D4]'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all', !selectedStaff ? 'bg-[#C8A97E] text-white' : 'bg-[#F0EBE3] text-[#C8A97E]')}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-[#2C1E12]">Tự động</h4>
                  <p className="text-[11px] text-[#8B7355]">Hệ thống chọn thợ phù hợp nhất</p>
                </div>
                {!selectedStaff && (
                  <div className="w-5 h-5 bg-[#C8A97E] rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Staff list */}
              {staffList.map(member => {
                const selected = selectedStaff?.id === member.id;
                return (
                  <div
                    key={member.id}
                    onClick={() => setStaff(member)}
                    className={cn(
                      'relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                      selected ? 'border-[#C8A97E] bg-[#C8A97E]/5' : 'border-transparent bg-white hover:border-[#E8E0D4]'
                    )}
                  >
                    <Avatar src={member.user.avatar} name={member.user.name} size="md" variant="circle" className={cn('shrink-0', selected && 'ring-2 ring-[#C8A97E] ring-offset-1')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#2C1E12] truncate">{member.user.name}</h4>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Star className="w-3 h-3 text-[#C8A97E] fill-[#C8A97E]" />
                          <span className="text-xs font-bold text-[#2C1E12]">{member.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-[#8B7355] truncate">{STAFF_POSITIONS[member.position]}</p>
                        <button
                          onClick={e => { e.stopPropagation(); setProfileStaffId(member.id); }}
                          className="text-[10px] font-semibold text-[#C8A97E] hover:text-[#B8975E] transition-colors shrink-0 flex items-center gap-0.5"
                        >
                          <Eye className="w-3 h-3" /> Hồ sơ
                        </button>
                      </div>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 bg-[#C8A97E] rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Section 2: Date & Time Picker ─── */}
        <div>
          <h2 className="text-base font-bold text-[#2C1E12] mb-1">Chọn ngày & giờ</h2>
          <p className="text-sm text-[#8B7355] mb-4">Chọn ngày rồi chọn giờ bên dưới</p>

          <div className="bg-white rounded-2xl border border-[#E8E0D4] p-4 space-y-4">
            {/* Horizontal date strip with arrow buttons */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Chọn ngày
                </h3>
                {selectedDate && (
                  <span className="text-xs font-medium text-[#C8A97E]">{formattedDate}</span>
                )}
              </div>

              <div className="relative flex items-center gap-1.5">
                {/* Left arrow */}
                <button
                  onClick={() => scrollDates('left')}
                  className="shrink-0 w-8 h-8 rounded-full bg-[#F0EBE3] hover:bg-[#E8E0D4] flex items-center justify-center text-[#8B7355] transition-colors cursor-pointer active:scale-95"
                  aria-label="Cuộn trái"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Scrollable date strip */}
                <div
                  ref={dateScrollRef}
                  className="flex gap-2 overflow-x-auto pb-1.5 scroll-smooth snap-x snap-mandatory flex-1"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#D4C9BA transparent' }}
                >
                  {DATES.map(date => {
                    const dateStr = date.format('YYYY-MM-DD');
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === dayjs.tz(undefined, VIETNAM_TZ).format('YYYY-MM-DD');
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setDate(dateStr)}
                        className={cn(
                          'flex-shrink-0 snap-center flex flex-col items-center w-14 py-2.5 rounded-xl border-2 transition-all duration-300 cursor-pointer',
                          isSelected
                            ? 'border-[#C8A97E] bg-[#C8A97E] text-white shadow-sm'
                            : 'border-transparent hover:border-[#E8E0D4] text-[#2C1E12] hover:bg-[#FAF8F5]'
                        )}
                      >
                        <span className={cn('text-[10px] font-bold uppercase mb-0.5', isSelected ? 'text-white/70' : 'text-[#8B7355]')}>
                          {DAYS[date.day()]}
                        </span>
                        <span className="text-lg font-bold leading-tight">{date.date()}</span>
                        {isToday && <div className={cn('w-1 h-1 rounded-full mt-0.5', isSelected ? 'bg-white' : 'bg-[#C8A97E]')} />}
                      </button>
                    );
                  })}
                </div>

                {/* Right arrow */}
                <button
                  onClick={() => scrollDates('right')}
                  className="shrink-0 w-8 h-8 rounded-full bg-[#F0EBE3] hover:bg-[#E8E0D4] flex items-center justify-center text-[#8B7355] transition-colors cursor-pointer active:scale-95"
                  aria-label="Cuộn phải"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Time grid (shows after date selected) */}
            {selectedDate && (
              <div ref={timeRef} className="animate-in fade-in duration-300 border-t border-[#E8E0D4] pt-4">
                <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Chọn giờ
                </h3>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <div className="w-6 h-6 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
                    <span className="text-sm text-[#8B7355]">Đang tải...</span>
                  </div>
                ) : timeSections.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="w-7 h-7 text-[#D4C9BA] mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#2C1E12]">Hết lịch trống</p>
                    <p className="text-xs text-[#8B7355] mt-1">Vui lòng chọn ngày khác</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {timeSections.map(section => (
                      <div key={section.label}>
                        <h4 className="text-[10px] font-bold text-[#8B7355] mb-1.5 flex items-center gap-1">
                          <span>{section.icon}</span> {section.label}
                          <span className="text-[#C4B9A8] font-normal">({section.slots.length})</span>
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                          {section.slots.map(slot => (
                            <button
                              key={slot.time}
                              onClick={() => setTimeSlot(slot.time)}
                              className={cn(
                                'py-2 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer border',
                                selectedTimeSlot === slot.time
                                  ? 'bg-[#C8A97E] border-[#C8A97E] text-white shadow-sm'
                                  : 'bg-[#FAF8F5] border-transparent text-[#2C1E12] hover:border-[#E8E0D4]'
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
          </div>
        </div>

        {/* ─── Note (visible after time selected) ─── */}
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
              <div className="bg-white rounded-2xl border border-[#E8E0D4] p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#8B7355] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Ghi chú (tuỳ chọn)
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
                  className="w-full p-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E]/20 transition-all text-sm text-[#2C1E12] placeholder:text-[#C4B9A8] resize-none"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {showSummary && <div className="h-72" />}
      </div>

      {/* ══════════════════════════════════════════════════════
          BOOKING SUMMARY SHEET (smooth transition)
      ══════════════════════════════════════════════════════ */}
      {showSummary && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className={cn(
              'absolute inset-0 bg-black/30 transition-opacity duration-300',
              summaryVisible ? 'opacity-100' : 'opacity-0'
            )}
            onClick={closeSummary}
          />

          {/* Sheet */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 transition-transform duration-300 ease-out will-change-transform',
              summaryVisible ? 'translate-y-0' : 'translate-y-full'
            )}
          >
            <div className="bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] max-h-[85vh] overflow-y-auto">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 cursor-grab" onClick={closeSummary}>
                <div className="w-12 h-1 rounded-full bg-[#E8E0D4]" />
              </div>

              <div className="px-5 pb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#2C1E12]">Xác nhận đặt lịch</h2>
                  <button onClick={closeSummary} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F0EBE3] text-[#8B7355] hover:bg-[#E8E0D4] transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Salon */}
                <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4]">
                  <div className="w-9 h-9 rounded-lg bg-[#F0EBE3] flex items-center justify-center text-[#C8A97E] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Địa điểm</p>
                    <p className="text-sm font-bold text-[#2C1E12] truncate">{salon.name}</p>
                    <p className="text-xs text-[#8B7355] truncate">{salon.address}</p>
                  </div>
                </div>

                {/* Time + Staff */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4]">
                    <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1.5">Thời gian</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#C8A97E] shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-[#2C1E12]">{selectedDate ? formatDate(selectedDate) : ''}</p>
                        <p className="text-xs font-bold text-[#C8A97E]">Lúc {selectedTimeSlot}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4]">
                    <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-1.5">Thợ cắt</p>
                    <div className="flex items-center gap-2">
                      {selectedStaff?.user.avatar ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#E8E0D4]">
                          <OptimizedImage src={selectedStaff.user.avatar} alt="Staff" width={32} height={32} className="object-cover" enableBlur />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#F0EBE3] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-[#C8A97E]/60" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#2C1E12] truncate">{selectedStaff?.user.name || 'Tự động'}</p>
                        <p className="text-[10px] text-[#8B7355]">{selectedStaff ? STAFF_POSITIONS[selectedStaff.position] : 'Hệ thống xếp'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4] space-y-2">
                  <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Dịch vụ</p>
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-3.5 h-3.5 text-[#C8A97E]" />
                        <span className="text-sm text-[#2C1E12] font-medium">{s.name}</span>
                      </div>
                      <span className="text-sm font-bold text-[#2C1E12]">{formatPrice(s.price)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#8B7355]">Tổng dịch vụ</span>
                    <span className="text-base font-bold text-[#2C1E12]">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#F0EBE3] rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">Tiền cọc giữ lịch (25%)</p>
                      <p className="text-[11px] text-[#8B7355] mt-0.5">Thanh toán phần còn lại tại salon</p>
                    </div>
                    <p className="text-lg font-bold text-[#C8A97E]">{formatPrice(depositAmount)}</p>
                  </div>
                </div>

                {/* Login warning */}
                {status !== 'authenticated' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 font-medium">Bạn cần đăng nhập để hoàn tất đặt lịch</p>
                  </div>
                )}

                {confirmError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium">{confirmError}</p>
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className={cn(
                    'w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
                    confirming
                      ? 'bg-[#F0EBE3] text-[#8B7355] cursor-not-allowed'
                      : 'bg-[#C8A97E] text-white hover:bg-[#B8975E] shadow-lg shadow-[#C8A97E]/30'
                  )}
                >
                  {confirming ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Xác nhận & Thanh toán cọc {formatPrice(depositAmount)}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barber Profile Sheet */}
      {profileStaffId && (
        <BarberProfileSheet
          staffId={profileStaffId}
          onClose={() => setProfileStaffId(null)}
          onSelect={() => {
            const member = staffList.find(s => s.id === profileStaffId);
            if (member) setStaff(member);
            setProfileStaffId(null);
          }}
        />
      )}
    </div>
  );
}
