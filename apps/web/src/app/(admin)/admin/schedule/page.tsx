'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Loader2,
  Calendar as CalendarIcon,
  Home,
  Trash2,
  Store
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminApi, salonApi, StaffShift } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Select } from 'antd';
import { ShiftType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function AdminSchedulePage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  
  // Sheet states
  const [isShiftSheetOpen, setIsShiftSheetOpen] = useState(false);
  const [selectedStaffForShift, setSelectedStaffForShift] = useState<any>(null);
  const [selectedDayForShift, setSelectedDayForShift] = useState<Date | null>(null);
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState<StaffShift | null>(null);

  // Form states
  const [shiftData, setShiftData] = useState({
    type: ShiftType.FULL_DAY,
  });

  // Dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6];

  // Queries
  const { data: salons } = useQuery({
    queryKey: ['salons'],
    queryFn: () => salonApi.getAll(),
  });

  const { data: schedules, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['admin', 'schedules', selectedSalonId, format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => adminApi.getSchedules(
      selectedSalonId!, 
      undefined, 
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    ),
    enabled: !!selectedSalonId,
  });

  const { data: staffList, isLoading: isStaffLoading } = useQuery({
    queryKey: ['admin', 'staff', selectedSalonId],
    queryFn: () => adminApi.getAllStaff({ salonId: selectedSalonId!, limit: 100 }),
    enabled: !!selectedSalonId,
  });

  // Mutations
  const createShiftMutation = useMutation({
    mutationFn: (data: any) => adminApi.createSchedule(data),
    onSuccess: () => {
      toast.success('Đã thêm ca làm việc');
      setIsShiftSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể thêm ca làm');
    }
  });

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => adminApi.updateSchedule(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật ca làm việc');
      setIsShiftSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật ca làm');
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSchedule(id),
    onSuccess: () => {
      toast.success('Đã xóa ca làm việc');
      setIsShiftSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa ca làm');
    }
  });

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleToday = () => setCurrentDate(new Date());

  const getShiftsForDay = (day: Date) => {
    if (!schedules) return [];
    return (schedules as StaffShift[]).filter((shift) => isSameDay(parseISO(shift.date), day));
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <Badge className="bg-[#7C3AED]/10 text-[#7C3AED] border-none mb-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Bảng công
           </Badge>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Lịch làm việc <span className="text-[#7C3AED]">Nhân viên</span>
           </h1>
           <p className="text-slate-500 text-sm mt-1">Điều phối và sắp xếp nhân sự theo từng chi nhánh.</p>
        </div>

        <div className="flex flex-col gap-2 min-w-[280px]">
           <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Store className="w-3.5 h-3.5" />
              Chọn chi nhánh
           </div>
           <Select
             placeholder="Chọn Chi Nhánh"
             className="w-full h-10"
             value={selectedSalonId}
             onChange={setSelectedSalonId}
             options={salons?.data.map(s => ({
               label: s.name,
               value: s.id
             }))}
           />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek} className="h-9 w-9 border-slate-200">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-3 text-center min-w-[120px]">
            <p className="text-[11px] font-bold text-slate-700">
              {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM')}
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextWeek} className="h-9 w-9 border-slate-200">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleToday}
            className="h-9 px-4 text-xs font-bold text-[#7C3AED] hover:bg-[#7C3AED]/5"
          >
            Hiện tại
          </Button>
        </div>
      </div>

      {!selectedSalonId ? (
        <div className="bg-slate-50/50 rounded-2xl p-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
            <Home className="w-10 h-10 text-slate-200 mb-4" />
            <h3 className="text-base font-bold text-slate-400">Chọn chi nhánh để bắt đầu</h3>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-8 border-b bg-slate-50/50">
              <div className="p-4 border-r font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-center">
                Nhân viên
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.toString()}
                  className={cn(
                    "py-3 flex flex-col items-center gap-0.5 border-r last:border-r-0",
                    isSameDay(day, new Date()) ? "bg-[#7C3AED]/5" : ""
                  )}
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {format(day, 'eee', { locale: vi })}
                  </span>
                  <span className={cn(
                    "text-lg font-bold tabular-nums",
                    isSameDay(day, new Date()) ? "text-[#7C3AED]" : "text-slate-900"
                  )}>
                    {format(day, 'dd')}
                  </span>
                </div>
              ))}
            </div>

            <div className="divide-y">
              {isSchedulesLoading || isStaffLoading ? (
                <div className="py-20 flex flex-col items-center justify-center col-span-8">
                  <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin mb-3" />
                  <p className="text-slate-400 text-xs font-medium">Đang tải lịch...</p>
                </div>
              ) : (
                staffList?.data.map((staff: any) => (
                  <div key={staff.id} className="grid grid-cols-8 hover:bg-slate-50/30 transition-colors">
                    <div className="p-3 border-r flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-white shadow-sm">
                        <AvatarImage src={staff.user?.avatar} />
                        <AvatarFallback className="bg-slate-100 text-slate-400 text-[10px] font-bold">
                          {staff.user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{staff.user?.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium uppercase truncate">{staff.position}</p>
                      </div>
                    </div>

                    {weekDays.map((day) => {
                      const dayShifts = getShiftsForDay(day);
                      const staffShift = dayShifts.find((s) => s.staffId === staff.id);

                      return (
                        <div key={day.toString()} className="border-r last:border-r-0 p-1.5 min-h-[90px] group">
                          {staffShift ? (
                            <div
                              onClick={() => {
                                setSelectedStaffForShift(staff);
                                setSelectedDayForShift(day);
                                setSelectedShiftForEdit(staffShift);
                                setShiftData({ type: staffShift.type as any });
                                setIsShiftSheetOpen(true);
                              }}
                              className={cn(
                                "w-full h-full p-2 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between shadow-sm hover:shadow-md",
                                staffShift.type === ShiftType.MORNING ? "bg-amber-50 border-amber-100 text-amber-700" :
                                staffShift.type === ShiftType.AFTERNOON ? "bg-blue-50 border-blue-100 text-blue-700" :
                                staffShift.type === ShiftType.EVENING ? "bg-purple-50 border-purple-100 text-purple-700" :
                                staffShift.type === ShiftType.OFF ? "bg-slate-50 border-slate-200 text-slate-400" :
                                "bg-slate-900 border-slate-800 text-white"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold uppercase truncate">
                                  {staffShift.type === ShiftType.MORNING ? 'Sáng' :
                                   staffShift.type === ShiftType.AFTERNOON ? 'Chiều' :
                                   staffShift.type === ShiftType.EVENING ? 'Tối' :
                                   staffShift.type === ShiftType.OFF ? 'Nghỉ' : 'Full'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                 <Clock className="w-3 h-3 opacity-50" />
                                 <span className="text-[10px] font-bold tabular-nums">
                                    {format(new Date(staffShift.shiftStart), 'HH:mm')}
                                 </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedStaffForShift(staff);
                                setSelectedDayForShift(day);
                                setSelectedShiftForEdit(null);
                                setShiftData({ type: ShiftType.FULL_DAY });
                                setIsShiftSheetOpen(true);
                              }}
                              className="w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed border-slate-50 bg-slate-50/10 hover:border-[#7C3AED]/20 hover:bg-[#7C3AED]/5 opacity-0 group-hover:opacity-100 transition-all"
                            >
                               <Plus className="w-4 h-4 text-slate-300" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shift Edit/Create Sheet */}
      <Sheet open={isShiftSheetOpen} onOpenChange={setIsShiftSheetOpen}>
        <SheetContent className="bg-white border-none sm:max-w-[400px] p-0 overflow-hidden shadow-2xl flex flex-col rounded-l-2xl">
          <SheetHeader className="p-6 pb-0 flex flex-col items-start">
            <div className="p-2.5 bg-[#7C3AED]/10 rounded-xl mb-4">
               <CalendarIcon className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <SheetTitle className="text-xl font-bold text-slate-900">
              {selectedShiftForEdit ? 'Cập nhật' : 'Thêm'} ca làm việc
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-500">
               {selectedStaffForShift?.user?.name} &bull; {selectedDayForShift && format(selectedDayForShift, 'dd/MM/yyyy')}
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-6 space-y-4 flex-1 overflow-y-auto no-scrollbar">
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chọn loại ca làm</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: ShiftType.MORNING, label: 'Ca sáng (08:00 - 12:00)', icon: '☀️', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                  { id: ShiftType.AFTERNOON, label: 'Ca chiều (12:00 - 16:00)', icon: '⛅', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { id: ShiftType.EVENING, label: 'Ca tối (16:00 - 20:00)', icon: '🌙', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                  { id: ShiftType.FULL_DAY, label: 'Cả ngày (08:00 - 20:00)', icon: '⌛', color: 'bg-slate-900 border-slate-800 text-white' },
                  { id: ShiftType.OFF, label: 'Nghỉ (Day Off)', icon: '🏠', color: 'bg-slate-50 border-slate-200 text-slate-500' },
                ].map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setShiftData({ ...shiftData, type: type.id as any })}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all font-bold text-xs",
                      shiftData.type === type.id
                        ? cn(type.color, "ring-2 ring-[#7C3AED]/20 shadow-sm")
                        : "border-slate-50 bg-white text-slate-400 hover:bg-slate-50 hover:border-slate-100"
                    )}
                  >
                    <span className="text-lg">{type.icon}</span>
                    {type.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-slate-50/50 flex flex-col gap-2 shrink-0">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400"
                onClick={() => setIsShiftSheetOpen(false)}
              >
                Hủy
              </Button>
              <Button
                className="flex-[2] h-11 rounded-xl font-bold uppercase text-xs bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg active:scale-95 transition-all"
                onClick={() => {
                  if (selectedShiftForEdit) {
                    updateShiftMutation.mutate({ id: selectedShiftForEdit.id, data: { type: shiftData.type } });
                  } else {
                     createShiftMutation.mutate({
                      staffId: selectedStaffForShift.id,
                      salonId: selectedSalonId,
                      date: format(selectedDayForShift!, 'yyyy-MM-dd'),
                      type: shiftData.type
                    });
                  }
                }}
                disabled={createShiftMutation.isPending || updateShiftMutation.isPending}
              >
                {(createShiftMutation.isPending || updateShiftMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Xác nhận
              </Button>
            </div>

            {selectedShiftForEdit && (
              <Button
                variant="ghost"
                className="w-full h-10 rounded-xl text-rose-500 font-bold uppercase text-[10px] tracking-widest hover:bg-rose-50"
                onClick={() => {
                  if (confirm('Xóa ca làm việc này?')) deleteShiftMutation.mutate(selectedShiftForEdit.id);
                }}
                disabled={deleteShiftMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Xóa ca làm
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
