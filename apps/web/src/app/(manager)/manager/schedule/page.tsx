'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin,
  X,
  Loader2,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { managerApi, usersApi, StaffShift } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { ShiftType } from '@/lib/types';

export default function ManagerSchedulePage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Sheet states
  const [isShiftSheetOpen, setIsShiftSheetOpen] = useState(false);
  const [selectedStaffForShift, setSelectedStaffForShift] = useState<any>(null);
  const [selectedDayForShift, setSelectedDayForShift] = useState<Date | null>(null);
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState<StaffShift | null>(null);

  // Form states
  const [shiftData, setShiftData] = useState({
    type: ShiftType.FULL_DAY,
    note: '',
  });

  // Dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6];

  // Queries
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
  });

  const { data: schedules, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['manager', 'schedules', format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => managerApi.getSchedules(
      undefined, 
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    ),
  });

  const { data: staffList } = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: managerApi.getStaff,
  });

  // Mutations
  const createShiftMutation = useMutation({
    mutationFn: (data: any) => managerApi.createShift(data),
    onSuccess: () => {
      toast.success('Đã thêm ca làm việc');
      setIsShiftSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể thêm ca làm');
    }
  });

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => managerApi.updateShift(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật ca làm việc');
      setIsShiftSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật ca làm');
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: string) => managerApi.deleteShift(id),
    onSuccess: () => {
      toast.success('Đã xóa ca làm việc');
      setIsShiftSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'schedules'] });
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-heading italic uppercase tracking-tight">
            Quản lý <span className="text-[#C8A97E]">Lịch làm</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Sắp xếp ca trực và điều phối nhân sự tại chi nhánh.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm mr-2">
             <MapPin className="w-4 h-4 text-[#C8A97E]" />
             <span className="text-xs font-black uppercase text-slate-600 tracking-wider">
                {me?.staff?.salon?.name || 'Chi nhánh hiện tại'}
             </span>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8 rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="px-3 h-8 font-black text-[10px] uppercase tracking-widest text-[#C8A97E]">
              Hôm nay
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto relative no-scrollbar">
        <Card className="border-none shadow-premium bg-white min-w-[1000px] rounded-[2rem] overflow-hidden">
          <div className="grid grid-cols-8 border-b bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
            <div className="p-6 border-r flex items-center justify-center font-black text-slate-400 text-[10px] uppercase tracking-widest bg-white">
              Nhân sự
            </div>
            {weekDays.map((day) => (
              <div 
                key={day.toString()} 
                className={cn(
                  "py-5 flex flex-col items-center gap-1 border-r last:border-r-0 transition-all",
                  isSameDay(day, new Date()) ? "bg-[#C8A97E]/5 relative" : ""
                )}
              >
                {isSameDay(day, new Date()) && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#C8A97E]" />
                )}
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {format(day, 'eee', { locale: vi })}
                </span>
                <span className={cn(
                  "text-xl font-black tabular-nums",
                  isSameDay(day, new Date()) ? "text-[#C8A97E]" : "text-slate-700"
                )}>
                  {format(day, 'dd')}
                </span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100">
            {isSchedulesLoading ? (
              <div className="py-20 flex flex-col items-center justify-center col-span-8">
                <Loader2 className="w-8 h-8 text-[#C8A97E] animate-spin mb-4" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Đang tải lịch làm việc...</p>
              </div>
            ) : (
              staffList?.map((staff: any) => (
                <div key={staff.id} className="grid grid-cols-8 group">
                  <div className="p-4 border-r bg-slate-50/10 flex items-center gap-4 min-w-[180px]">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md group-hover:border-[#C8A97E] transition-all">
                      <AvatarImage src={staff.user?.avatar} />
                      <AvatarFallback className="bg-[#C8A97E]/5 text-[#C8A97E] text-[10px] font-black uppercase">
                        {staff.user?.name?.charAt(0) || 'B'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate uppercase italic">{staff.user?.name || 'Unknown'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">{staff.position}</p>
                    </div>
                  </div>

                  {weekDays.map((day) => {
                    const dayShifts = getShiftsForDay(day);
                    const staffShift = dayShifts.find((s) => s.staffId === staff.id);
                    
                    return (
                      <div key={day.toString()} className="border-r last:border-r-0 p-3 min-h-[120px] bg-white group-hover:bg-slate-50/20 transition-colors relative flex items-center justify-center">
                        {staffShift ? (
                          <div 
                            onClick={() => {
                              setSelectedStaffForShift(staff);
                              setSelectedDayForShift(day);
                              setSelectedShiftForEdit(staffShift);
                              setShiftData({ type: staffShift.type, note: '' });
                              setIsShiftSheetOpen(true);
                            }}
                            className={cn(
                              "w-full h-full p-3 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] group/shift flex flex-col justify-between items-start gap-1 relative overflow-hidden",
                              staffShift.type === ShiftType.MORNING ? "bg-amber-50/30 border-amber-200/50 text-amber-700" :
                              staffShift.type === ShiftType.AFTERNOON ? "bg-blue-50/30 border-blue-200/50 text-blue-700" :
                              "bg-slate-900 border-slate-800 text-white"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest",
                                staffShift.type === ShiftType.FULL_DAY ? "text-[#C8A97E]" : "opacity-60"
                              )}>
                                {staffShift.type === ShiftType.MORNING ? 'Sáng' : 
                                 staffShift.type === ShiftType.AFTERNOON ? 'Chiều' : 'Cả ngày'}
                              </span>
                              <div className="transform group-hover/shift:rotate-12 transition-transform duration-500">
                                 {staffShift.type === ShiftType.MORNING && <span>☀️</span>}
                                 {staffShift.type === ShiftType.AFTERNOON && <span>⛅</span>}
                                 {staffShift.type === ShiftType.FULL_DAY && <span>⏳</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black italic tracking-tight">
                              <Clock className={cn("w-3 h-3", staffShift.type === ShiftType.FULL_DAY ? "text-[#C8A97E]" : "")} />
                              {format(new Date(staffShift.shiftStart), 'HH:mm')} - {format(new Date(staffShift.shiftEnd), 'HH:mm')}
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setSelectedStaffForShift(staff);
                              setSelectedDayForShift(day);
                              setSelectedShiftForEdit(null);
                              setShiftData({ type: ShiftType.FULL_DAY, note: '' });
                              setIsShiftSheetOpen(true);
                            }}
                            className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl opacity-0 hover:opacity-100 hover:border-[#C8A97E]/30 hover:bg-[#C8A97E]/5 transition-all duration-300 text-slate-300 group-hover:opacity-40"
                          >
                            <Plus className="w-6 h-6 mb-1" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Phân ca</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Shift Edit/Create Sheet */}
      <Sheet open={isShiftSheetOpen} onOpenChange={setIsShiftSheetOpen}>
        <SheetContent className="bg-white border-l-0 sm:max-w-md rounded-l-[3rem] p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-10 pb-0 flex flex-col items-start text-left">
            <div className="p-3 bg-[#C8A97E]/10 rounded-2xl mb-4">
               <Clock className="w-8 h-8 text-[#C8A97E]" />
            </div>
            <SheetTitle className="text-3xl font-black font-heading italic uppercase tracking-tighter text-slate-900">
              {selectedShiftForEdit ? 'Cập nhật' : 'Thiết lập'} <span className="text-[#C8A97E]">Ca làm</span>
            </SheetTitle>
            <SheetDescription className="font-medium text-slate-500 italic">
               Thiết lập thời gian làm việc cho nhân viên tại chi nhánh.
            </SheetDescription>
          </SheetHeader>

          <div className="px-10 py-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center shadow-inner">
                  <CalendarIcon className="w-5 h-5 text-slate-300 mb-2" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày làm việc</p>
                  <p className="text-sm font-black text-slate-900 italic">
                    {selectedDayForShift && format(selectedDayForShift, 'dd/MM/yyyy')}
                  </p>
               </div>
               <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center shadow-inner">
                  <Avatar className="h-6 w-6 mb-2 border border-white shadow-sm">
                     <AvatarImage src={selectedStaffForShift?.user?.avatar} />
                     <AvatarFallback className="bg-slate-200 text-[10px] font-bold">
                        {selectedStaffForShift?.user?.name?.charAt(0) || 'B'}
                     </AvatarFallback>
                  </Avatar>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nhân viên</p>
                  <p className="text-sm font-black text-slate-900 italic truncate w-full px-2">
                    {selectedStaffForShift?.user?.name || 'Đang tải...'}
                  </p>
               </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C8A97E] px-2">Lựa chọn ca trực</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: ShiftType.MORNING, label: 'Ca Sáng (08:00 - 12:00)', icon: '☀️', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                  { id: ShiftType.AFTERNOON, label: 'Ca Chiều (13:00 - 18:00)', icon: '⛅', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                  { id: ShiftType.FULL_DAY, label: 'Cả Ngày (08:00 - 18:00)', icon: '⏳', color: 'bg-slate-900 text-white border-slate-800' },
                ].map((type) => (
                  <div 
                    key={type.id}
                    onClick={() => setShiftData({ ...shiftData, type: type.id })}
                    className={cn(
                      "flex items-center gap-5 p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]",
                      shiftData.type === type.id 
                        ? cn(type.color, "scale-[1.02] ring-4 ring-[#C8A97E]/10") 
                        : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <div className="text-2xl transform transition-transform group-hover:scale-110">{type.icon}</div>
                    <span className="font-black italic uppercase text-xs tracking-tight">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex flex-col gap-3">
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50" 
                  onClick={() => setIsShiftSheetOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  className="flex-[2] h-14 rounded-2xl font-black italic uppercase text-xs tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
                  onClick={() => {
                    if (selectedShiftForEdit) {
                      updateShiftMutation.mutate({ id: selectedShiftForEdit.id, data: { type: shiftData.type } });
                    } else {
                      createShiftMutation.mutate({
                        staffId: selectedStaffForShift.id,
                        salonId: me?.staff?.salonId,
                        date: format(selectedDayForShift!, 'yyyy-MM-dd'),
                        type: shiftData.type
                      });
                    }
                  }}
                  disabled={createShiftMutation.isPending || updateShiftMutation.isPending}
                >
                  {(createShiftMutation.isPending || updateShiftMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-3 text-[#C8A97E]" />}
                  {selectedShiftForEdit ? 'Cập nhật' : 'Xác nhận'}
                </Button>
              </div>
              
              {selectedShiftForEdit && (
                <Button 
                  variant="ghost" 
                  className="w-full h-14 rounded-2xl text-rose-500 font-black italic uppercase text-[10px] tracking-widest hover:bg-rose-50/50 mt-2"
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn xóa ca làm này?')) deleteShiftMutation.mutate(selectedShiftForEdit.id);
                  }}
                  disabled={deleteShiftMutation.isPending}
                >
                  {deleteShiftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                  Xóa ca làm
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
