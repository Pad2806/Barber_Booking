'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  UserCheck, 
  Scissors, 
  MoreHorizontal, 
  ChevronRight,
  ArrowRight,
  UserPlus,
  XCircle,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Smartphone,
  Award
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export default function ManagerBookingsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  // Reschedule state
  const [rescheduleData, setRescheduleData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    timeSlot: '',
    staffId: ''
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['manager', 'bookings', { status: statusFilter, date: dateFilter, search: searchTerm }],
    queryFn: () => managerApi.getBookings({ 
        status: statusFilter === 'ALL' ? undefined : statusFilter, 
        date: dateFilter,
        search: searchTerm
    }),
  });

  const { data: staff } = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: managerApi.getStaff,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => 
      managerApi.updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['manager', 'bookings'] });
    },
    onError: () => toast.error('Không thể cập nhật trạng thái')
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: (status: BookingStatus) => 
      managerApi.bulkUpdateBookingStatus(selectedIds, status),
    onSuccess: () => {
      toast.success(`Đã cập nhật ${selectedIds.length} lịch đặt`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['manager', 'bookings'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật hàng loạt')
  });

  const rescheduleMutation = useMutation({
    mutationFn: (data: any) => managerApi.rescheduleBooking(selectedBooking.id, data),
    onSuccess: () => {
      toast.success('Đã dời lịch hẹn thành công');
      setIsRescheduleOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'bookings'] });
    },
    onError: () => {
      toast.error('Không thể dời lịch. Vui lòng kiểm tra lại.');
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === bookings?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bookings?.map((b: any) => b.id) || []);
    }
  };

  const statusColors: any = {
    CONFIRMED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    COMPLETED: 'bg-blue-50 text-blue-600 border-blue-100',
    CANCELLED: 'bg-rose-50 text-rose-600 border-rose-100',
    PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };

  const statusLabels: any = {
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
    PENDING: 'Chờ xử lý',
    IN_PROGRESS: 'Đang phục vụ'
  };

  if (isLoading) {
    return (
      <div className="flex bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 items-center justify-center min-h-[600px] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Syncing Appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
                 Branch <span className="text-[#C8A97E]">Agenda</span>
              </h1>
              <p className="text-slate-500 font-medium">Giám sát và điều phối tất cả lịch đặt tại chi nhánh.</p>
           </div>
           <div className="flex flex-wrap items-center gap-3">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 bg-[#C8A97E]/10 px-4 py-2 rounded-2xl border border-[#C8A97E]/20 animate-in fade-in zoom-in duration-300">
                  <span className="text-[10px] font-black uppercase text-[#C8A97E] mr-2">Đã chọn {selectedIds.length}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="bg-[#C8A97E] hover:bg-[#B8975E] text-white rounded-xl font-bold text-[10px] uppercase h-8">
                        Thao tác hàng loạt <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-100 shadow-2xl w-48">
                      <DropdownMenuItem onClick={() => bulkUpdateStatusMutation.mutate('CONFIRMED')} className="rounded-xl font-bold text-[10px] uppercase cursor-pointer">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Xác nhận tất cả
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => bulkUpdateStatusMutation.mutate('IN_PROGRESS')} className="rounded-xl font-bold text-[10px] uppercase cursor-pointer">
                         <Clock className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Bắt đầu phục vụ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => bulkUpdateStatusMutation.mutate('COMPLETED')} className="rounded-xl font-bold text-[10px] uppercase cursor-pointer">
                         <Award className="w-3.5 h-3.5 mr-2 text-blue-500" /> Hoàn tất tất cả
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-50 my-1" />
                      <DropdownMenuItem onClick={() => bulkUpdateStatusMutation.mutate('CANCELLED')} className="rounded-xl font-bold text-[10px] uppercase text-rose-500 cursor-pointer">
                         <XCircle className="w-3.5 h-3.5 mr-2" /> Hủy tất cả
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 hover:bg-transparent">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="relative group flex-1 md:flex-none">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C8A97E]" />
                 <Input 
                   placeholder="Tìm khách hàng..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-12 w-full md:w-64 border-slate-100 bg-white rounded-2xl h-12 shadow-sm font-medium focus-visible:ring-[#C8A97E]/20"
                 />
              </div>
              <Input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full md:w-44 border-slate-100 bg-white rounded-2xl h-12 shadow-sm font-bold text-slate-600 focus-visible:ring-[#C8A97E]/20"
              />
           </div>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | 'ALL')} className="w-full">
           <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-14 w-full md:w-auto flex overflow-x-auto no-scrollbar">
              {['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
                <TabsTrigger key={s} value={s} className="rounded-xl px-6 font-black italic uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#C8A97E] data-[state=active]:shadow-sm">
                  {s === 'ALL' ? 'Tất cả' : statusLabels[s]}
                </TabsTrigger>
              ))}
           </TabsList>
        </Tabs>
      </div>

      {/* Bookings List */}
      <div className="grid grid-cols-1 gap-4">
        {bookings?.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100">
             <div className="p-6 rounded-full bg-slate-50 text-slate-300 mb-6">
                <Calendar className="w-12 h-12" />
             </div>
             <p className="text-slate-400 font-black italic uppercase text-sm">Không có lịch đặt nào cho ngày này</p>
          </div>
        ) : (
          bookings?.map((booking: any) => (
            <Card key={booking.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white overflow-hidden">
               <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row items-stretch">
                     {/* Time & Status Side */}
                     <div className="lg:w-48 bg-slate-50 p-6 flex lg:flex-col items-center justify-center lg:border-r border-slate-100 text-center gap-4 relative">
                        <div className="absolute top-4 left-4">
                           <input 
                             type="checkbox" 
                             checked={selectedIds.includes(booking.id)}
                             onChange={() => toggleSelect(booking.id)}
                             className="w-5 h-5 rounded-lg border-slate-300 text-[#C8A97E] focus:ring-[#C8A97E] transition-all cursor-pointer"
                           />
                        </div>
                        <div className="space-y-1">
                           <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{booking.timeSlot}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dayjs(booking.date).format('DD MMM')}</p>
                        </div>
                        <Badge className={cn("border px-3 py-1 font-black italic uppercase text-[9px] tracking-widest rounded-lg", statusColors[booking.status])}>
                           {statusLabels[booking.status]}
                        </Badge>
                     </div>

                     {/* Main Content */}
                     <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        {/* Customer & Service Info */}
                        <div className="flex items-center gap-6">
                           <div className="relative">
                              <Avatar className="h-16 w-16 border-4 border-slate-50 shadow-lg">
                                 <AvatarFallback className="bg-[#C8A97E] text-white font-black italic text-xl">
                                    {booking.customerName?.charAt(0) || 'C'}
                                 </AvatarFallback>
                              </Avatar>
                           </div>
                           <div className="space-y-2">
                              <h3 className="text-xl font-black text-slate-900 italic tracking-tight flex items-center gap-2">
                                 {booking.customerName}
                                 {booking.isFirstTime && <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[8px] uppercase tracking-tighter">New</Badge>}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                 {booking.services?.map((s: any) => (
                                    <div key={s.id} className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg">
                                       <Scissors className="w-3 h-3 text-[#C8A97E]" />
                                       <span className="text-[10px] font-bold uppercase tracking-wider">{s.name}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Barber Assigned */}
                        <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 min-w-[200px]">
                           <div className="relative">
                              <Avatar className="h-10 w-10 border-2 border-white">
                                 <AvatarImage src={booking.staff?.user?.avatar} />
                                 <AvatarFallback className="bg-slate-200 text-slate-400 font-bold text-xs">{booking.staff?.user?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Assigned Barber</p>
                              <p className="text-xs font-black text-slate-900 italic uppercase">
                                 {booking.staff?.user?.name || 'Tùy chọn'}
                              </p>
                           </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                           <Button 
                             onClick={() => {
                                setSelectedBooking(booking);
                                setRescheduleData({
                                  date: dayjs(booking.date).format('YYYY-MM-DD'),
                                  timeSlot: booking.timeSlot,
                                  staffId: booking.staffId
                                });
                                setIsRescheduleOpen(true);
                             }}
                             className="bg-[#C8A97E] hover:bg-[#B8975E] text-white rounded-xl font-black italic uppercase text-[10px] h-11 px-6 shadow-lg shadow-[#C8A97E]/20 transition-all hover:scale-105 active:scale-95"
                           >
                              Dời lịch
                           </Button>
                           
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    <MoreHorizontal className="w-5 h-5" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-2xl">
                                 <DropdownMenuItem 
                                   className="rounded-xl h-10 px-3 font-bold text-xs uppercase cursor-pointer"
                                   onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'CONFIRMED' })}
                                   disabled={booking.status === 'CONFIRMED'}
                                 >
                                    <CheckCircle2 className="w-4 h-4 mr-3 text-emerald-500" /> Xác nhận lịch
                                 </DropdownMenuItem>
                                 <DropdownMenuItem 
                                    className="rounded-xl h-10 px-3 font-bold text-xs uppercase cursor-pointer"
                                    onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'IN_PROGRESS' })}
                                    disabled={booking.status === 'IN_PROGRESS'}
                                 >
                                    <Clock className="w-4 h-4 mr-3 text-indigo-500" /> Bắt đầu phục vụ
                                 </DropdownMenuItem>
                                 <DropdownMenuItem 
                                    className="rounded-xl h-10 px-3 font-bold text-xs uppercase cursor-pointer"
                                    onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'COMPLETED' })}
                                 >
                                    <Award className="w-4 h-4 mr-3 text-blue-500" /> Hoàn tất phục vụ
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                 <DropdownMenuItem 
                                    className="rounded-xl h-10 px-3 font-bold text-xs uppercase text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                    onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'CANCELLED' })}
                                 >
                                    <XCircle className="w-4 h-4 mr-3" /> Hủy lịch hẹn
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reschedule Modal */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
         <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 pb-0">
               <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                  Reschedule <span className="text-[#C8A97E]">Appointment</span>
               </DialogTitle>
               <DialogDescription className="font-medium text-slate-500">
                  Dời ngày hoặc thay đổi kỹ thuật viên phục vụ.
               </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chọn ngày mới</label>
                  <Input 
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    className="border-slate-100 bg-slate-50 h-12 rounded-2xl font-bold focus-visible:ring-[#C8A97E]/20"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khung giờ</label>
                  <Select 
                    value={rescheduleData.timeSlot} 
                    onValueChange={(val) => setRescheduleData({ ...rescheduleData, timeSlot: val })}
                  >
                     <SelectTrigger className="h-12 border-slate-100 bg-slate-50 rounded-2xl font-bold focus:ring-[#C8A97E]/20">
                        <SelectValue placeholder="Chọn giờ phục vụ" />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border-slate-100">
                        {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((time) => (
                          <SelectItem key={time} value={time} className="font-bold rounded-xl">{time}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nhân viên phục vụ</label>
                  <Select 
                    value={rescheduleData.staffId} 
                    onValueChange={(val) => setRescheduleData({ ...rescheduleData, staffId: val })}
                  >
                     <SelectTrigger className="h-12 border-slate-100 bg-slate-50 rounded-2xl font-bold focus:ring-[#C8A97E]/20">
                        <SelectValue placeholder="Chọn nhân viên" />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border-slate-100">
                        {staff?.map((s: any) => (
                           <SelectItem key={s.id} value={s.id} className="font-bold rounded-xl flex items-center gap-2">
                              {s.name}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            </div>

            <DialogFooter className="p-8 pt-0 flex gap-3">
               <Button variant="ghost" onClick={() => setIsRescheduleOpen(false)} className="flex-1 h-12 rounded-2xl font-bold uppercase text-xs">Quay lại</Button>
               <Button 
                onClick={() => rescheduleMutation.mutate(rescheduleData)}
                disabled={rescheduleMutation.isPending}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 font-black italic uppercase text-xs shadow-xl"
               >
                  {rescheduleMutation.isPending ? 'Syncing...' : 'Cập nhật lịch'}
                  <ArrowRight className="w-4 h-4 ml-2 text-[#C8A97E]" />
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
