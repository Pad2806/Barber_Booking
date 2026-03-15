'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin,
  X,
  Loader2,
  Calendar as CalendarIcon,
  Store,
  ShieldCheck,
  ShieldAlert
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
import { Select, Badge as AntBadge, ConfigProvider } from 'antd';
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
    note: '',
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

  const selectedSalonName = useMemo(() => {
    return salons?.data.find(s => s.id === selectedSalonId)?.name || 'Chọn chi nhánh';
  }, [salons, selectedSalonId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div>
           <Badge className="bg-[#C8A97E]/10 text-[#C8A97E] border-none mb-4 px-3 py-1 font-bold text-[9px] uppercase tracking-[0.2em] rounded-lg">
              Admin Control Panel
           </Badge>
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-tight">
              Global <span className="text-[#C8A97E]">Staff</span><br/>
              <span className="text-slate-300">Schedules</span>
           </h1>
        </div>
        
        <div className="flex flex-col items-end gap-4">
           <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-2 pr-6 shadow-sm min-w-[300px] group hover:border-[#C8A97E]/30 transition-all">
              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-[#C8A97E]/10 transition-colors">
                 <Store className="w-5 h-5 text-slate-400 group-hover:text-[#C8A97E]" />
              </div>
              <div className="flex-1">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Select Branch</p>
                 <Select
                    placeholder="Chọn chi nhánh..."
                    className="w-full border-none shadow-none font-black italic uppercase text-xs"
                    variant="borderless"
                    value={selectedSalonId}
                    onChange={setSelectedSalonId}
                    options={salons?.data.map(s => ({ label: s.name, value: s.id }))}
                 />
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center bg-slate-900 rounded-2xl p-1.5 shadow-xl shadow-slate-900/20">
                <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-10 w-10 rounded-xl text-white hover:bg-white/10 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="px-4 text-center min-w-[140px]">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Week View</p>
                   <p className="text-[10px] font-black text-[#C8A97E] uppercase italic whitespace-nowrap">
                      {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM')}
                   </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-10 w-10 rounded-xl text-white hover:bg-white/10 hover:text-white">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={handleToday} 
                className="h-[52px] px-6 rounded-2xl border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-900 hover:bg-slate-50 shadow-sm"
              >
                Hôm nay
              </Button>
           </div>
        </div>
      </div>

      {!selectedSalonId ? (
        <div className="bg-white/50 backdrop-blur-md rounded-[3rem] p-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 shadow-2xl">
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-100 mb-8 shadow-inner border border-slate-50">
              <Store className="w-12 h-12" />
           </div>
           <h3 className="text-3xl font-black text-slate-200 uppercase italic tracking-tighter">Please Select a Branch</h3>
           <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-widest">To manage staff schedules and shifts</p>
        </div>
      ) : (
        <div className="overflow-x-auto relative no-scrollbar group">
          <Card className="border-none shadow-premium bg-white min-w-[1200px] rounded-[3rem] overflow-hidden border border-slate-100">
            <div className="grid grid-cols-8 border-b bg-slate-50/30 sticky top-0 z-10 backdrop-blur-xl">
              <div className="p-8 border-r flex flex-col items-center justify-center bg-white shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
                <p className="font-black text-slate-300 text-[10px] uppercase tracking-[0.2em] mb-1 italic">DIRECTORY</p>
                <p className="font-black text-slate-900 text-xs italic uppercase tracking-tighter">Personnel</p>
              </div>
              {weekDays.map((day) => (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "py-6 flex flex-col items-center gap-1 border-r last:border-r-0 transition-all duration-500",
                    isSameDay(day, new Date()) ? "bg-[#C8A97E]/5 relative" : ""
                  )}
                >
                  {isSameDay(day, new Date()) && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#C8A97E] shadow-[0_4px_12px_rgba(200,169,126,0.3)]" />
                  )}
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {format(day, 'eeee', { locale: vi })}
                  </span>
                  <span className={cn(
                    "text-2xl font-black tabular-nums tracking-tighter",
                    isSameDay(day, new Date()) ? "text-[#C8A97E]" : "text-slate-900"
                  )}>
                    {format(day, 'dd')}
                  </span>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-50">
              {isSchedulesLoading || isStaffLoading ? (
                <div className="py-40 flex flex-col items-center justify-center col-span-8 bg-white/50">
                  <div className="w-16 h-16 border-4 border-[#C8A97E]/20 border-t-[#C8A97E] rounded-full animate-spin mb-6" />
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Schedules...</p>
                </div>
              ) : (
                staffList?.data.map((staff: any) => (
                  <div key={staff.id} className="grid grid-cols-8 group/row hover:bg-slate-50/30 transition-colors">
                    <div className="p-6 border-r bg-white sticky left-0 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)] z-10 flex items-center gap-4 min-w-[220px]">
                      <div className="relative">
                         <Avatar className="h-14 w-14 border-4 border-white shadow-xl group-hover/row:border-[#C8A97E]/20 transition-all duration-500">
                           <AvatarImage src={staff.user?.avatar} />
                           <AvatarFallback className="bg-slate-100 text-slate-300 text-lg font-black italic">
                             {staff.user?.name?.charAt(0)}
                           </AvatarFallback>
                         </Avatar>
                         <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate uppercase italic tracking-tight">{staff.user?.name}</p>
                        <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] px-2 py-0 h-4 font-black tracking-widest uppercase mt-1">
                           {staff.position}
                        </Badge>
                      </div>
                    </div>

                    {weekDays.map((day) => {
                      const dayShifts = getShiftsForDay(day);
                      const staffShift = dayShifts.find((s) => s.staffId === staff.id);
                      
                      return (
                        <div key={day.toString()} className="border-r last:border-r-0 p-4 min-h-[140px] relative flex items-center justify-center transition-all">
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
                                "w-full h-full p-4 rounded-[1.8rem] border transition-all duration-500 cursor-pointer shadow-sm hover:shadow-2xl hover:scale-[1.05] active:scale-[0.98] group/shift flex flex-col justify-between items-start gap-1 relative overflow-hidden",
                                staffShift.type === ShiftType.MORNING ? "bg-amber-50/40 border-amber-200/30 text-amber-700" :
                                staffShift.type === ShiftType.AFTERNOON ? "bg-blue-50/40 border-blue-200/30 text-blue-700" :
                                staffShift.type === ShiftType.EVENING ? "bg-purple-50/40 border-purple-200/30 text-purple-700" :
                                staffShift.type === ShiftType.OFF ? "bg-rose-50 border-rose-200/50 text-rose-600" :
                                "bg-slate-900 border-slate-800 text-white shadow-slate-900/10"
                              )}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-[0.2em]",
                                  staffShift.type === ShiftType.FULL_DAY ? "text-[#C8A97E]" : "opacity-50"
                                )}>
                                  {staffShift.type === ShiftType.MORNING ? 'Morning' : 
                                   staffShift.type === ShiftType.AFTERNOON ? 'Afternoon' : 
                                   staffShift.type === ShiftType.EVENING ? 'Evening' : 
                                   staffShift.type === ShiftType.OFF ? 'Day Off' : 'Full Day'}
                                </span>
                                <div className="text-lg transform group-hover/shift:rotate-12 group-hover/shift:scale-125 transition-all duration-500">
                                   {staffShift.type === ShiftType.MORNING && <span>☀️</span>}
                                   {staffShift.type === ShiftType.AFTERNOON && <span>⛅</span>}
                                   {staffShift.type === ShiftType.EVENING && <span>🌙</span>}
                                   {staffShift.type === ShiftType.FULL_DAY && <span>⏳</span>}
                                   {staffShift.type === ShiftType.OFF && <span>🏠</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-auto">
                                <div className={cn(
                                   "p-1.5 rounded-lg",
                                   staffShift.type === ShiftType.FULL_DAY ? "bg-white/10" : "bg-black/5"
                                )}>
                                   <Clock className={cn("w-3 h-3", staffShift.type === ShiftType.FULL_DAY ? "text-[#C8A97E]" : "opacity-40")} />
                                </div>
                                <span className="text-[10px] font-black italic tracking-tighter tabular-nums">
                                   {format(new Date(staffShift.shiftStart), 'HH:mm')} - {format(new Date(staffShift.shiftEnd), 'HH:mm')}
                                </span>
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
                              className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-50 rounded-[1.8rem] opacity-0 group-hover/row:opacity-100 hover:border-[#C8A97E]/30 hover:bg-[#C8A97E]/5 transition-all duration-500 text-slate-200"
                            >
                               <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <Plus className="w-5 h-5" />
                               </div>
                               <span className="text-[8px] font-black uppercase tracking-[0.2em]">Assign Shift</span>
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
      )}

      {/* Shift Edit/Create Sheet */}
      <Sheet open={isShiftSheetOpen} onOpenChange={setIsShiftSheetOpen}>
        <SheetContent className="bg-white border-l-0 sm:max-w-md rounded-l-[4rem] p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-12 pb-0 flex flex-col items-start text-left">
            <div className="p-4 bg-[#C8A97E]/10 rounded-[1.5rem] mb-6">
               <Clock className="w-8 h-8 text-[#C8A97E]" />
            </div>
            <SheetTitle className="text-4xl font-black font-heading italic uppercase tracking-tighter text-slate-900 leading-none">
              {selectedShiftForEdit ? 'Update' : 'Assign'} <span className="text-[#C8A97E]">Shift</span>
            </SheetTitle>
            <SheetDescription className="font-bold text-slate-400 italic text-xs uppercase tracking-widest mt-2">
               Configure work hours for <span className="text-slate-900">{selectedSalonName}</span> branch
            </SheetDescription>
          </SheetHeader>

          <div className="px-12 py-10 space-y-10">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center shadow-inner">
                  <CalendarIcon className="w-5 h-5 text-slate-300 mb-3" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule Date</p>
                  <p className="text-sm font-black text-slate-900 italic">
                    {selectedDayForShift && format(selectedDayForShift, 'dd MMM yyyy')}
                  </p>
               </div>
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center shadow-inner">
                  <Avatar className="h-8 w-8 mb-3 border-2 border-white shadow-md">
                     <AvatarImage src={selectedStaffForShift?.user?.avatar} />
                     <AvatarFallback className="bg-slate-200 text-[10px] font-bold">
                        {selectedStaffForShift?.user?.name?.charAt(0)}
                     </AvatarFallback>
                  </Avatar>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff Member</p>
                  <p className="text-sm font-black text-slate-900 italic truncate w-full px-2">
                    {selectedStaffForShift?.user?.name || 'Loading...'}
                  </p>
               </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C8A97E] px-4">Shift Classification</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: ShiftType.MORNING, label: 'Morning Shift (08:00 - 12:00)', icon: '☀️', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                  { id: ShiftType.AFTERNOON, label: 'Afternoon Shift (13:00 - 18:00)', icon: '⛅', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                  { id: ShiftType.EVENING, label: 'Evening Shift (17:00 - 21:00)', icon: '🌙', color: 'bg-purple-50 text-purple-600 border-purple-200' },
                  { id: ShiftType.FULL_DAY, label: 'Full Day (08:00 - 18:00)', icon: '⏳', color: 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20 shadow-xl' },
                  { id: ShiftType.OFF, label: 'Day Off (Personal Time)', icon: '🏠', color: 'bg-rose-50 text-rose-600 border-rose-200' },
                ].map((type) => (
                  <div 
                    key={type.id}
                    onClick={() => setShiftData({ ...shiftData, type: type.id as any })}
                    className={cn(
                      "flex items-center gap-6 p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]",
                      shiftData.type === type.id 
                        ? cn(type.color, "ring-4 ring-[#C8A97E]/10 z-10") 
                        : "border-slate-50 bg-white text-slate-400 hover:bg-slate-50 hover:border-slate-100"
                    )}
                  >
                    <div className="text-2xl transform transition-transform duration-500 group-hover:scale-125">{type.icon}</div>
                    <span className="font-black italic uppercase text-xs tracking-tight">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-300 hover:bg-slate-50" 
                  onClick={() => setIsShiftSheetOpen(false)}
                >
                  Discard
                </Button>
                <Button 
                  className="flex-[2] h-14 rounded-2xl font-black italic uppercase text-xs tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-all"
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
                  {(createShiftMutation.isPending || updateShiftMutation.isPending) && <Loader2 className="w-5 h-5 animate-spin mr-3 text-[#C8A97E]" />}
                  {selectedShiftForEdit ? 'Update' : 'Confirm'}
                </Button>
              </div>
              
              {selectedShiftForEdit && (
                <Button 
                  variant="ghost" 
                  className="w-full h-14 rounded-2xl text-rose-500 font-black italic uppercase text-[10px] tracking-widest hover:bg-rose-50/50 mt-2"
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this shift?')) deleteShiftMutation.mutate(selectedShiftForEdit.id);
                  }}
                  disabled={deleteShiftMutation.isPending}
                >
                  {deleteShiftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-3" />}
                  Remove Shift
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
