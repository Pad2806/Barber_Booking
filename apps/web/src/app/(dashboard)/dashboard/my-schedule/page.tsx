'use client';

import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function BarberSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['staff', 'my-schedules', format(currentDate, 'yyyy-MM')],
    queryFn: () => staffApi.getSchedules(),
  });

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (isLoading) {
    return (
      <div className="flex bg-white rounded-2xl border border-[#E8E0D4]/60 items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#8B7355] font-medium">Đang tải lịch làm việc...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      {/* Page header with navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="bg-[#C8A97E]/10 text-[#C8A97E] border-none mb-2 px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-wider rounded-md">
            Lịch cá nhân
          </Badge>
          <h1 className="text-2xl font-bold text-[#2C1E12] tracking-tight">
            Lịch làm việc
          </h1>
          <p className="text-sm text-[#8B7355] mt-0.5">Quản lý ca làm việc trong tuần</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#1C1612] rounded-xl p-1 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevWeek}
              className="h-9 w-9 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 text-center min-w-[180px]">
              <p className="text-xs font-semibold text-[#C8A97E] whitespace-nowrap">
                {format(weekStart, 'dd/MM')} – {format(weekEnd, 'dd/MM/yyyy')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextWeek}
              className="h-9 w-9 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={goToToday}
            className="rounded-xl border-[#E8E0D4] text-[#2C1E12] font-semibold text-xs h-9 px-4 hover:bg-[#FAF8F5]"
          >
            Hôm nay
          </Button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayShifts = shifts?.filter((s: any) => isSameDay(new Date(s.date), day)) || [];
          const isToday = isSameDay(day, new Date());
          const isOff = dayShifts.some((s: any) => s.type === 'OFF');

          return (
            <Card
              key={day.toString()}
              className={cn(
                'border border-[#E8E0D4]/60 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white flex flex-col',
                isToday && 'ring-2 ring-[#C8A97E]/40 border-[#C8A97E]/30',
                isOff && !isToday && 'opacity-75'
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  'p-3 text-center border-b',
                  isToday
                    ? 'bg-[#1C1612] text-white border-[#1C1612]'
                    : 'bg-[#FAF8F5] text-[#2C1E12] border-[#E8E0D4]/40'
                )}
              >
                <p
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider mb-0.5',
                    isToday ? 'text-[#C8A97E]' : 'text-[#8B7355]'
                  )}
                >
                  {format(day, 'EEEE', { locale: vi })}
                </p>
                <p className="text-lg font-bold leading-none tabular-nums">
                  {format(day, 'dd/MM')}
                </p>
              </div>

              {/* Shift content */}
              <div className="p-3 flex-1 flex flex-col items-center justify-center min-h-[120px]">
                {isOff ? (
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-rose-500">Ngày nghỉ</p>
                      <p className="text-[10px] text-rose-400 mt-0.5">Đã được duyệt</p>
                    </div>
                  </div>
                ) : dayShifts.length > 0 ? (
                  dayShifts.map((shift: any) => (
                    <div
                      key={shift.id}
                      className={cn(
                        'w-full p-3 rounded-xl border transition-colors flex flex-col gap-2',
                        isToday
                          ? 'bg-[#C8A97E]/5 border-[#C8A97E]/20'
                          : 'bg-[#FAF8F5] border-[#E8E0D4]/40'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#C8A97E]" />
                        <span className="text-[10px] font-semibold text-[#8B7355]">
                          Ca làm việc
                        </span>
                        {isToday && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-auto" />
                        )}
                      </div>
                      <p className="text-base font-bold text-[#2C1E12] tabular-nums leading-none">
                        {format(new Date(shift.shiftStart), 'HH:mm')}
                        <span className="text-[#C8A97E]/40 mx-1">–</span>
                        {format(new Date(shift.shiftEnd), 'HH:mm')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center text-[#C8A97E]/25">
                    <CalendarIcon className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-medium text-[#8B7355]/40">
                      Chưa có lịch
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Work rules section */}
      <div className="bg-[#1C1612] p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-9 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#C8A97E]/15 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-[#C8A97E]" />
              </div>
              <h3 className="text-base font-bold text-white">Nội quy làm việc</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {[
                'Có mặt trước ca làm ít nhất 15 phút.',
                'Đồng phục sạch sẽ, chỉn chu là bắt buộc.',
                'Dụng cụ phải được khử khuẩn sau mỗi lượt khách.',
                'Cập nhật trạng thái hoàn tất khi xong việc.',
              ].map((note, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C8A97E]/60 mt-2 shrink-0 group-hover:bg-[#C8A97E] transition-colors" />
                  <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors leading-relaxed">
                    {note}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 flex justify-center lg:justify-end">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C8A97E] to-[#D4B896] flex items-center justify-center shadow-lg shadow-[#C8A97E]/10">
              <CalendarIcon className="w-9 h-9 text-[#1C1612]" />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C8A97E] opacity-[0.04] rounded-full blur-[60px] translate-x-1/3 -translate-y-1/3" />
      </div>
    </div>
  );
}
