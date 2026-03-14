'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin,
  Coffee,
  X,
  Loader2
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminApi, StaffShift } from '@/lib/api';
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
import { ShiftType } from '@/lib/types';

export default function AdminSchedulePage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSalonId, setSelectedSalonId] = useState<string>('');
  
  // Sheet states
  const [isLeaveSheetOpen, setIsLeaveSheetOpen] = useState(false);
  const [selectedStaffForLeave, setSelectedStaffForLeave] = useState<any>(null);
  const [isShiftSheetOpen, setIsShiftSheetOpen] = useState(false);
  const [selectedStaffForShift, setSelectedStaffForShift] = useState<any>(null);
  const [selectedDayForShift, setSelectedDayForShift] = useState<Date | null>(null);
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState<StaffShift | null>(null);

  // Form states
  const [shiftData, setShiftData] = useState({
    type: ShiftType.FULL_DAY,
    note: '',
  });
  const [leaveData, setLeaveData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  // Dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6];

  // Queries
  const { data: salonsData } = useQuery({
    queryKey: ['admin', 'salons'],
    queryFn: () => adminApi.getAllSalons({ limit: 100 }),
  });

  const { data: schedules, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['admin', 'schedules', selectedSalonId, format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => adminApi.getSchedules(
      selectedSalonId, 
      undefined, 
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    ),
    enabled: !!selectedSalonId,
  });

  const { data: staffList } = useQuery({
    queryKey: ['admin', 'staff', selectedSalonId],
    queryFn: () => adminApi.getAllStaff({ salonId: selectedSalonId || undefined, limit: 100 }),
    enabled: !!selectedSalonId,
  });

  // Mutations
  const registerLeaveMutation = useMutation({
    mutationFn: (data: any) => adminApi.registerStaffLeave(selectedStaffForLeave.id, data),
    onSuccess: () => {
      toast.success('Đã đăng ký nghỉ phép');
      setIsLeaveSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể đăng ký nghỉ');
    }
  });

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Lịch Làm Việc</h1>
          <p className="text-slate-500 mt-1">Sắp xếp ca trực và quản lý quân số tại các chi nhánh.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            title="Select Salon"
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            value={selectedSalonId}
            onChange={(e) => setSelectedSalonId(e.target.value)}
          >
            <option value="">Chọn chi nhánh...</option>
            {salonsData?.data?.map((salon: any) => (
              <option key={salon.id} value={salon.id}>{salon.name}</option>
            ))}
          </select>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8 rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="px-3 h-8 font-bold text-xs uppercase tracking-wider">
              Hôm nay
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {!selectedSalonId ? (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
          <CardContent className="py-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Chưa chọn chi nhánh</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">Vui lòng chọn một chi nhánh từ dropdown phía trên để xem và quản lý lịch làm việc của nhân viên.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="xl:col-span-4 overflow-x-auto">
          <Card className="border-none shadow-premium bg-white min-w-[800px]">
            <div className="grid grid-cols-8 border-b bg-slate-50/50 sticky top-0 z-10">
              <div className="p-4 border-r flex items-center justify-center font-bold text-slate-400 text-xs uppercase bg-white">
                Nhân sự
              </div>
              {weekDays.map((day) => (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "py-4 flex flex-col items-center gap-1 border-r last:border-r-0",
                    isSameDay(day, new Date()) ? "bg-primary/5 relative" : ""
                  )}
                >
                  {isSameDay(day, new Date()) && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  )}
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {format(day, 'eee', { locale: vi })}
                  </span>
                  <span className={cn(
                    "text-xl font-black tabular-nums",
                    isSameDay(day, new Date()) ? "text-primary" : "text-slate-700"
                  )}>
                    {format(day, 'dd')}
                  </span>
                </div>
              ))}
            </div>

            <div className="divide-y">
              {staffList?.data?.map((staff: any) => (
                <div key={staff.id} className="grid grid-cols-8 group">
                  <div className="p-4 border-r bg-slate-50/20 flex items-center gap-3 min-w-[150px]">
                    <Avatar className="h-8 w-8 border border-slate-100 shrink-0">
                      <AvatarImage src={staff.user.avatar} />
                      <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                        {staff.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{staff.user.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase truncate">{staff.position}</p>
                    </div>
                  </div>

                  {weekDays.map((day) => {
                    const dayShifts = getShiftsForDay(day);
                    const staffShift = dayShifts.find((s) => s.staffId === staff.id);
                    
                    return (
                      <div key={day.toString()} className="border-r last:border-r-0 p-2 min-h-[100px] bg-white group-hover:bg-slate-50/30 transition-colors relative">
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
                              "p-2 rounded-xl border shadow-sm cursor-pointer transition-all hover:scale-[1.05] hover:shadow-md active:scale-95 group/shift relative h-full flex flex-col justify-center gap-1",
                              staffShift.type === ShiftType.MORNING ? "bg-blue-50 border-blue-100 text-blue-700" :
                              staffShift.type === ShiftType.AFTERNOON ? "bg-orange-50 border-orange-100 text-orange-700" :
                              "bg-emerald-50 border-emerald-100 text-emerald-700"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-tighter opacity-80">
                                {staffShift.type === ShiftType.MORNING ? 'Sáng' : 
                                 staffShift.type === ShiftType.AFTERNOON ? 'Chiều' : 'Cả ngày'}
                              </span>
                              {staffShift.type === ShiftType.MORNING && <span className="text-xs">☀️</span>}
                              {staffShift.type === ShiftType.AFTERNOON && <span className="text-xs">⛅</span>}
                              {staffShift.type === ShiftType.FULL_DAY && <span className="text-xs">⏳</span>}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold">
                              <Clock className="w-3 h-3" />
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
                            className="w-full h-full flex items-center justify-center border border-dashed border-slate-100 rounded-xl opacity-0 hover:opacity-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-slate-300 hover:text-primary"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Leave Sheet */}
      <Sheet open={isLeaveSheetOpen} onOpenChange={setIsLeaveSheetOpen}>
        <SheetContent className="bg-white">
          <SheetHeader>
            <SheetTitle className="font-heading italic italic text-2xl flex items-center gap-2">
              <Coffee className="w-6 h-6 text-amber-500" /> Đăng ký nghỉ
            </SheetTitle>
            <SheetDescription>
              Tạo lịch nghỉ cho nhân viên <strong>{selectedStaffForLeave?.user?.name}</strong>.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Từ ngày</label>
                <input
                  type="date"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none"
                  value={leaveData.startDate}
                  onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Đến ngày</label>
                <input
                  type="date"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 outline-none"
                  value={leaveData.endDate}
                  onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Lý do</label>
              <textarea
                className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 outline-none resize-none"
                placeholder="Nhập lý do nghỉ..."
                value={leaveData.reason}
                onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
              />
            </div>

            <div className="pt-6 flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setIsLeaveSheetOpen(false)}>Hủy</Button>
              <Button 
                className="flex-1 h-12" 
                onClick={() => registerLeaveMutation.mutate(leaveData)}
                disabled={registerLeaveMutation.isPending}
              >
                {registerLeaveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Lưu
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Shift Sheet */}
      <Sheet open={isShiftSheetOpen} onOpenChange={setIsShiftSheetOpen}>
        <SheetContent className="bg-white">
          <SheetHeader>
            <SheetTitle className="font-heading italic italic text-2xl flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" /> 
              {selectedShiftForEdit ? 'Cập nhật ca' : 'Thêm ca làm'}
            </SheetTitle>
            <SheetDescription>
              Thiết lập lịch trực cho <strong>{selectedStaffForShift?.user?.name}</strong>.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase">Thời gian</p>
              <p className="font-bold text-slate-700">
                {selectedDayForShift && format(selectedDayForShift, 'eeee, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Loại ca</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: ShiftType.MORNING, label: 'Ca Sáng (08:00 - 12:00)', icon: '☀️', color: 'bg-blue-50 text-blue-700' },
                  { id: ShiftType.AFTERNOON, label: 'Ca Chiều (13:00 - 18:00)', icon: '⛅', color: 'bg-orange-50 text-orange-700' },
                  { id: ShiftType.FULL_DAY, label: 'Cả Ngày (08:00 - 18:00)', icon: '⏳', color: 'bg-emerald-50 text-emerald-700' },
                ].map((type) => (
                  <div 
                    key={type.id}
                    onClick={() => setShiftData({ ...shiftData, type: type.id })}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                      shiftData.type === type.id ? "border-primary " + type.color : "border-slate-100 bg-white"
                    )}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-bold">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex flex-col gap-3">
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12" onClick={() => setIsShiftSheetOpen(false)}>Hủy</Button>
                <Button 
                  className="flex-[2] h-12 font-bold"
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
                  {selectedShiftForEdit ? 'Cập nhật' : 'Thêm ca'}
                </Button>
              </div>
              
              {selectedShiftForEdit && (
                <Button 
                  variant="ghost" 
                  className="w-full h-12 text-destructive font-bold"
                  onClick={() => {
                    if (confirm('Xóa ca làm này?')) deleteShiftMutation.mutate(selectedShiftForEdit.id);
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

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
