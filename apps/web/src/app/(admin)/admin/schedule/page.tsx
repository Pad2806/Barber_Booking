'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  MapPin,
  Coffee,
  X,
  Loader2
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminApi, staffApi, StaffShift } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export default function AdminSchedulePage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSalonId, setSelectedSalonId] = useState<string>('');
  const [isLeaveSheetOpen, setIsLeaveSheetOpen] = useState(false);
  const [selectedStaffForLeave, setSelectedStaffForLeave] = useState<any>(null);

  // Leave Form State
  const [leaveData, setLeaveData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  // Calculate week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch Salons
  const { data: salonsData } = useQuery({
    queryKey: ['admin', 'salons'],
    queryFn: () => adminApi.getAllSalons({ limit: 100 }),
  });

  // Fetch Schedules (Shifts)
  const { data: schedules, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['admin', 'schedules', selectedSalonId, format(currentDate, 'yyyy-MM')],
    queryFn: () => staffApi.getSalonSchedules(selectedSalonId, format(currentDate, 'yyyy-MM-dd')),
    enabled: !!selectedSalonId,
  });

  // Fetch Staff for selected salon
  const { data: staffList } = useQuery({
    queryKey: ['admin', 'staff', selectedSalonId],
    queryFn: () => adminApi.getAllStaff({ salonId: selectedSalonId || undefined, limit: 100 }),
    enabled: !!selectedSalonId,
  });

  const registerLeaveMutation = useMutation({
    mutationFn: (data: any) => adminApi.registerStaffLeave(selectedStaffForLeave.id, {
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason
    }),
    onSuccess: () => {
      toast.success('Đã đăng ký nghỉ phép');
      setIsLeaveSheetOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể đăng ký nghỉ');
    }
  });

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleToday = () => setCurrentDate(new Date());

  const getShiftsForDay = (day: Date) => {
    if (!schedules) return [];
    return schedules.filter((shift: StaffShift) => isSameDay(parseISO(shift.date as any), day));
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
            {salonsData?.data?.map(salon => (
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
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar: Staff List */}
          <div className="xl:col-span-1 space-y-4">
            <Card className="border-none shadow-premium bg-white">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Nhân sự
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {staffList?.data?.map((staff: any) => (
                    <div key={staff.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 text-left">
                        <Avatar className="h-9 w-9 border border-slate-100">
                          <AvatarImage src={staff.user.avatar} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{staff.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{staff.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{staff.position}</p>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg"
                        onClick={() => {
                          setSelectedStaffForLeave(staff);
                          setIsLeaveSheetOpen(true);
                        }}
                      >
                        <Coffee className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content: Weekly Calendar */}
          <div className="xl:col-span-3">
            <Card className="border-none shadow-premium bg-white overflow-hidden">
              <div className="grid grid-cols-7 border-b bg-slate-50/50">
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

              <div className="grid grid-cols-7 min-h-[600px] bg-slate-50/20">
                {weekDays.map((day) => {
                  const dayShifts = getShiftsForDay(day);
                  return (
                    <div key={day.toString()} className="border-r last:border-r-0 p-2 space-y-2 relative group min-h-[150px]">
                      {isSchedulesLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center opacity-50">
                          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                        </div>
                      ) : (
                        dayShifts.map((shift: StaffShift) => (
                          <div 
                            key={shift.id} 
                            className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group/shift text-left"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-6 w-6 border-none ring-1 ring-slate-100">
                                <AvatarImage src={shift.staff?.user?.avatar} />
                                <AvatarFallback className="text-[8px] font-bold">{shift.staff?.user?.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-[11px] font-bold text-slate-900 truncate">
                                {shift.staff?.user?.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{format(new Date(shift.shiftStart), 'HH:mm')} - {format(new Date(shift.shiftEnd), 'HH:mm')}</span>
                            </div>
                          </div>
                        ))
                      )}
                      
                      <button className="w-full py-3 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl opacity-0 group-hover:opacity-100 hover:border-primary/50 hover:bg-primary/5 transition-all text-slate-400 hover:text-primary">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Leave Registration Sheet */}
      <Sheet open={isLeaveSheetOpen} onOpenChange={setIsLeaveSheetOpen}>
        <SheetContent className="bg-white">
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading italic italic text-2xl flex items-center gap-2">
              <Coffee className="w-6 h-6 text-amber-500" /> Đăng ký nghỉ phép
            </SheetTitle>
            <SheetDescription>
              Tạo lịch nghỉ cho nhân viên <strong>{selectedStaffForLeave?.user?.name}</strong>. Hệ thống sẽ tự động gỡ các ca trực trong thời gian này.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-left">
                <label className="text-sm font-bold text-slate-700">Từ ngày</label>
                <input
                  type="date"
                  title="Start Date"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={leaveData.startDate}
                  onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-bold text-slate-700">Đến ngày</label>
                <input
                  type="date"
                  title="End Date"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={leaveData.endDate}
                  onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-sm font-bold text-slate-700">Lý do nghỉ</label>
              <textarea
                title="Reason"
                className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                placeholder="Nhập lý do nghỉ phép..."
                value={leaveData.reason}
                onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
              />
            </div>

            <div className="pt-6 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl"
                onClick={() => setIsLeaveSheetOpen(false)}
              >
                Hủy
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                onClick={() => registerLeaveMutation.mutate(leaveData)}
                disabled={registerLeaveMutation.isPending}
              >
                {registerLeaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Lưu đăng ký
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
