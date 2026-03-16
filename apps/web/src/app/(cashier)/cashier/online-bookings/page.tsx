'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi, usersApi } from '@/lib/api';
import { 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Scissors, 
  Calendar,
  AlertCircle,
  Check,
  UserCheck,
  ArrowRight,
  Info,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export default function OnlineBookingsPage() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Approval data
  const [approvalData, setApprovalData] = useState({
    staffId: '',
    timeSlot: '',
    date: ''
  });

  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['cashier', 'bookings', 'pending', me?.staff?.salonId],
    queryFn: () => cashierApi.getPendingBookings(me?.staff?.salonId),
    enabled: !!me?.staff?.salonId,
  });

  const { data: availableBarbers } = useQuery({
    queryKey: ['cashier', 'available-barbers', approvalData.date, approvalData.timeSlot, me?.staff?.salonId],
    queryFn: () => cashierApi.getAvailableBarbers(approvalData.date, approvalData.timeSlot, me?.staff?.salonId),
    enabled: !!approvalData.date && !!approvalData.timeSlot && isApproveOpen && !!me?.staff?.salonId,
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) => cashierApi.approveBooking(selectedBooking.id, data),
    onSuccess: () => {
      toast.success('Đã xác nhận lịch hẹn thành công!');
      setIsApproveOpen(false);
      queryClient.invalidateQueries({ queryKey: ['cashier', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'stats'] });
    },
    onError: () => toast.error('Lỗi khi xác nhận lịch.')
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => cashierApi.rejectBooking(selectedBooking.id, reason),
    onSuccess: () => {
      toast.success('Đã từ chối lịch hẹn.');
      setIsRejectOpen(false);
      queryClient.invalidateQueries({ queryKey: ['cashier', 'bookings'] });
    },
    onError: () => toast.error('Lỗi khi từ chối.')
  });

  if (isLoading) {
    return (
      <div className="flex bg-white rounded-[2rem] border border-slate-100 items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Đang tải danh sách yều cầu...</p>
        </div>
      </div>
    );
  }

  const handleOpenApprove = (booking: any) => {
    setSelectedBooking(booking);
    setApprovalData({
        staffId: booking.staffId || '',
        timeSlot: booking.timeSlot,
        date: dayjs(booking.date).format('YYYY-MM-DD')
    });
    
    setIsApproveOpen(true);
  };

  const handleConfirmDirectly = (booking: any) => {
     approveMutation.mutate({
        staffId: booking.staffId,
        timeSlot: booking.timeSlot,
        date: dayjs(booking.date).format('YYYY-MM-DD')
     });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
              Duyệt lịch <span className="text-[#C8A97E]">Trực tuyến</span>
           </h1>
           <p className="text-slate-500 font-medium italic text-sm">Xem và xác nhận các lịch đặt từ Website & Chatbot.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {bookings?.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-100">
             <div className="p-8 rounded-full bg-slate-50 text-slate-200 mb-6 group hover:text-[#C8A97E] transition-colors">
                <Smartphone className="w-16 h-16 transition-transform group-hover:scale-110" />
             </div>
             <p className="text-slate-400 font-black italic uppercase text-xs tracking-widest">Không có lịch hẹn đang chờ duyệt</p>
          </div>
        ) : (
          bookings?.map((booking: any) => (
            <Card key={booking.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden">
               <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row items-stretch">
                     {/* Time Side */}
                     <div className="lg:w-56 bg-gradient-to-br from-slate-900 to-slate-800 p-8 flex flex-col items-center justify-center text-center gap-3 relative">
                        <div className="absolute top-4 left-4">
                           <Badge className="bg-amber-500 text-white border-none font-black italic text-[8px] uppercase tracking-tighter shadow-lg shadow-amber-500/20">CHỜ DUYỆT</Badge>
                        </div>
                        <div className="space-y-1">
                           <p className="text-3xl font-black text-white tracking-tighter italic leading-none">{booking.timeSlot}</p>
                           <p className="text-[10px] font-black text-[#C8A97E] uppercase tracking-[0.1em]">{dayjs(booking.date).format('dddd, DD/MM')}</p>
                        </div>
                        <div className="w-8 h-1 bg-[#C8A97E] rounded-full mt-2"></div>
                     </div>

                     {/* Content Side */}
                     <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
                        <div className="flex items-center gap-5">
                           <Avatar className="h-16 w-16 border-4 border-slate-50 shadow-xl ring-2 ring-slate-100">
                              <AvatarFallback className="bg-slate-900 text-white font-black italic text-xl">
                                 {booking.customer?.name?.charAt(0) || 'C'}
                              </AvatarFallback>
                           </Avatar>
                           <div>
                              <h3 className="text-xl font-black text-slate-900 italic tracking-tight">{booking.customer?.name}</h3>
                              <p className="text-sm font-bold text-slate-500">{booking.customer?.phone}</p>
                              {booking.staff && (
                                <Badge variant="outline" className="mt-2 border-[#C8A97E]/30 text-[#C8A97E] bg-amber-50 font-bold text-[9px] uppercase tracking-wider">
                                    Yêu cầu: {booking.staff.name}
                                </Badge>
                              )}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex flex-wrap gap-2">
                              {booking.services?.map((s: any) => (
                                 <Badge key={s.id} className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 font-bold text-[10px] uppercase tracking-wide border-none rounded-lg">
                                    <Scissors className="w-3 h-3 mr-1.5 text-[#C8A97E]" /> {s.service?.name}
                                 </Badge>
                              ))}
                           </div>
                           {booking.note && (
                              <div className="flex items-start gap-2 bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50">
                                 <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                                 <p className="text-[10px] font-medium text-amber-700 italic">{booking.note}</p>
                              </div>
                           )}
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-end gap-3">
                           <Button 
                             variant="outline"
                             onClick={() => { setSelectedBooking(booking); setIsRejectOpen(true); }}
                             className="w-full sm:w-auto xl:w-32 border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl font-black italic uppercase text-[10px] tracking-widest h-12 transition-all"
                           >
                              Từ chối
                           </Button>
                           
                           {booking.staffId ? (
                             <Button 
                                onClick={() => handleConfirmDirectly(booking)}
                                className="w-full sm:w-auto xl:w-40 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black italic uppercase text-[10px] tracking-widest h-12 px-6 shadow-xl shadow-emerald-200 group"
                             >
                                Xác nhận ngay
                                <CheckCircle2 className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                             </Button>
                           ) : (
                             <Button 
                                onClick={() => handleOpenApprove(booking)}
                                className="w-full sm:w-auto xl:w-40 bg-[#C8A97E] hover:bg-amber-600 text-white rounded-2xl font-black italic uppercase text-[10px] tracking-widest h-12 px-6 shadow-xl shadow-[#C8A97E]/20 group"
                             >
                                Phân công Barber
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                             </Button>
                           )}
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approval Details Modal */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
         <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] bg-white">
            <div className="bg-slate-900 p-10 text-white">
               <h2 className="text-3xl font-black italic uppercase tracking-tighter">Hoàn tất <span className="text-[#C8A97E]">Duyệt lịch</span></h2>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">Duyệt & Gán kỹ thuật viên phục vụ</p>
            </div>

            <div className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Ngày phục vụ</label>
                     <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                           type="date"
                           value={approvalData.date}
                           onChange={(e) => setApprovalData({ ...approvalData, date: e.target.value })}
                           className="pl-12 border-slate-100 bg-slate-50 h-14 rounded-2xl font-bold focus:ring-[#C8A97E]/20"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Khung giờ</label>
                     <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                        <Select value={approvalData.timeSlot} onValueChange={(v) => setApprovalData({ ...approvalData, timeSlot: v })}>
                           <SelectTrigger className="pl-12 h-14 border-slate-100 bg-slate-50 rounded-2xl font-bold">
                              <SelectValue placeholder="Chọn giờ" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl shadow-2xl border-slate-50">
                              {['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'].map(t => (
                                 <SelectItem key={t} value={t} className="font-bold py-3 rounded-xl">{t}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Chọn Barber khả dụng</label>
                     {availableBarbers && (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[8px] uppercase tracking-widest px-2">
                           {availableBarbers.filter((b: any) => b.isAvailable).length} Sẵn sàng
                        </Badge>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     {availableBarbers?.map((barber: any) => (
                        <div 
                           key={barber.id}
                           onClick={() => barber.isAvailable && setApprovalData({ ...approvalData, staffId: barber.id })}
                           className={cn(
                             "flex items-center gap-3 p-4 rounded-3xl border-2 transition-all cursor-pointer relative group",
                             approvalData.staffId === barber.id 
                               ? "border-[#C8A97E] bg-amber-50/50 shadow-lg scale-[1.02]" 
                               : "border-slate-50 bg-slate-50/50 hover:border-slate-200",
                             !barber.isAvailable && "opacity-40 cursor-not-allowed grayscale"
                           )}
                        >
                           <Avatar className="h-10 w-10 border-2 border-white">
                              <AvatarImage src={barber.avatar} />
                              <AvatarFallback className="bg-slate-200 text-slate-500 font-bold text-xs">{barber.name.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div className="min-w-0">
                              <p className="font-black text-[11px] text-slate-900 uppercase tracking-tighter truncate">{barber.name}</p>
                              <p className={cn("text-[8px] font-bold uppercase tracking-widest", barber.isAvailable ? "text-emerald-500" : "text-rose-400")}>
                                 {barber.isAvailable ? 'Có thể phục vụ' : (barber.reason || 'Bận')}
                              </p>
                           </div>
                           {approvalData.staffId === barber.id && (
                              <div className="absolute -top-2 -right-2 bg-[#C8A97E] text-white p-1 rounded-full shadow-lg">
                                 <Check className="w-3 h-3" />
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
                  {!availableBarbers && approvalData.date && (
                     <div className="flex flex-col items-center py-6 gap-2">
                        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Đang kiểm tra Barber trống...</p>
                     </div>
                  )}
               </div>
            </div>

            <DialogFooter className="p-10 pt-0 flex gap-4">
               <Button variant="ghost" onClick={() => setIsApproveOpen(false)} className="flex-1 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest text-slate-400">Hủy bỏ</Button>
               <Button 
                onClick={() => approveMutation.mutate(approvalData)}
                disabled={approveMutation.isPending || !approvalData.staffId}
                className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-black italic uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-slate-900/20"
               >
                  {approveMutation.isPending ? 'Đang thực hiện...' : 'Xác nhận Đặt lịch'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
         <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl bg-white">
            <div className="flex flex-col items-center text-center gap-4 mb-8">
               <div className="p-4 rounded-3xl bg-rose-50 text-rose-500">
                  <AlertCircle className="w-8 h-8" />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Từ chối lịch hẹn</DialogTitle>
                  <DialogDescription className="font-medium text-slate-500 mt-1">Cung cấp lý do để khách hàng nhận được thông báo rõ ràng.</DialogDescription>
               </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lý do từ chối (Gửi đến khách)</label>
               <Select onValueChange={setRejectReason}>
                  <SelectTrigger className="h-14 border-slate-100 bg-slate-50 rounded-2xl font-bold focus:ring-rose-500/20">
                     <SelectValue placeholder="Chọn lý do phổ biến" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100">
                     <SelectItem value="Kỹ thuật viên bận việc đột xuất" className="font-bold py-3">Barber bận việc đột xuất</SelectItem>
                     <SelectItem value="Chi nhánh tạm đóng cửa sửa chữa" className="font-bold py-3">Chi nhánh tạm đóng cửa</SelectItem>
                     <SelectItem value="Giờ này đã kín chỗ, vui lòng chọn giờ khác" className="font-bold py-3">Lịch đã kín chỗ</SelectItem>
                     <SelectItem value="other" className="font-bold py-3 italic">Lý do khác...</SelectItem>
                  </SelectContent>
               </Select>
               
               {rejectReason === 'other' && (
                  <Input 
                    placeholder="Nhập lý do chi tiết..." 
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="border-slate-100 bg-slate-50 h-14 rounded-2xl font-bold focus:ring-rose-500/20"
                  />
               )}
            </div>

            <div className="mt-8 flex gap-3">
               <Button variant="ghost" onClick={() => setIsRejectOpen(false)} className="flex-1 h-12 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-400">Quay lại</Button>
               <Button 
                variant="destructive"
                onClick={() => rejectMutation.mutate(rejectReason)}
                disabled={rejectMutation.isPending || !rejectReason}
                className="flex-[2] bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-12 font-black italic uppercase text-xs tracking-[0.2em]"
               >
                  Xác nhận Từ chối
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
