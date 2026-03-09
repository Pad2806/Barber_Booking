'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, User, Scissors } from 'lucide-react';
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
      <div className="bg-white/80 backdrop-blur-md sticky top-[72px] z-40 border-b shadow-sm overflow-x-auto no-scrollbar">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between max-w-xl mx-auto relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
            
            {[
              { step: 1, label: 'Thợ cạo', icon: User },
              { step: 2, label: 'Lịch hẹn', icon: Calendar },
              { step: 3, label: 'Giờ đẹp', icon: Clock },
            ].map((item, index) => {
              const isActive = currentStep === item.step;
              const isCompleted = currentStep > item.step;
              
              return (
                <div key={item.step} className="relative z-10 flex flex-col items-center gap-2">
                  <button
                    onClick={() => (isCompleted || isActive) && setStep(item.step)}
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg',
                      isActive 
                        ? 'bg-accent text-white scale-110' 
                        : isCompleted 
                          ? 'bg-accent/20 text-accent' 
                          : 'bg-white text-gray-400 border border-gray-100'
                    )}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : <item.icon className="w-5 h-5" />}
                  </button>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                    isActive ? "text-accent" : "text-gray-400"
                  )}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-heading font-black text-gray-900 mb-2 mt-4 tracking-tight">AI KHUYÊN DÙNG</h2>
              <p className="text-gray-400 text-sm">
                Hãy chọn người thợ mà bạn tin tưởng nhất
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Any Stylist option */}
              <div
                onClick={() => setStaff(null)}
                className={cn(
                  'bg-white rounded-[24px] p-6 cursor-pointer transition-all duration-300 border-2 relative group overflow-hidden',
                  !selectedStaff
                    ? 'border-accent bg-accent/5 shadow-2xl shadow-accent/10'
                    : 'border-transparent hover:border-accent/10 hover:shadow-xl'
                )}
              >
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-bold text-lg text-gray-800 tracking-tight">Chọn ngẫu nhiên</h4>
                    <p className="text-xs text-gray-400 font-medium">Salon sẽ tự xếp thợ giỏi nhất</p>
                  </div>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500',
                      !selectedStaff ? 'bg-accent border-accent scale-110' : 'border-gray-200'
                    )}
                  >
                    {!selectedStaff && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>

              {staff.map(member => (
                <div
                  key={member.id}
                  onClick={() => setStaff(member)}
                  className={cn(
                    'bg-white rounded-[24px] p-6 cursor-pointer transition-all duration-300 border-2 relative group overflow-hidden',
                    selectedStaff?.id === member.id
                      ? 'border-accent bg-accent/5 shadow-2xl shadow-accent/10'
                      : 'border-transparent hover:border-accent/10 hover:shadow-xl'
                  )}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 relative shadow-inner group-hover:scale-110 transition-transform">
                      {member.user.avatar ? (
                        <Image
                          src={member.user.avatar}
                          alt={member.user.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-50">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-heading font-bold text-lg text-gray-800 tracking-tight">{member.user.name}</h4>
                      <p className="text-[10px] font-black text-accent uppercase tracking-tighter mb-1">
                        {STAFF_POSITIONS[member.position] || member.position}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-xs font-bold text-gray-500">{member.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-gray-300 font-medium font-mono">({member.totalReviews})</span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500',
                        selectedStaff?.id === member.id
                          ? 'bg-accent border-accent scale-110'
                          : 'border-gray-200'
                      )}
                    >
                      {selectedStaff?.id === member.id && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Date */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-heading font-black text-gray-900 mb-2 mt-4 tracking-tight">CHỌN NGÀY ĐẸP</h2>
              <p className="text-gray-400 text-sm">
                Xem lịch thư thả, hớt tóc cực bảnh
              </p>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 max-w-4xl mx-auto">
              {DATES.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={dateStr}
                    onClick={() => setDate(dateStr)}
                    className={cn(
                      'p-4 rounded-3xl transition-all duration-300 text-center flex flex-col items-center justify-center aspect-[4/5] sm:aspect-auto border-2',
                      isSelected 
                        ? 'bg-accent border-accent text-white shadow-xl shadow-accent/30 scale-105 z-10' 
                        : 'bg-white border-transparent hover:border-accent/20 hover:shadow-lg'
                    )}
                  >
                    <p
                      className={cn(
                        'text-[10px] font-black uppercase tracking-tighter mb-1',
                        isSelected ? 'text-white/70' : 'text-gray-300'
                      )}
                    >
                      {DAYS[date.getDay()]}
                    </p>
                    <p
                      className={cn(
                        'text-2xl font-black mb-1',
                        isSelected ? 'text-white' : 'text-gray-800'
                      )}
                    >
                      {date.getDate()}
                    </p>
                    {isToday && (
                      <p
                        className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', isSelected ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent')}
                      >
                        Hnay
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Choose Time */}
        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-heading font-black text-gray-900 mb-2 mt-4 tracking-tight">CHỐN GIỜ ĐẸP</h2>
              <p className="text-gray-400 text-sm">
                Hãy chọn khung giờ bạn thấy thoải mái nhất
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Đang tải lịch rảnh...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] shadow-inner shadow-gray-100">
                <p className="text-gray-500 font-medium">Hết giờ đẹp hôm nay rồi, thử ngày khác nhé!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-w-5xl mx-auto">
                {timeSlots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setTimeSlot(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      'p-4 rounded-2xl font-black text-lg transition-all duration-300 border-2',
                      selectedTimeSlot === slot.time
                        ? 'bg-accent border-accent text-white shadow-xl shadow-accent/30 scale-105'
                        : slot.available
                          ? 'bg-white border-transparent hover:border-accent/20 hover:shadow-xl text-gray-800'
                          : 'bg-gray-50 border-transparent text-gray-200 cursor-not-allowed grayscale'
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}

            {/* Note */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú cho salon (không bắt buộc)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ví dụ: Tóc tôi dày, muốn cắt gọn hơn..."
                rows={3}
                className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Global Summary Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t shadow-[0_-8px_30px_rgb(0,0,0,0.04)] p-4 sm:p-6 z-[60]">
        <div className="container mx-auto max-w-lg">
          {/* Detailed Summary Pill */}
          <div className="flex items-center justify-between mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-tighter">Đã chọn ({selectedServices.length})</p>
                <p className="text-lg font-black text-accent">{formatPrice(totalAmount)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400">{totalDuration} phút thư giãn</p>
              <p className="text-[10px] font-medium text-gray-300 line-clamp-1">{salon.name}</p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!canContinue()}
            className={cn(
              'w-full py-5 rounded-[20px] font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl active:scale-95',
              canContinue()
                ? 'bg-gradient-to-r from-accent to-accent/80 text-white shadow-accent/25 hover:shadow-accent/40'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
          >
            {currentStep === 3 ? 'Xác nhận ngay' : 'Tiếp theo'}
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
