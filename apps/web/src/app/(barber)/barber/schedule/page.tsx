'use client';

import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/lib/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks 
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tight text-[#2C1E12] uppercase mb-1">Lịch làm việc của tôi</h1>
          <p className="text-[#8B7355] font-medium">Theo dõi ca làm việc và thời gian phục vụ của bạn</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-[#F0EBE3]">
            <Button variant="ghost" size="icon" onClick={prevWeek} className="rounded-xl hover:bg-[#FAF8F5]">
                <ChevronLeft className="w-5 h-5 text-[#8B7355]" />
            </Button>
            <div className="px-4 py-1.5 text-sm font-black text-[#2C1E12] uppercase italic">
                {format(weekStart, 'dd/MM')} – {format(weekEnd, 'dd/MM/yyyy')}
            </div>
            <Button variant="ghost" size="icon" onClick={nextWeek} className="rounded-xl hover:bg-[#FAF8F5]">
                <ChevronRight className="w-5 h-5 text-[#8B7355]" />
            </Button>
        </div>
        <Button 
            variant="outline" 
            onClick={goToToday}
            className="rounded-2xl border-[#E8E0D4] text-[#8B7355] font-black uppercase text-xs tracking-widest hover:bg-[#C8A97E]/5 hover:text-[#C8A97E]"
        >
            Hôm nay
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayShifts = shifts?.filter(s => isSameDay(new Date(s.date), day)) || [];
          const isToday = isSameDay(day, new Date());
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <Card 
                key={day.toString()} 
                className={cn(
                    "border-none shadow-sm transition-all duration-300",
                    isToday ? "ring-2 ring-[#C8A97E] shadow-xl shadow-[#C8A97E]/10" : "bg-white",
                    isWeekend && !isToday ? "opacity-90" : ""
                )}
            >
              <CardHeader className={cn(
                  "p-4 text-center border-b",
                  isToday ? "bg-[#C8A97E] text-white" : "bg-[#FAF8F5] text-[#2C1E12]"
              )}>
                <p className="text-[10px] font-black uppercase tracking-tighter opacity-80 mb-0.5">
                    {format(day, 'EEEE', { locale: vi })}
                </p>
                <p className="text-xl font-black italic uppercase leading-none">
                    {format(day, 'dd/MM')}
                </p>
              </CardHeader>
              <CardContent className="p-3 min-h-[150px]">
                {dayShifts.length > 0 ? (
                  dayShifts.map((shift) => (
                    <div 
                        key={shift.id} 
                        className="p-3 rounded-xl bg-[#FAF8F5] border border-[#F0EBE3] mb-2 last:mb-0 hover:border-[#C8A97E] transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3.5 h-3.5 text-[#C8A97E]" />
                        <span className="text-[10px] font-black text-[#2C1E12] uppercase italic tracking-tighter">Ca làm việc</span>
                      </div>
                      <div className="text-xs font-black text-[#2C1E12]">
                        {format(new Date(shift.shiftStart), 'HH:mm')} – {format(new Date(shift.shiftEnd), 'HH:mm')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#8B7355]/40 p-4 text-center">
                    <Info className="w-8 h-8 mb-2 opacity-20" />
                    <span className="text-[10px] font-bold uppercase italic tracking-widest leading-tight">Lịch nghỉ (Off)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] mt-12 border border-[#F0EBE3] shadow-sm relative overflow-hidden group">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
                <h3 className="text-xl font-black text-[#2C1E12] italic uppercase mb-2">Ghi chú quan trọng</h3>
                <ul className="space-y-3">
                    {[
                        'Vui lòng có mặt trước ca làm ít nhất 15 phút để chuẩn bị dụng cụ.',
                        'Nếu có thay đổi về lịch làm việc, vui lòng liên hệ Manager ít nhất 24h.',
                        'Các ca làm việc Color-coded giúp bạn dễ dàng theo dõi thời gian.'
                    ].map((note, i) => (
                        <li key={i} className="flex items-start gap-4 group">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#C8A97E] mt-2 group-hover:scale-150 transition-transform" />
                            <span className="text-sm font-medium text-[#8B7355]">{note}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex justify-center md:justify-end">
                <div className="w-24 h-24 rounded-full bg-[#C8A97E]/10 flex items-center justify-center group-hover:bg-[#C8A97E] transition-all duration-500">
                    <CalendarIcon className="w-10 h-10 text-[#C8A97E] group-hover:text-white group-hover:scale-110 transition-all duration-500" />
                </div>
            </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8A97E] opacity-[0.03] rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}
