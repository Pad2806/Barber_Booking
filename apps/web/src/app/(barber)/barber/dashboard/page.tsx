'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, usersApi } from '@/lib/api';
import { 
  Clock, 
  Calendar, 
  Calendar as CalendarIcon,
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
      toast.success('Đã gửi yêu cầu nghỉ phép. Chờ quản lý duyệt.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể đăng ký nghỉ'),
  });

  if (isLoadingStats || isLoadingSchedule) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl" />)}
        </div>
        <div className="h-96 bg-white rounded-3xl" />
      </div>
    );
  }

  const statItems = [
    { label: 'Today Bookings', value: stats?.todayAppointments || 0, icon: Calendar, color: 'text-[#C8A97E]' },
    { label: 'Completed', value: stats?.completedToday || 0, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: "Today Revenue", value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.todayRevenue || 0), icon: TrendingUp, color: 'text-[#C8A97E]' },
    { label: 'Rating', value: stats?.averageRating || '5.0', icon: Star, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Premium Noir Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white border border-slate-800 shadow-3xl shadow-slate-900/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="flex items-center gap-8">
                <div className="relative group">
                   <div className="absolute -inset-1 bg-gradient-to-tr from-[#C8A97E] to-amber-200 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                   <Avatar className="h-32 w-32 border-4 border-slate-800 shadow-2xl p-1 bg-slate-950 relative">
                       <AvatarImage src={me?.avatar} className="object-cover" />
                       <AvatarFallback className="bg-slate-900 text-[#C8A97E] text-5xl font-black italic">
                           {me?.name?.charAt(0)}
                       </AvatarFallback>
                   </Avatar>
                   <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-slate-900 rounded-full flex items-center justify-center">
                       <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                   </div>
                </div>
                <div className="space-y-2">
                    <Badge className="bg-[#C8A97E]/20 text-[#C8A97E] border-none mb-2 px-3 py-1 font-black text-[9px] uppercase tracking-[0.2em] rounded-lg">
                       Staff Performance Active
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-[0.9] flex flex-col">
                        <span className="text-slate-400 text-2xl mb-1 ml-1 font-bold not-italic">WELCOME BACK,</span>
                        <span className="uppercase text-white">{me?.name?.split(' ').pop()}!</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-slate-400 font-black pt-2">
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                            <MapPin className="w-4 h-4 text-[#C8A97E]" />
                            <span className="text-xs italic">{me?.staff?.salon?.name || 'Reetro Salon'}</span>
                        </div>
                        <div className="flex items-center gap-2 px-5 py-2 bg-white/5 text-slate-300 rounded-2xl border border-white/5 uppercase tracking-widest text-[10px] font-black">
                            {me?.staff?.position || 'Barber'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 lg:min-w-[400px]">
                <Card className="flex-1 bg-white/5 border-white/10 backdrop-blur-md p-6 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Weekly Target</p>
                   <p className="text-2xl font-black text-[#C8A97E] italic">85%</p>
                   <div className="w-24 h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <div className="w-[85%] h-full bg-[#C8A97E]"></div>
                   </div>
                </Card>
                <div className="flex flex-col gap-3">
                   <Button 
                      variant="outline"
                      onClick={() => setIsDayOffDialogOpen(true)}
                      className="bg-transparent hover:bg-white/10 text-white border-white/20 rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest transition-all"
                   >
                      <CalendarDays className="w-4 h-4 mr-3" />
                      Yêu cầu nghỉ
                   </Button>
                   <Link href="/barber/schedule" className="contents">
                      <Button className="bg-[#C8A97E] hover:bg-amber-600 text-slate-950 border-none rounded-2xl h-14 px-8 font-black italic uppercase text-xs tracking-widest shadow-xl shadow-amber-900/20">
                         Xem lịch tuần <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                   </Link>
                </div>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C8A97E] opacity-[0.05] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500 opacity-[0.03] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {stats?.nextCustomerAlert && (
          <div className="px-4 animate-in slide-in-from-top-4 duration-1000">
             <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-amber-500 bg-[length:200%_auto] animate-gradient-x p-0.5 rounded-[2rem] shadow-2xl shadow-orange-500/20">
                <div className="bg-slate-900 rounded-[1.9rem] px-8 py-5 flex flex-col sm:flex-row items-center justify-between text-white gap-4">
                   <div className="flex items-center gap-6">
                       <div className="relative">
                          <div className="absolute inset-0 bg-white rounded-2xl blur-md opacity-20 animate-pulse"></div>
                          <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-center relative border border-white/10">
                              <AlertCircle className="w-8 h-8 text-white" />
                          </div>
                       </div>
                       <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C8A97E] leading-none mb-2">Next Customer Incoming</p>
                           <p className="font-black italic text-2xl tracking-tight pr-4">{stats.nextCustomerAlert}</p>
                       </div>
                   </div>
                   <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-100 rounded-xl font-black italic uppercase text-xs px-10 h-14 shadow-lg active:scale-95 transition-all">
                      SẴN SÀNG PHỤC VỤ <ChevronRight className="w-4 h-4 ml-2" />
                   </Button>
                </div>
             </div>
          </div>
      )}

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {statItems.map((stat, i) => (
            <Card key={i} className="border-none shadow-premium rounded-[2.5rem] hover:shadow-2xl transition-all duration-500 group overflow-hidden bg-white/70 backdrop-blur-xl border border-white/50">
                <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                       <div className={`p-4 ${stat.color} bg-slate-50 rounded-2xl group-hover:bg-slate-900 group-hover:text-[#C8A97E] transition-all duration-500`}>
                           <stat.icon className="w-7 h-7" />
                       </div>
                       {i === 0 && <span className="bg-emerald-50 text-emerald-500 text-[9px] font-black italic px-3 py-1 rounded-full">+12% vs last week</span>}
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">{stat.label}</p>
                       <p className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none">{stat.value}</p>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Appointments Section */}
        <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between px-6 py-2 bg-slate-50/50 rounded-3xl border border-slate-100">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-4 text-slate-900">
                    <ClipboardList className="w-7 h-7 text-[#C8A97E]" />
                    Today&apos;s Lineup
                </h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Live Update</span>
                </div>
            </div>

            <div className="space-y-6 relative before:absolute before:left-[45px] before:top-10 before:bottom-10 before:w-0.5 before:bg-slate-100 before:hidden md:before:block">
                {schedule && schedule.length > 0 ? (
                    schedule.map((booking: any, idx: number) => (
                        <div key={booking.id} className="relative pl-0 md:pl-20 group">
                            {/* Timeline Point */}
                            <div className="hidden md:flex absolute left-[30px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-2 border-slate-100 z-10 items-center justify-center group-hover:border-[#C8A97E] group-hover:scale-110 transition-all duration-500 shadow-sm">
                               <div className={cn(
                                  "w-3 h-3 rounded-full transition-colors duration-500",
                                  booking.status === 'IN_PROGRESS' ? "bg-orange-500 scale-125 shadow-lg shadow-orange-500/50" : 
                                  booking.status === 'COMPLETED' ? "bg-emerald-500" : "bg-slate-200 group-hover:bg-[#C8A97E]"
                               )}></div>
                            </div>

                            <Card className={cn(
                                "border-none shadow-premium hover:shadow-2xl transition-all duration-700 rounded-[2.5rem] overflow-hidden bg-white group/card",
                                booking.status === 'IN_PROGRESS' && "ring-4 ring-orange-500/10"
                            )}>
                                <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex flex-col items-center justify-center min-w-[120px] p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-900/10 group-hover/card:-translate-y-1 transition-transform">
                                        <Clock className="w-5 h-5 text-[#C8A97E] mb-2 opacity-50" />
                                        <span className="text-3xl font-black italic text-white leading-none tracking-tighter">{booking.timeSlot}</span>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-3">Until {booking.endTime}</span>
                                    </div>

                                    <div className="flex-1 flex items-center gap-6 min-w-0">
                                        <div className="relative">
                                           <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                                               <AvatarImage src={booking.customer.avatar} />
                                               <AvatarFallback className="bg-slate-100 text-slate-300 font-bold text-xl uppercase italic">
                                                   {booking.customer.name.charAt(0)}
                                               </AvatarFallback>
                                           </Avatar>
                                           <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-lg shadow-md">
                                               <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                           </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-black italic text-2xl text-slate-900 truncate tracking-tight uppercase">
                                                    {booking.customer.name}
                                                </h4>
                                                <Button 
                                                   variant="ghost" 
                                                   size="icon" 
                                                   className="h-8 w-8 rounded-xl text-blue-500 hover:bg-blue-50 border border-transparent hover:border-blue-100"
                                                   onClick={() => {
                                                       setSelectedCustomerId(booking.customer.id);
                                                       setIsHistoryDialogOpen(true);
                                                   }}
                                                >
                                                    <Info className="w-5 h-5" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {booking.services.map((s: any) => (
                                                    <Badge key={s.id} variant="secondary" className="bg-slate-50 text-slate-900 border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest italic rounded-lg">
                                                        {s.service.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-4 mt-4">
                                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                                   <Users className="w-3.5 h-3.5" />
                                                   #BM-BK-{booking.bookingCode || 'REF-ID'}
                                               </p>
                                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                                   <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                   Loyal Member
                                               </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto">
                                        {booking.status === 'CONFIRMED' && (
                                            <Button 
                                                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'IN_PROGRESS' })}
                                                className="bg-slate-900 hover:bg-slate-800 text-white font-black italic rounded-2xl h-14 px-10 flex-1 md:flex-none tracking-tight uppercase text-xs"
                                            >
                                                <Play className="w-4 h-4 mr-3 text-[#C8A97E]" /> BẮT ĐẦU
                                            </Button>
                                        )}
                                        {booking.status === 'IN_PROGRESS' && (
                                            <Button 
                                                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'COMPLETED' })}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black italic rounded-2xl h-14 px-10 flex-1 md:flex-none tracking-tight uppercase text-xs shadow-lg shadow-emerald-500/20"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-3" /> HOÀN TẤT
                                            </Button>
                                        )}
                                        <div className="flex gap-2 w-full">
                                            <Button 
                                                variant="outline" 
                                                className="rounded-2xl border-slate-100 bg-white text-slate-500 font-black italic uppercase text-[10px] tracking-widest flex-1 h-14 hover:border-[#C8A97E] hover:text-[#C8A97E]"
                                                onClick={() => {
                                                    setSelectedCustomerId(booking.customer.id);
                                                    setIsNoteDialogOpen(true);
                                                }}
                                            >
                                                <ClipboardList className="w-4 h-4 mr-3" /> GHI CHÚ
                                            </Button>
                                            {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                                                <Button 
                                                    variant="ghost" 
                                                    className="rounded-2xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 w-14 flex-none h-14 border border-transparent hover:border-rose-100"
                                                    onClick={() => {
                                                        if(confirm('Bạn có chắc muốn hủy lịch này?')) {
                                                            updateStatusMutation.mutate({ id: booking.id, status: 'CANCELLED' });
                                                        }
                                                    }}
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-100 shadow-xl mt-10">
                        <div className="bg-slate-100 p-8 rounded-full mb-8 transform scale-125 opacity-30">
                            <CalendarIcon className="w-16 h-16 text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-black italic text-slate-300 uppercase tracking-widest text-center px-10">You have a clear schedule today!</h3>
                        <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.3em]">RELAX OR UPSKILL</p>
                    </div>
                )}
            </div>
        </div>

        {/* Sidebar Utilities */}
        <div className="lg:col-span-4 space-y-8">
             <div className="px-6 py-2 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
                 <h3 className="text-xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
                    <History className="w-5 h-5 text-[#C8A97E]" />
                    Essentials
                 </h3>
             </div>
             
             <Card className="border-none shadow-premium rounded-[3rem] bg-white p-8 group">
                <div className="space-y-4">
                    <Link href="/barber/schedule" className="flex items-center gap-6 p-6 bg-slate-50/50 hover:bg-slate-900 rounded-[2rem] transition-all duration-500 border border-slate-100 group/item">
                        <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover/item:scale-110 group-hover/item:bg-blue-500/10 transition-all duration-500">
                            <Calendar className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black italic uppercase group-hover/item:text-white transition-colors">Weekly Schedule</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70 group-hover/item:text-slate-500">Global Overview</p>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover/item:border-[#C8A97E] group-hover/item:text-[#C8A97E] transition-all">
                           <ChevronRight className="w-5 h-5" />
                        </div>
                    </Link>
                    
                    <div className="flex items-center gap-6 p-6 opacity-30 cursor-not-allowed grayscale rounded-[2rem] border border-dashed border-slate-200">
                        <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl">
                            <History className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black italic uppercase">Earning Reports</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 p-8 bg-slate-900 rounded-[2.5rem] relative overflow-hidden text-center">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">Monthly Goal</p>
                    <p className="text-4xl font-black italic text-[#C8A97E] tracking-tighter mb-4 whitespace-nowrap">GOLD MEMBER</p>
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                       <div className="h-full bg-emerald-500 w-[65%]"></div>
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4">12 appointments left to rank up</p>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C8A97E] opacity-5 rounded-full blur-2xl"></div>
                </div>
             </Card>

             <Card className="border-none shadow-premium rounded-[3rem] bg-[#C8A97E] p-10 text-slate-950 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                 <div className="relative z-10">
                    <h4 className="text-2xl font-black italic uppercase italic leading-none mb-1">PRO TIP</h4>
                    <p className="font-bold text-sm text-slate-900 opacity-80 mt-4 leading-relaxed tracking-tight italic">
                        &quot;Duy trì thái độ chuyên nghiệp và lắng nghe yêu cầu của khách là chìa khóa để đạt 5 sao tuyệt đối.&quot;
                    </p>
                 </div>
                 <Star className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-900/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
             </Card>
        </div>
      </div>

      {/* MODALS */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white max-w-md">
            <div className="p-10 pb-0">
               <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                  <ClipboardList className="w-8 h-8 text-blue-500" />
               </div>
               <DialogHeader className="text-left">
                  <DialogTitle className="text-3xl font-black italic text-slate-900 uppercase tracking-tighter leading-none">Customer <span className="text-blue-500">Insight</span></DialogTitle>
                  <DialogDescription className="font-black text-slate-400 uppercase text-[10px] tracking-widest mt-2 px-1">Ghi chú lại sở thích để phục vụ tốt hơn</DialogDescription>
               </DialogHeader>
            </div>
            <div className="p-10 space-y-6">
                <Textarea 
                    placeholder="Ví dụ: Khách thích kiểu Side Part, thích dùng sáp vuốt tóc cứng..."
                    className="rounded-[2rem] border-none bg-slate-50 focus-visible:ring-blue-100 h-32 font-bold p-6 text-slate-700 placeholder:text-slate-200 shadow-inner"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                />
            </div>
            <div className="p-10 pt-0">
                <Button 
                   className="bg-slate-900 hover:bg-slate-800 text-white font-black italic rounded-2xl w-full h-16 uppercase text-sm tracking-widest shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95" 
                   onClick={() => selectedCustomerId && addNoteMutation.mutate({ customerId: selectedCustomerId, content: noteContent })}
                >
                    LƯU GHI CHÚ QUAN TRỌNG
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="rounded-[3.5rem] border-none shadow-3xl p-0 max-w-2xl max-h-[85vh] overflow-hidden bg-white">
            <div className="bg-slate-950 p-12 text-white relative">
               <div className="flex items-center gap-6 relative z-10 text-left">
                  <div className="p-5 bg-white/10 rounded-[2rem] backdrop-blur-md">
                     <History className="w-10 h-10 text-[#C8A97E]" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C8A97E] mb-2 leading-none">Patient History Dossier</p>
                     <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter leading-tight">Client <span className="text-[#C8A97E]">Archive</span></DialogTitle>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8A97E] opacity-[0.05] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            </div>
            
            <div className="p-12 space-y-10 overflow-y-auto max-h-[50vh] no-scrollbar">
                {isLoadingHistory ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-6">
                       <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
                       <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Retrieving Encrypted Data...</p>
                    </div>
                ) : customerHistory ? (
                    <div className="space-y-10">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Preferred Stylist</p>
                                <p className="font-black italic text-2xl text-slate-900 uppercase tracking-tight">{customerHistory.preferredBarber}</p>
                            </div>
                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Last Visit Registry</p>
                                <p className="font-black italic text-2xl text-slate-900 uppercase tracking-tight">
                                    {customerHistory.lastVisit ? format(new Date(customerHistory.lastVisit), 'dd MMM yyyy') : 'No History'}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                               <h4 className="font-black uppercase text-[10px] tracking-[0.3em] text-[#C8A97E]">Observations & Insights</h4>
                               <Badge className="bg-slate-100 text-slate-400 border-none px-3 font-bold">{customerHistory.notes?.length || 0} Records</Badge>
                            </div>
                            <div className="space-y-4">
                                {customerHistory.notes?.map((note: any, nIdx: number) => (
                                    <div key={note.id} className="p-6 bg-white border border-slate-50 rounded-[1.8rem] shadow-premium relative group hover:border-[#C8A97E]/30 transition-all duration-500">
                                        <div className="absolute left-0 top-6 w-1 h-12 bg-[#C8A97E] rounded-r-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                        <p className="text-sm font-bold text-slate-700 italic leading-relaxed">&ldquo;{note.content}&rdquo;</p>
                                        <div className="flex items-center justify-between mt-4">
                                           <div className="flex items-center gap-2">
                                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                                 <Users className="w-3 h-3 text-slate-400" />
                                              </div>
                                              <p className="text-[9px] font-black text-[#C8A97E] uppercase tracking-widest">{note.staff?.user?.name}</p>
                                           </div>
                                           <p className="text-[8px] font-black text-slate-300 uppercase italic">REC #00{nIdx+1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
            <div className="p-12 pt-0">
               <Button 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black italic rounded-2xl h-16 uppercase tracking-widest text-xs" 
                  onClick={() => setIsHistoryDialogOpen(false)}
               >
                  DISMISS DOSSIER
               </Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDayOffDialogOpen} onOpenChange={setIsDayOffDialogOpen}>
        <DialogContent className="rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white max-w-md">
            <div className="p-10 pb-0">
               <div className="w-16 h-16 bg-rose-50 rounded-[1.5rem] flex items-center justify-center mb-6">
                  <CalendarDays className="w-8 h-8 text-rose-500" />
               </div>
               <DialogHeader className="text-left">
                  <DialogTitle className="text-3xl font-black italic text-slate-900 uppercase tracking-tighter leading-none">Absence <span className="text-rose-500">Request</span></DialogTitle>
                  <DialogDescription className="font-black text-slate-400 uppercase text-[10px] tracking-widest mt-2 px-1">Đăng ký ngày nghỉ và chờ phê duyệt</DialogDescription>
               </DialogHeader>
            </div>
            <div className="p-10 space-y-6">
                <div className="space-y-4">
                   <div className="group">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4 italic">Select Date</p>
                      <Input type="date" value={dayOffDate} onChange={(e) => setDayOffDate(e.target.value)} className="rounded-2xl h-14 bg-slate-50 border-none font-black text-slate-700 focus-visible:ring-rose-100 px-6 shadow-inner" />
                   </div>
                   <div className="group">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4 italic">Elaboration (Reason)</p>
                      <Textarea placeholder="Vui lòng cung cấp lý do..." value={dayOffReason} onChange={(e) => setDayOffReason(e.target.value)} className="rounded-[2rem] h-28 bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-rose-100 p-6 shadow-inner placeholder:text-slate-200" />
                   </div>
                </div>
            </div>
            <div className="p-10 pt-0">
                <Button 
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black italic rounded-2xl w-full h-16 uppercase text-sm tracking-widest shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95" 
                  onClick={() => registerDayOffMutation.mutate({ date: dayOffDate, reason: dayOffReason })}
                >
                    GỬI YÊU CẦU XÁC NHẬN
                </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
