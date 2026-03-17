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
  Trash2,
  Users,
  CheckCheck
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { managerApi, StaffShift } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';

export default function ManagerSchedulePage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Sheet states
  const [isShiftSheetOpen, setIsShiftSheetOpen] = useState(false);
  const [isBulkSheetOpen, setIsBulkSheetOpen] = useState(false);
  const [selectedStaffForShift, setSelectedStaffForShift] = useState<any>(null);
  const [selectedDayForShift, setSelectedDayForShift] = useState<Date | null>(null);
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState<StaffShift | null>(null);

  // Form states
  const [shiftData, setShiftData] = useState({
    type: ShiftType.FULL_DAY,
  });

  // Bulk form states
  const [bulkType, setBulkType] = useState<ShiftType>(ShiftType.FULL_DAY);
  const [bulkSelectedDays, setBulkSelectedDays] = useState<string[]>([]);
  const [bulkSelectedStaffIds, setBulkSelectedStaffIds] = useState<string[]>([]);

  // Dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6];

  // Queries
  const { data: schedules, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['manager', 'schedules', format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => managerApi.getSchedules(undefined, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')),
  });

  const { data: staffData, isLoading: isStaffLoading } = useQuery({
    queryKey: ['manager', 'staff', 'schedule-list'],
    queryFn: () => managerApi.getStaff({ limit: 100 }),
  });

  // Handle both array and paginated response
  const staffList = useMemo(() => {
    let list: any[] = [];
    if (!staffData) list = [];
    else if (Array.isArray(staffData)) list = staffData;
    else if (Array.isArray(staffData.data)) list = staffData.data;
    // Exclude managers — they shouldn't set schedules for themselves
    return list.filter((s: any) => s.position !== 'MANAGER' && s.position !== 'BRANCH_MANAGER');
  }, [staffData]);

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

  const bulkCreateMutation = useMutation({
    mutationFn: (data: { staffIds: string[]; dates: string[]; type: string }) => managerApi.bulkCreateShifts(data),
    onSuccess: (result: any) => {
      toast.success(`Đã tạo ${result.created} ca, cập nhật ${result.updated} ca`);
      setIsBulkSheetOpen(false);
      setBulkSelectedDays([]);
      setBulkSelectedStaffIds([]);
      queryClient.invalidateQueries({ queryKey: ['manager', 'schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể tạo lịch hàng loạt');
    }
  });

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleToday = () => setCurrentDate(new Date());

  const getShiftsForDay = (day: Date) => {
    if (!schedules || !Array.isArray(schedules)) return [];
    const dayStr = format(day, 'yyyy-MM-dd');
    return (schedules as StaffShift[]).filter((shift) => {
      // Compare date strings to avoid timezone issues
      const shiftDateStr = shift.date?.substring(0, 10) || format(parseISO(shift.date), 'yyyy-MM-dd');
      return shiftDateStr === dayStr;
    });
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <Badge className="bg-primary/10 text-primary border-none mb-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Bảng công
           </Badge>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-heading italic uppercase">
              Phân lịch <span className="text-primary">Làm việc</span>
           </h1>
           <p className="text-slate-500 text-sm mt-1">Sắp xếp ca làm việc cho đội ngũ nhân viên tại chi nhánh.</p>
        </div>

         <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-2 border rounded-xl shadow-sm">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8 text-slate-400">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-2 text-center">
              <p className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM')}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-slate-100 mx-1" />
            <Button
              variant="ghost"
              onClick={handleToday}
              className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5"
            >
              Hôm nay
            </Button>
          </div>

          <Button
            onClick={() => {
              setBulkType(ShiftType.FULL_DAY);
              setBulkSelectedDays([]);
              setBulkSelectedStaffIds([]);
              setIsBulkSheetOpen(true);
            }}
            className="h-9 px-4 gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm"
          >
            <Users className="w-4 h-4" />
            Set lịch hàng loạt
          </Button>
         </div>
      </div>

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
                  isSameDay(day, new Date()) ? "bg-primary/5" : ""
                )}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {format(day, 'eee', { locale: vi })}
                </span>
                <span className={cn(
                  "text-lg font-bold tabular-nums",
                  isSameDay(day, new Date()) ? "text-primary" : "text-slate-900"
                )}>
                  {format(day, 'dd')}
                </span>
              </div>
            ))}
          </div>

          <div className="divide-y">
            {isSchedulesLoading || isStaffLoading ? (
              <div className="py-20 flex flex-col items-center justify-center col-span-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-slate-400 text-xs font-medium">Đang tải lịch...</p>
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center col-span-8">
                <CalendarIcon className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm font-medium">Chưa có nhân viên nào</p>
              </div>
            ) : (
              staffList.map((staff: any) => (
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
                              staffShift.type === ShiftType.EVENING ? "bg-indigo-50 border-indigo-100 text-indigo-700" :
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
                            className="w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed border-slate-50 bg-slate-50/10 hover:border-primary/20 hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-all"
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

      {/* Shift Edit/Create Sheet */}
      <Sheet open={isShiftSheetOpen} onOpenChange={setIsShiftSheetOpen}>
        <SheetContent className="bg-white border-none sm:max-w-[400px] p-0 overflow-hidden shadow-2xl flex flex-col rounded-l-2xl">
          <SheetHeader className="p-6 pb-0 flex flex-col items-start">
            <div className="p-2.5 bg-primary/10 rounded-xl mb-4">
               <CalendarIcon className="w-5 h-5 text-primary" />
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
                  { id: ShiftType.AFTERNOON, label: 'Ca chiều (13:00 - 18:00)', icon: '⛅', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { id: ShiftType.EVENING, label: 'Ca tối (17:00 - 21:00)', icon: '🌙', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                  { id: ShiftType.FULL_DAY, label: 'Cả ngày (08:00 - 18:00)', icon: '⌛', color: 'bg-slate-900 border-slate-800 text-white' },
                  { id: ShiftType.OFF, label: 'Nghỉ (Day Off)', icon: '🏠', color: 'bg-slate-50 border-slate-200 text-slate-500' },
                ].map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setShiftData({ ...shiftData, type: type.id as any })}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all font-bold text-xs",
                      shiftData.type === type.id
                        ? cn(type.color, "ring-2 ring-primary/20 shadow-sm")
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
                className="flex-[2] h-11 rounded-xl font-bold uppercase text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-lg active:scale-95 transition-all"
                onClick={() => {
                  if (selectedShiftForEdit) {
                    updateShiftMutation.mutate({ id: selectedShiftForEdit.id, data: { type: shiftData.type } });
                  } else {
                     createShiftMutation.mutate({
                      staffId: selectedStaffForShift.id,
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

      {/* Bulk Schedule Sheet */}
      <Sheet open={isBulkSheetOpen} onOpenChange={setIsBulkSheetOpen}>
        <SheetContent className="bg-white border-none sm:max-w-[440px] p-0 overflow-hidden shadow-2xl flex flex-col rounded-l-2xl">
          <SheetHeader className="p-6 pb-0 flex flex-col items-start">
            <div className="p-2.5 bg-primary/10 rounded-xl mb-4">
               <Users className="w-5 h-5 text-primary" />
            </div>
            <SheetTitle className="text-xl font-bold text-slate-900">
              Set lịch hàng loạt
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-500">
              {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM/yyyy')}
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 py-5 space-y-6 flex-1 overflow-y-auto no-scrollbar">
            {/* Step 1: Shift type */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-black">1</span>
                Chọn loại ca
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: ShiftType.FULL_DAY, label: 'Full Day', icon: '⌛', short: '08-18h' },
                  { id: ShiftType.MORNING, label: 'Ca sáng', icon: '☀️', short: '08-12h' },
                  { id: ShiftType.AFTERNOON, label: 'Ca chiều', icon: '⛅', short: '13-18h' },
                  { id: ShiftType.EVENING, label: 'Ca tối', icon: '🌙', short: '17-21h' },
                  { id: ShiftType.OFF, label: 'Nghỉ', icon: '🏠', short: 'Day off' },
                ].map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setBulkType(type.id)}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold",
                      bulkType === type.id
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <span className="text-base">{type.icon}</span>
                    <div>
                      <p className="text-[11px] font-bold">{type.label}</p>
                      <p className="text-[9px] opacity-60">{type.short}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Select days */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-black">2</span>
                Chọn ngày áp dụng
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    if (bulkSelectedDays.length === weekDays.length) {
                      setBulkSelectedDays([]);
                    } else {
                      setBulkSelectedDays(weekDays.map(d => format(d, 'yyyy-MM-dd')));
                    }
                  }}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  {bulkSelectedDays.length === weekDays.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const weekdays = weekDays.slice(0, 5).map(d => format(d, 'yyyy-MM-dd'));
                    setBulkSelectedDays(weekdays);
                  }}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  T2 → T6
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {weekDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isSelected = bulkSelectedDays.includes(dayStr);
                  return (
                    <div
                      key={dayStr}
                      onClick={() => {
                        if (isSelected) {
                          setBulkSelectedDays(prev => prev.filter(d => d !== dayStr));
                        } else {
                          setBulkSelectedDays(prev => [...prev, dayStr]);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-primary border-primary" : "border-slate-200"
                      )}>
                        {isSelected && <CheckCheck className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className={cn("text-xs font-bold", isSelected ? "text-primary" : "text-slate-500")}>
                          {format(day, 'eee', { locale: vi })}
                        </p>
                        <p className="text-[10px] text-slate-400">{format(day, 'dd/MM')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Select staff */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-black">3</span>
                Chọn nhân viên
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    if (bulkSelectedStaffIds.length === staffList.length) {
                      setBulkSelectedStaffIds([]);
                    } else {
                      setBulkSelectedStaffIds(staffList.map((s: any) => s.id));
                    }
                  }}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  {bulkSelectedStaffIds.length === staffList.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {staffList.map((staff: any) => {
                  const isSelected = bulkSelectedStaffIds.includes(staff.id);
                  return (
                    <div
                      key={staff.id}
                      onClick={() => {
                        if (isSelected) {
                          setBulkSelectedStaffIds(prev => prev.filter(id => id !== staff.id));
                        } else {
                          setBulkSelectedStaffIds(prev => [...prev, staff.id]);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                        isSelected ? "bg-primary border-primary" : "border-slate-200"
                      )}>
                        {isSelected && <CheckCheck className="w-3 h-3 text-white" />}
                      </div>
                      <Avatar className="h-7 w-7 border border-white shadow-sm shrink-0">
                        <AvatarImage src={staff.user?.avatar} />
                        <AvatarFallback className="bg-slate-100 text-slate-400 text-[9px] font-bold">
                          {staff.user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-bold truncate", isSelected ? "text-primary" : "text-slate-600")}>
                          {staff.user?.name}
                        </p>
                        <p className="text-[9px] text-slate-400 uppercase">{staff.position}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary + Actions */}
          <div className="p-6 border-t bg-slate-50/50 space-y-3 shrink-0">
            {bulkSelectedDays.length > 0 && bulkSelectedStaffIds.length > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-primary">
                  {bulkSelectedStaffIds.length} nhân viên × {bulkSelectedDays.length} ngày = {' '}
                  <span className="text-base">{bulkSelectedStaffIds.length * bulkSelectedDays.length}</span> ca sẽ được tạo
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400"
                onClick={() => setIsBulkSheetOpen(false)}
              >
                Hủy
              </Button>
              <Button
                className="flex-[2] h-11 rounded-xl font-bold uppercase text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-lg active:scale-95 transition-all disabled:opacity-50"
                onClick={() => {
                  bulkCreateMutation.mutate({
                    staffIds: bulkSelectedStaffIds,
                    dates: bulkSelectedDays,
                    type: bulkType,
                  });
                }}
                disabled={bulkSelectedDays.length === 0 || bulkSelectedStaffIds.length === 0 || bulkCreateMutation.isPending}
              >
                {bulkCreateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Áp dụng
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
