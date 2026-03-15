'use client';

import { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShiftCard } from './ShiftCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ScheduleCalendarProps {
  staffList: any[];
  shifts: any[];
  onAddShift: (date: Date, staffId: string) => void;
  onDeleteShift: (id: string) => void;
}

export function ScheduleCalendar({ 
  staffList, 
  shifts, 
  onAddShift, 
  onDeleteShift 
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday

  const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const changeWeek = (amount: number) => {
    setCurrentDate(addDays(currentDate, amount * 7));
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D4] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-[#E8E0D4] flex items-center justify-between bg-[#FAF8F5]">
        <div>
            <h3 className="text-xl font-black text-[#2C1E12] italic uppercase tracking-tight">
                Lịch làm việc tuần
            </h3>
            <p className="text-sm font-bold text-[#C8A97E] uppercase tracking-widest mt-1">
                {format(startDate, 'dd/MM/yyyy')} - {format(addDays(startDate, 6), 'dd/MM/yyyy')}
            </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeWeek(-1)} className="border-[#E8E0D4] rounded-xl hover:bg-white hover:text-[#C8A97E]">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="outline" className="border-[#E8E0D4] rounded-xl font-bold text-[#8B7355] hover:bg-white px-5" onClick={() => setCurrentDate(new Date())}>
            Hôm nay
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeWeek(1)} className="border-[#E8E0D4] rounded-xl hover:bg-white hover:text-[#C8A97E]">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Table Head */}
          <div className="grid grid-cols-[240px_repeat(7,1fr)] bg-[#FAF8F5] border-b border-[#E8E0D4]">
            <div className="p-4 border-r border-[#E8E0D4] flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-[#C8A97E]" />
                <span className="text-xs font-black uppercase italic text-[#2C1E12]">Nhân viên / Ngày</span>
            </div>
            {days.map((day) => (
              <div key={day.toString()} className={cn("p-4 text-center border-r border-[#E8E0D4] last:border-r-0", isSameDay(day, new Date()) && "bg-[#C8A97E]/5")}>
                <p className="text-[10px] font-black uppercase text-[#8B7355] tracking-widest mb-1">
                   {format(day, 'EEEE', { locale: vi })}
                </p>
                <p className={cn("text-lg font-black italic", isSameDay(day, new Date()) ? "text-[#C8A97E]" : "text-[#2C1E12]")}>
                  {format(day, 'dd/MM')}
                </p>
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#E8E0D4]">
            {staffList.map((staff) => (
              <div key={staff.id} className="grid grid-cols-[240px_repeat(7,1fr)] hover:bg-[#FAF8F5]/50 transition-colors">
                {/* Staff Name */}
                <div className="p-4 border-r border-[#E8E0D4] flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={staff.user?.avatar} />
                    <AvatarFallback className="bg-[#C8A97E]/10 text-[#C8A97E] font-bold">
                      {staff.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-extrabold text-[#2C1E12] leading-tight">{staff.user?.name}</p>
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase mt-0.5">{staff.position}</p>
                  </div>
                </div>

                {/* Day Slots */}
                {days.map((day) => {
                  const dayShifts = shifts.filter(s => 
                    s.staffId === staff.id && isSameDay(new Date(s.date), day)
                  );

                  return (
                    <div key={day.toString()} className={cn("p-3 border-r border-[#E8E0D4] last:border-r-0 min-h-[120px]", isSameDay(day, new Date()) && "bg-[#C8A97E]/5")}>
                      <div className="space-y-2">
                        {dayShifts.map(shift => {
                            return (
                                <ShiftCard 
                                    key={shift.id} 
                                    type={shift.type} 
                                    onDelete={() => onDeleteShift(shift.id)} 
                                />
                            );
                        })}
                        
                        <button 
                          onClick={() => onAddShift(day, staff.id)}
                          className="w-full h-10 border-2 border-dashed border-[#E8E0D4] rounded-xl flex items-center justify-center text-[#8B7355] hover:border-[#C8A97E] hover:text-[#C8A97E] hover:bg-white transition-all group"
                        >
                          <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
