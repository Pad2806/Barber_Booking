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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => (currentStep > 1 ? prevStep() : router.back())}
            className="flex items-center gap-2 text-gray-600 hover:text-primary"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay lại
          </button>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="bg-white sticky top-[72px] z-40 border-b border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between max-w-xl mx-auto relative px-4">
            {/* Background Line */}
            <div className="absolute top-1/2 left-4 right-4 h-px bg-gray-100 -translate-y-1/2 z-0" />
            
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
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 font-black text-[10px] tracking-tight',
                      isActive 
                        ? 'bg-black text-white shadow-2xl shadow-black/20 scale-125' 
                        : isCompleted 
                          ? 'bg-black text-white' 
                          : 'bg-white text-gray-300 border border-gray-100'
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : item.step}
                  </button>
                  <div className="absolute top-14 flex flex-col items-center w-24">
                    <span className={cn(
                      "text-[8px] font-black tracking-[0.2em] transition-colors duration-500 mb-0.5",
                      isActive ? "text-black" : "text-gray-300"
                    )}>
                      {item.label}
                    </span>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-tight transition-colors duration-500 whitespace-nowrap",
                      isActive ? "text-black" : "text-gray-200"
                    )}>
                      {item.sub}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-4" /> {/* Spacer for labels */}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="text-center mb-16">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 block">SELECT STYLIST</span>
              <h2 className="text-4xl font-heading font-black text-gray-900 tracking-tighter leading-none mb-4">THỢ CẠO TIN DÙNG</h2>
              <div className="w-12 h-1 bg-black mx-auto" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Any Stylist option */}
              <div
                onClick={() => setStaff(null)}
                className={cn(
                  'bg-white rounded-[40px] p-8 cursor-pointer transition-all duration-700 border-2 relative group overflow-hidden',
                  !selectedStaff
                    ? 'border-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)]'
                    : 'border-gray-50 hover:border-gray-200 hover:shadow-xl'
                )}
              >
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-700">
                    🎩
                  </div>
                  <h4 className="font-black text-xl text-gray-900 tracking-tighter mb-1">CHỌN NGẪU NHIÊN</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tight mb-6">Xếp thợ giỏi nhất cho bạn</p>
                  <div className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-700",
                    !selectedStaff ? "bg-black border-black text-white" : "border-gray-100 text-transparent"
                  )}>
                    <Check className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {staff.map((member, idx) => (
                <div
                  key={member.id}
                  onClick={() => setStaff(member)}
                  className={cn(
                    'bg-white rounded-[40px] p-8 cursor-pointer transition-all duration-700 border-2 relative group overflow-hidden animate-in fade-in slide-in-from-bottom-8',
                    selectedStaff?.id === member.id
                      ? 'border-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)]'
                      : 'border-gray-50 hover:border-gray-200 hover:shadow-xl'
                  )}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gray-100 relative mb-6 group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0">
                      {member.user.avatar ? (
                        <Image
                          src={member.user.avatar}
                          alt={member.user.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-50">
                          👤
                        </div>
                      )}
                    </div>
                    <h4 className="font-black text-xl text-gray-900 tracking-tighter mb-1">{member.user.name}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                      {STAFF_POSITIONS[member.position] || member.position}
                    </p>
                    <div className="flex items-center gap-1.5 mb-6 px-3 py-1 bg-gray-50 rounded-full">
                       <span className="text-gray-900 text-sm font-black italic">★ {member.rating.toFixed(1)}</span>
                       <span className="text-[8px] text-gray-300 font-black uppercase tracking-widest">({member.totalReviews} ĐÁNH GIÁ)</span>
                    </div>
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-700",
                      selectedStaff?.id === member.id ? "bg-black border-black text-white" : "border-gray-100 text-transparent"
                    )}>
                      <Check className="w-5 h-5" />
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
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 block">PICK A DATE</span>
              <h2 className="text-4xl font-heading font-black text-gray-900 tracking-tighter leading-none mb-4">CHỌN NGÀY ĐẸP</h2>
              <div className="w-12 h-1 bg-black mx-auto" />
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 max-w-5xl mx-auto">
              {DATES.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={dateStr}
                    onClick={() => setDate(dateStr)}
                    className={cn(
                      'p-6 rounded-[32px] transition-all duration-700 text-center flex flex-col items-center justify-center border-2 animate-in fade-in scale-95',
                      isSelected 
                        ? 'bg-black border-black text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] scale-110 z-10' 
                        : 'bg-white border-gray-50 text-gray-900 hover:border-gray-200 hover:shadow-xl'
                    )}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <p
                      className={cn(
                        'text-[10px] font-black uppercase tracking-[0.2em] mb-2',
                        isSelected ? 'text-white/50' : 'text-gray-300'
                      )}
                    >
                      {DAYS[date.getDay()]}
                    </p>
                    <p
                      className={cn(
                        'text-3xl font-black tracking-tighter mb-2',
                        isSelected ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      {date.getDate()}
                    </p>
                    {isToday && (
                      <span className={cn(
                        'text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full', 
                        isSelected ? 'bg-white/20 text-white' : 'bg-black text-white'
                      )}>
                        HÔM NAY
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
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 block">SELECT TIME</span>
              <h2 className="text-4xl font-heading font-black text-gray-900 tracking-tighter leading-none mb-4">CHỌN GIỜ ĐẸP</h2>
              <div className="w-12 h-1 bg-black mx-auto" />
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-8">
                <div className="w-16 h-16 border-[6px] border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">ĐANG TÌM GIỜ CÒN TRỐNG...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-black uppercase tracking-widest">Không còn giờ rảnh, vui lòng chọn ngày khác</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-6xl mx-auto">
                {timeSlots.map((slot, idx) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setTimeSlot(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      'py-5 rounded-2xl text-xl font-black transition-all duration-500 border-2 animate-in zoom-in-95',
                      selectedTimeSlot === slot.time
                        ? 'bg-black border-black text-white shadow-2xl shadow-black/20 scale-110 z-10'
                        : slot.available
                          ? 'bg-white border-gray-50 text-gray-900 hover:border-black hover:text-black'
                          : 'bg-gray-50 border-transparent text-gray-200 cursor-not-allowed hidden'
                    )}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}

            {/* Note */}
            <div className="mt-16 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-6 h-px bg-black" />
                 <label className="text-[10px] font-black text-black uppercase tracking-[0.2em]">
                   Ghi chú riêng (Không bắt buộc)
                 </label>
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ví dụ: Tóc tôi dày, muốn cắt kiểu Undercut bồng bềnh..."
                rows={3}
                className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Global Summary Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-32px_64px_-16px_rgba(0,0,0,0.08)] p-6 sm:p-8 z-[60]">
        <div className="container mx-auto max-w-lg">
          {/* Detailed Summary Pill */}
          <div className="flex items-center justify-between mb-8 bg-black text-white p-6 rounded-[32px] shadow-2xl shadow-black/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Dịch vụ đã chọn</p>
                <p className="text-2xl font-black tracking-tighter">{formatPrice(totalAmount)}</p>
              </div>
            </div>
            <div className="text-right relative z-10 border-l border-white/10 pl-6">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">{totalDuration} PHÚT</p>
              <p className="text-xs font-black text-white/30 truncate max-w-[100px]">{salon.name}</p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!canContinue()}
            className={cn(
              'w-full py-6 rounded-full font-black text-xl flex items-center justify-center gap-3 transition-all duration-700 active:scale-95 transform hover:-translate-y-1 uppercase tracking-widest',
              canContinue()
                ? 'bg-black text-white shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)]'
                : 'bg-gray-50 text-gray-200 cursor-not-allowed border-2 border-gray-100'
            )}
          >
            {currentStep === 3 ? 'KẾT THÚC' : 'TIẾP THEO'}
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
