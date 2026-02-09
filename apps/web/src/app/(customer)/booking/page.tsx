'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, User, Scissors } from 'lucide-react';
import { staffApi, Staff } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, STAFF_POSITIONS, cn } from '@/lib/utils';

// Generate dates for next 14 days
function generateDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
}

const DATES = generateDates();
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

  const [staff, setStaffList] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if no salon or services selected
    if (!salon || selectedServices.length === 0) {
      router.push('/salons');
      return;
    }
    fetchStaff();
  }, [salon, selectedServices]);

  useEffect(() => {
    if (selectedDate && salon) {
      fetchTimeSlots();
    }
  }, [selectedDate, salon, selectedStaff, totalDuration]);

  const fetchStaff = async () => {
    if (!salon) return;
    try {
      const data = await staffApi.getBySalon(salon.id);
      setStaffList(data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const fetchTimeSlots = async () => {
    if (!salon || !selectedDate) return;
    try {
      setLoading(true);
      const data = await staffApi.getAvailableSlots(
        salon.id,
        selectedDate,
        totalDuration,
        selectedStaff?.id
      );
      setTimeSlots(data);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Progress */}
      <div className="bg-white border-b py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            {[
              { step: 1, label: 'Chọn Stylist', icon: User },
              { step: 2, label: 'Chọn ngày', icon: Calendar },
              { step: 3, label: 'Chọn giờ', icon: Clock },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <button
                  onClick={() => item.step < currentStep && setStep(item.step)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
                    currentStep === item.step
                      ? 'bg-accent text-white'
                      : currentStep > item.step
                        ? 'bg-accent/10 text-accent cursor-pointer'
                        : 'bg-gray-100 text-gray-400'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
                {index < 2 && <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Step 1: Choose Staff */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-2xl font-heading font-bold mb-6">Chọn Stylist</h2>
            <p className="text-gray-500 mb-8">
              Bạn có thể bỏ qua để hệ thống tự động chọn stylist phù hợp
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Any Stylist option */}
              <div
                onClick={() => setStaff(null)}
                className={cn(
                  'bg-white rounded-xl p-5 cursor-pointer transition-all border-2',
                  !selectedStaff
                    ? 'border-accent bg-accent/5'
                    : 'border-transparent hover:shadow-md'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                    🎲
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">Bất kỳ Stylist</h4>
                    <p className="text-sm text-gray-500">Để hệ thống tự động chọn</p>
                  </div>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                      !selectedStaff ? 'bg-accent border-accent' : 'border-gray-300'
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
                    'bg-white rounded-xl p-5 cursor-pointer transition-all border-2',
                    selectedStaff?.id === member.id
                      ? 'border-accent bg-accent/5'
                      : 'border-transparent hover:shadow-md'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 relative">
                      {member.user.avatar ? (
                        <Image
                          src={member.user.avatar}
                          alt={member.user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{member.user.name}</h4>
                      <p className="text-sm text-accent">
                        {STAFF_POSITIONS[member.position] || member.position}
                      </p>
                      <p className="text-xs text-gray-400">
                        ⭐ {member.rating.toFixed(1)} ({member.totalReviews} đánh giá)
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                        selectedStaff?.id === member.id
                          ? 'bg-accent border-accent'
                          : 'border-gray-300'
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
          <div>
            <h2 className="text-2xl font-heading font-bold mb-6">Chọn ngày</h2>
            <div className="grid grid-cols-7 gap-2">
              {DATES.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={dateStr}
                    onClick={() => setDate(dateStr)}
                    className={cn(
                      'p-4 rounded-xl transition-all text-center',
                      isSelected ? 'bg-accent text-white' : 'bg-white hover:shadow-md'
                    )}
                  >
                    <p
                      className={cn(
                        'text-xs font-medium',
                        isSelected ? 'text-white/80' : 'text-gray-400'
                      )}
                    >
                      {DAYS[date.getDay()]}
                    </p>
                    <p
                      className={cn(
                        'text-xl font-bold mt-1',
                        isSelected ? 'text-white' : 'text-gray-800'
                      )}
                    >
                      {date.getDate()}
                    </p>
                    {isToday && (
                      <p
                        className={cn('text-xs mt-1', isSelected ? 'text-white/80' : 'text-accent')}
                      >
                        Hôm nay
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
          <div>
            <h2 className="text-2xl font-heading font-bold mb-6">Chọn giờ</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Không có khung giờ khả dụng</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {timeSlots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setTimeSlot(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      'p-3 rounded-xl font-medium transition-all',
                      selectedTimeSlot === slot.time
                        ? 'bg-accent text-white'
                        : slot.available
                          ? 'bg-white hover:shadow-md text-gray-800'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed'
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

      {/* Floating Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="container mx-auto">
          {/* Summary */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Tại {salon.name}</p>
              <p className="text-sm text-gray-600">
                <Scissors className="w-4 h-4 inline mr-1" />
                {selectedServices.length} dịch vụ • {totalDuration} phút
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Tổng cộng</p>
              <p className="text-xl font-bold text-accent">{formatPrice(totalAmount)}</p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!canContinue()}
            className={cn(
              'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
              canContinue()
                ? 'bg-accent hover:bg-accent/90 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {currentStep === 3 ? 'Xác nhận đặt lịch' : 'Tiếp tục'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
