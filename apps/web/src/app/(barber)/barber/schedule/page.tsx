'use client';

import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/lib/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Info,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="flex bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 items-center justify-center min-h-[400px] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Đang tải lịch làm việc...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div>
           <Badge className="bg-[#C8A97E]/10 text-[#C8A97E] border-none mb-4 px-3 py-1 font-bold text-[9px] uppercase tracking-[0.2em] rounded-lg">
              Khu vực cá nhân
           </Badge>
           <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-tight">
              Lịch <span className="text-[#C8A97E]">Làm việc</span><br/>
              <span className="text-slate-400">Cá nhân</span>
           </h1>
        </div>
        
        <div className="flex flex-col items-end gap-3">
           <div className="flex items-center bg-slate-900 rounded-2xl p-1.5 shadow-xl shadow-slate-900/20">
                <Button variant="ghost" size="icon" onClick={prevWeek} className="h-10 w-10 rounded-xl text-white hover:bg-white/10 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="px-6 text-center min-w-[200px]">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Thời gian</p>
                   <p className="text-[12px] font-black text-[#C8A97E] uppercase italic whitespace-nowrap tracking-tight">
                      {format(weekStart, 'dd MMM')} – {format(weekEnd, 'dd MMM yyyy')}
                   </p>
                </div>
                <Button variant="ghost" size="icon" onClick={nextWeek} className="h-10 w-10 rounded-xl text-white hover:bg-white/10 hover:text-white">
                  <ChevronRight className="w-5 h-5" />
                </Button>
           </div>
           <Button 
                variant="outline" 
                onClick={goToToday}
                className="rounded-2xl border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 h-10 px-6 shadow-sm"
            >
                Hôm nay
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        {weekDays.map((day) => {
          const dayShifts = shifts?.filter(s => isSameDay(new Date(s.date), day)) || [];
          const isToday = isSameDay(day, new Date());
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isOff = dayShifts.some(s => s.type === 'OFF');

          return (
            <Card 
                key={day.toString()} 
                className={cn(
                    "group border-none shadow-premium hover:shadow-2xl transition-all duration-700 rounded-[2.5rem] overflow-hidden bg-white relative flex flex-col",
                    isToday ? "ring-4 ring-[#C8A97E]/30 scale-[1.05] z-10" : "hover:scale-[1.02]",
                    isOff && !isToday ? "opacity-90" : ""
                )}
            >
              <div className={cn(
                  "p-6 text-center transition-colors duration-500",
                  isToday ? "bg-slate-900 text-white" : "bg-slate-50/50 text-slate-900",
                  isOff && !isToday ? "bg-rose-50/50" : ""
              )}>
                <p className={cn(
                    "text-[9px] font-black uppercase tracking-[0.2em] mb-1 italic",
                    isToday ? "text-[#C8A97E]" : "text-slate-400"
                )}>
                    {format(day, 'EEEE', { locale: vi })}
                </p>
                <p className="text-2xl font-black italic uppercase tracking-tighter tabular-nums leading-none">
                    {format(day, 'dd/MM')}
                </p>
              </div>
              
              <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[160px]">
                {isOff ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center group-hover:bg-rose-500/10 transition-colors">
                       <CalendarDays className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                       <span className="text-[10px] font-black uppercase italic tracking-widest text-rose-500">Ngày nghỉ</span>
                       <p className="text-[8px] font-bold text-rose-300 uppercase mt-1 tracking-tighter italic">Đã được duyệt</p>
                    </div>
                  </div>
                ) : dayShifts.length > 0 ? (
                  dayShifts.map((shift) => (
                    <div 
                        key={shift.id} 
                        className={cn(
                            "w-full p-5 rounded-[1.8rem] border transition-all duration-500 group/shift flex flex-col gap-3 relative overflow-hidden",
                            isToday ? "bg-slate-50 border-[#C8A97E]/20" : "bg-slate-50/50 border-slate-100 hover:bg-slate-100"
                        )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover/shift:bg-[#C8A97E]/10 transition-colors">
                           <Clock className="w-4 h-4 text-[#C8A97E]" />
                        </div>
                        <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-tighter">Lịch làm việc</span>
                      </div>
                      <div className="text-xl font-black text-slate-900 italic tracking-tighter tabular-nums flex items-baseline gap-1">
                        {format(new Date(shift.shiftStart), 'HH:mm')}
                        <span className="text-[10px] text-slate-300 not-italic mx-0.5 opacity-50">–</span>
                        {format(new Date(shift.shiftEnd), 'HH:mm')}
                      </div>
                      {isToday && (
                         <div className="absolute top-2 right-2 flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                         </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-200 animate-pulse">
                    <Info className="w-10 h-10 mb-2 opacity-10" />
                    <span className="text-[9px] font-black uppercase italic tracking-widest leading-none">Chưa có lịch</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="bg-slate-900 p-12 rounded-[3.5rem] mt-12 border border-slate-800 shadow-3xl shadow-slate-900/40 relative overflow-hidden group">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#C8A97E]/10 rounded-full border border-[#C8A97E]/20">
                   <ShieldCheck className="w-4 h-4 text-[#C8A97E]" />
                   <span className="text-[9px] font-black text-[#C8A97E] uppercase tracking-widest italic">Quy định & Hướng dẫn</span>
                </div>
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Nội quy làm việc</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {[
                        'Vui lòng có mặt trước ca làm ít nhất 15 phút.',
                        'Đồng phục sạch sẽ, chỉn chu là bắt buộc.',
                        'Dụng cụ phải được khử khuẩn sau mỗi lượt khách.',
                        'Cập nhật tình trạng hoàn tất ngay khi xong việc.'
                    ].map((note, i) => (
                        <div key={i} className="flex items-start gap-4 group/note">
                            <div className="w-2 h-2 rounded-full bg-[#C8A97E] mt-1.5 group-hover/note:scale-125 transition-transform shadow-[0_0_10px_rgba(200,169,126,0.5)]" />
                            <span className="text-sm font-bold text-slate-400 italic tracking-tight group-hover/note:text-slate-200 transition-colors">{note}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-[#C8A97E] to-amber-200 flex items-center justify-center group-hover:rotate-12 transition-all duration-700 shadow-2xl shadow-amber-900/40">
                    <CalendarIcon className="w-14 h-14 text-slate-950 group-hover:scale-110 transition-transform" />
                </div>
            </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C8A97E] opacity-[0.05] rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-amber-500 opacity-[0.02] rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />
      </div>
    </div>
  );
}
