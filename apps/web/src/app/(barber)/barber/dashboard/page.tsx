'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, usersApi } from '@/lib/api';
import { 
  Clock, 
  Calendar, 
  Star, 
  TrendingUp, 
  ChevronRight,
  MapPin,
  Play,
  CheckCircle2,
  XCircle,
  ClipboardList,
  AlertCircle,
  Users,
  Info,
  CalendarDays,
  History
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function BarberDashboard(): JSX.Element {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isDayOffDialogOpen, setIsDayOffDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [dayOffDate, setDayOffDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayOffReason, setDayOffReason] = useState('');

  // 1. Fetch Data
  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['staff', 'dashboard-stats'],
    queryFn: () => staffApi.getDashboardStats(),
    refetchInterval: 30000, 
  });

  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['staff', 'today-schedule', format(new Date(), 'yyyy-MM-dd')],
    queryFn: () => staffApi.getTodaySchedule(format(new Date(), 'yyyy-MM-dd')),
  });

  const { data: customerHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['staff', 'customer-history', selectedCustomerId],
    queryFn: () => selectedCustomerId ? staffApi.getCustomerHistory(selectedCustomerId) : null,
    enabled: !!selectedCustomerId && isHistoryDialogOpen,
  });

  // 2. Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => staffApi.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: () => toast.error('Có lỗi xảy ra khi cập nhật'),
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ customerId, content }: { customerId: string, content: string }) => staffApi.addCustomerNote(customerId, content),
    onSuccess: () => {
      setSelectedCustomerId(null);
      setIsNoteDialogOpen(false);
      setNoteContent('');
      toast.success('Đã lưu ghi chú khách hàng');
    },
  });

  const registerDayOffMutation = useMutation({
    mutationFn: (data: { date: string, reason?: string }) => staffApi.registerDayOff(data.date, data.reason),
    onSuccess: () => {
      setIsDayOffDialogOpen(false);
      toast.success('Đã đăng ký ngày nghỉ');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể đăng ký nghỉ'),
  });

  if (isLoadingStats || isLoadingSchedule) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-[2rem]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl" />)}
        </div>
        <div className="h-96 bg-white rounded-3xl" />
      </div>
    );
  }

  const statItems = [
    { label: 'Booking hôm nay', value: stats?.todayAppointments || 0, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Đã hoàn thành', value: stats?.completedToday || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Doanh thu hôm nay', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.todayRevenue || 0), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Đánh giá', value: stats?.averageRating || '5.0', icon: Star, color: 'text-amber-400', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div className="relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-8 md:p-12 text-white border border-white/5 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <Avatar className="h-28 w-28 border-4 border-[#C8A97E]/40 shadow-xl p-1 bg-slate-900">
                    <AvatarImage src={me?.avatar} />
                    <AvatarFallback className="bg-slate-800 text-[#C8A97E] text-4xl font-black italic">
                        {me?.name?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-3 leading-none">
                        HELLO, <span className="text-[#C8A97E] uppercase">{me?.name?.split(' ').pop()}!</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-slate-400 font-bold text-sm">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                            <MapPin className="w-4 h-4 text-[#C8A97E]" />
                            {me?.staff?.salon?.name || 'Reetro Salon'}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#C8A97E]/20 text-[#C8A97E] rounded-full border border-[#C8A97E]/30 uppercase tracking-[0.2em] text-[10px] font-black">
                            {me?.staff?.position || 'Barber'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-4 min-w-[200px]">
                <Button 
                   onClick={() => setIsDayOffDialogOpen(true)}
                   className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl h-12 font-bold transition-all hover:scale-105 active:scale-95"
                >
                   <CalendarDays className="w-4 h-4 mr-2" />
                   Đăng ký nghỉ
                </Button>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#C8A97E] opacity-[0.07] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      </div>

      {stats?.nextCustomerAlert && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-1 rounded-3xl animate-in slide-in-from-top-4 duration-1000 shadow-xl shadow-orange-500/20">
             <div className="bg-slate-950/20 backdrop-blur-sm rounded-[1.4rem] px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-xl animate-pulse">
                        <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-white/70 leading-none mb-1">Cảnh báo khách tiếp theo</p>
                        <p className="font-bold text-lg">{stats.nextCustomerAlert}</p>
                    </div>
                </div>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 font-black italic p-0 px-2 h-8">
                   SẴN SÀNG <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
             </div>
          </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {statItems.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl hover:shadow-md transition-all group overflow-hidden bg-white">
                <CardContent className="p-6">
                    <div className={`p-3 w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-6 h-6" />
                    </div>
                    <p className="text-2xl font-black italic tracking-tight mb-1 text-slate-900">{stat.value}</p>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-sans">{stat.label}</p>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-slate-800">
                    <ClipboardList className="w-6 h-6 text-[#C8A97E]" />
                    Lịch hẹn hôm nay
                </h2>
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold px-4 py-1.5 rounded-full shadow-sm">
                    {format(new Date(), "dd 'Tháng' LL, yyyy", { locale: vi })}
                </Badge>
            </div>

            <div className="space-y-4">
                {schedule && schedule.length > 0 ? (
                    schedule.map((booking: any) => (
                        <Card key={booking.id} className={cn(
                            "border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] overflow-hidden bg-white group",
                            booking.status === 'IN_PROGRESS' && "ring-2 ring-orange-400 ring-offset-2"
                        )}>
                            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                                <div className="flex flex-col items-center justify-center min-w-[100px] p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <Clock className="w-5 h-5 text-[#C8A97E] mb-2" />
                                    <span className="text-2xl font-black italic text-slate-900 leading-none">{booking.timeSlot}</span>
                                    <span className="text-[10px] uppercase font-black text-slate-400 mt-2">Đến {booking.endTime}</span>
                                </div>

                                <div className="flex-1 flex items-center gap-4 min-w-0">
                                    <Avatar className="h-16 w-16 border-2 border-slate-100 shadow-sm">
                                        <AvatarImage src={booking.customer.avatar} />
                                        <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                                            {booking.customer.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black italic text-xl text-slate-900 truncate">
                                                {booking.customer.name}
                                            </h4>
                                            <Button 
                                               variant="ghost" 
                                               size="icon" 
                                               className="h-6 w-6 rounded-full text-blue-500 hover:bg-blue-50"
                                               onClick={() => {
                                                   setSelectedCustomerId(booking.customer.id);
                                                   setIsHistoryDialogOpen(true);
                                               }}
                                            >
                                                <Info className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {booking.services.map((s: any) => (
                                                <Badge key={s.id} variant="secondary" className="bg-[#FAF8F5] text-[#8B7355] border-[#F0EBE3] font-bold text-[10px] uppercase">
                                                    {s.service.name}
                                                </Badge>
                                            ))}
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                                            <Users className="w-3 h-3" />
                                            {booking.customer.phone}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                                    {booking.status === 'CONFIRMED' && (
                                        <Button 
                                            onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'IN_PROGRESS' })}
                                            className="bg-orange-500 hover:bg-orange-600 text-white font-black italic rounded-xl flex-1 md:flex-none tracking-tight"
                                        >
                                            <Play className="w-4 h-4 mr-2" /> BẮT ĐẦU
                                        </Button>
                                    )}
                                    {booking.status === 'IN_PROGRESS' && (
                                        <Button 
                                            onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'COMPLETED' })}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black italic rounded-xl flex-1 md:flex-none tracking-tight"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> XONG
                                        </Button>
                                    )}
                                    <div className="flex gap-2 w-full">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-xl border-slate-200 text-slate-500 font-bold text-xs flex-1"
                                            onClick={() => {
                                                setSelectedCustomerId(booking.customer.id);
                                                setIsNoteDialogOpen(true);
                                            }}
                                        >
                                            <ClipboardList className="w-4 h-4 mr-2" /> NOTE
                                        </Button>
                                        {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                                            <Button 
                                                variant="ghost" 
                                                className="rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 w-10 flex-none"
                                                onClick={() => {
                                                    if(confirm('Bạn có chắc muốn hủy lịch này?')) {
                                                        updateStatusMutation.mutate({ id: booking.id, status: 'CANCELLED' });
                                                    }
                                                }}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <div className="bg-slate-50 p-6 rounded-full mb-6">
                            <Calendar className="w-12 h-12 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black italic text-slate-400 uppercase tracking-widest">Hôm nay chưa có lịch</h3>
                    </div>
                )}
            </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black italic tracking-tighter uppercase text-slate-800">Tiện ích</h3>
             </div>
             
             <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
                <div className="space-y-4">
                    <Link href="/barber/schedule" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100 group">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black italic uppercase">Lịch tuần này</p>
                            <p className="text-[10px] font-bold text-slate-400">Xem khách hàng cả tuần</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </Link>
                    <div className="flex items-center gap-4 p-4 opacity-50 cursor-not-allowed grayscale rounded-2xl border border-transparent">
                        <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
                            <History className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black italic uppercase">Lịch sử thu thập</p>
                        </div>
                    </div>
                </div>
             </Card>
        </div>
      </div>

      {/* MODALS */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black italic text-[#2C1E12] uppercase tracking-tight">Thêm ghi chú khách hàng</DialogTitle>
            </DialogHeader>
            <div className="py-6">
                <Textarea 
                    placeholder="Ví dụ: Khách thích low fade..."
                    className="rounded-2xl border-slate-100 bg-slate-50 focus:bg-white h-32 font-medium"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button className="bg-[#C8A97E] hover:bg-[#8B7355] text-white font-black italic rounded-xl w-full h-12" onClick={() => selectedCustomerId && addNoteMutation.mutate({ customerId: selectedCustomerId, content: noteContent })}>
                    LƯU GHI CHÚ
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="mb-6">
                <DialogTitle className="text-3xl font-black italic text-[#2C1E12] uppercase tracking-tighter flex items-center gap-3 font-sans">
                    <History className="w-8 h-8 text-[#C8A97E]" />
                    Hồ sơ khách hàng
                </DialogTitle>
            </DialogHeader>
            
            {isLoadingHistory ? (
                <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" /></div>
            ) : customerHistory ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#FAF8F5] rounded-3xl border border-[#F0EBE3]">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Barber yêu thích</p>
                            <p className="font-black italic text-lg text-[#8B7355]">{customerHistory.preferredBarber}</p>
                        </div>
                        <div className="p-4 bg-[#FAF8F5] rounded-3xl border border-[#F0EBE3]">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Lần cuối ghé thăm</p>
                            <p className="font-black italic text-lg text-[#8B7355]">
                                {customerHistory.lastVisit ? format(new Date(customerHistory.lastVisit), 'dd/MM/yyyy') : 'Chưa có'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-black uppercase text-xs tracking-widest text-[#C8A97E]">Ghi chú & Sở thích</h4>
                        <div className="space-y-2">
                            {customerHistory.notes?.map((note: any) => (
                                <div key={note.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <p className="text-sm font-medium text-slate-700">&ldquo;{note.content}&rdquo;</p>
                                    <p className="text-[9px] font-black text-[#C8A97E] mt-2 uppercase">Bởi: {note.staff?.user?.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
            <Button className="w-full bg-[#0f172a] text-white font-black italic rounded-xl h-12 mt-6" onClick={() => setIsHistoryDialogOpen(false)}>ĐÓNG</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isDayOffDialogOpen} onOpenChange={setIsDayOffDialogOpen}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black italic text-[#2C1E12] uppercase tracking-tight">Đăng ký ngày nghỉ</DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-4">
                <Input type="date" value={dayOffDate} onChange={(e) => setDayOffDate(e.target.value)} className="rounded-xl h-12 font-bold" />
                <Textarea placeholder="Lý do..." value={dayOffReason} onChange={(e) => setDayOffReason(e.target.value)} className="rounded-xl h-24 font-bold" />
            </div>
            <DialogFooter>
                <Button className="bg-[#C8A97E] hover:bg-[#8B7355] text-white font-black italic rounded-xl w-full h-12" onClick={() => registerDayOffMutation.mutate({ date: dayOffDate, reason: dayOffReason })}>
                    ĐĂNG KÝ
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
