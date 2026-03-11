'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  Clock, 
  Plus, 
  Info,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Activity,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { STAFF_POSITIONS, cn, formatCurrency } from '@/lib/utils';
import { 
  AreaChart,
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function StaffDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  
  const { data: staff, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['admin', 'staff', id],
    queryFn: () => adminApi.getStaffById(id),
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['admin', 'staff', 'analytics', id],
    queryFn: () => adminApi.getStaffAnalytics(id),
  });

  const { data: leaves } = useQuery({
    queryKey: ['admin', 'staff', 'leaves', id],
    queryFn: () => adminApi.getStaffLeaves(id),
  });

  const registerLeaveMutation = useMutation({
    mutationFn: (data: any) => adminApi.registerStaffLeave(id, data),
    onSuccess: () => {
      toast.success('Đã đăng ký ngày nghỉ');
      setLeaveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff', 'leaves', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể đăng ký nghỉ');
    }
  });

  const chartData = useMemo(() => {
    if (!analytics?.monthlyRevenue) return [];
    return analytics.monthlyRevenue.map((item: any) => ({
      name: format(new Date(item.date), 'dd/MM'),
      revenue: item.revenue
    }));
  }, [analytics]);

  if (isLoadingStaff || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10 border-slate-200">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 italic font-heading">
              Phân Tích Hiệu Suất <Badge className="bg-primary/10 text-primary border-none text-[10px]">STAFF DASHBOARD</Badge>
            </h1>
            <p className="text-sm text-slate-500 font-medium">Chi tiết kinh doanh và lịch biểu của {staff?.user?.name}</p>
          </div>
        </div>
        <Button onClick={() => setLeaveModalOpen(true)} className="gap-2 rounded-xl h-10 shadow-lg shadow-primary/20">
          <CalendarDays className="w-4 h-4" /> Đăng ký ngày nghỉ
        </Button>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-none shadow-premium bg-white overflow-hidden group">
          <div className="h-24 bg-gradient-to-r from-primary/80 to-primary group-hover:scale-110 transition-transform duration-700"></div>
          <CardContent className="pt-0 -mt-12 flex flex-col items-center text-center px-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-xl mb-4 ring-1 ring-slate-100">
              <AvatarImage src={staff?.user?.avatar || ''} />
              <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                {staff?.user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-slate-900">{staff?.user?.name}</h2>
            <Badge variant="secondary" className="mt-2 px-4 py-1 bg-slate-100 text-slate-600 border-none font-bold">
              {STAFF_POSITIONS[staff?.position as keyof typeof STAFF_POSITIONS] || staff?.position}
            </Badge>

            <div className="w-full mt-8 space-y-4 text-left border-t border-slate-50 pt-6">
              <div className="flex items-center gap-3 text-slate-600 transition-colors hover:text-primary cursor-default">
                <div className="p-2 bg-slate-50 rounded-xl"><Mail className="w-4 h-4" /></div>
                <span className="text-xs font-semibold truncate">{staff?.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 transition-colors hover:text-primary cursor-default">
                <div className="p-2 bg-slate-50 rounded-xl"><Phone className="w-4 h-4" /></div>
                <span className="text-xs font-semibold">{staff?.user?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 transition-colors hover:text-primary cursor-default">
                <div className="p-2 bg-slate-50 rounded-xl"><MapPin className="w-4 h-4" /></div>
                <span className="text-xs font-semibold">{staff?.salon?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 transition-colors hover:text-primary cursor-default">
                <div className="p-2 bg-slate-50 rounded-xl"><Briefcase className="w-4 h-4" /></div>
                <span className="text-xs font-semibold">{staff?._count?.bookings || 0} Lượt phục vụ</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards & Charts */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-none shadow-premium bg-gradient-to-br from-primary/5 to-white ring-1 ring-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary"><TrendingUp className="w-5 h-5" /></div>
                  <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-black">Doanh thu</Badge>
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(analytics?.stats?.totalRevenue)}</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Đóng góp cho hệ thống</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-premium bg-gradient-to-br from-amber-50 to-white ring-1 ring-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><Star className="w-5 h-5 fill-amber-500" /></div>
                  <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] uppercase font-black">Đánh giá</Badge>
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{analytics?.stats?.avgRating} / 5</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">{analytics?.stats?.totalReviews} lượt nhận xét</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-premium bg-gradient-to-br from-emerald-50 to-white ring-1 ring-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] uppercase font-black">Hoàn thành</Badge>
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{analytics?.stats?.completedBookings}</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Khách hàng tin tưởng</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="border-none shadow-premium bg-white overflow-hidden">
            <CardHeader className="pb-0 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Phân Tích Doanh Thu
                </CardTitle>
                <CardDescription>Hiệu suất đóng góp 180 ngày qua theo thời gian thực.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs font-bold">180 DAYS</Badge>
                <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">LIVE UP-TO-DATE</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-10">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#AD8B73" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#AD8B73" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                      tickFormatter={(val) => `${val/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      formatter={(value: any) => [formatCurrency(value), 'Doanh thu']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#AD8B73" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Work Schedule */}
        <Card className="border-none shadow-premium bg-white">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Lịch Trình Cố Định
            </CardTitle>
            <CardDescription>Thời gian phục vụ hàng tuần tại Salon.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map((day, idx) => {
                const daySchedule = staff?.schedules?.find((s: any) => s.dayOfWeek === idx);
                return (
                  <div key={idx} className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                    daySchedule?.isOff ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                  )}>
                    <span className="font-bold text-sm text-slate-700">{day}</span>
                    <div>
                      {daySchedule?.isOff ? (
                        <Badge variant="destructive" className="font-black text-[10px] px-3 uppercase">NGHỈ</Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-xs ring-1 ring-emerald-100">
                          {daySchedule?.startTime} - {daySchedule?.endTime}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Off-days/Leaves */}
        <Card className="border-none shadow-premium bg-white h-full">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg font-bold flex items-center gap-2 font-heading italic">
              <CalendarDays className="w-5 h-5 text-primary" /> Nhật Ký Phép & Nghỉ Lễ
            </CardTitle>
            <CardDescription>Các khoảng thời gian vắng mặt đặc biệt ngoài lịch cố định.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
             {!leaves || leaves.length === 0 ? (
               <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 border-primary/20">
                 <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-4 opacity-50" />
                 <p className="text-sm text-slate-500 font-bold uppercase tracking-tight italic">Hồ sơ chuyên cần 100%</p>
                 <p className="text-[10px] text-slate-400 mt-1">Chưa có ngày nghỉ nào được đăng ký cho nhân sự này.</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {leaves.map((leave: any) => (
                   <div key={leave.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:translate-x-1">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/5 rounded-xl">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {format(new Date(leave.startDate), 'dd MMM', { locale: vi })} - {format(new Date(leave.endDate), 'dd MMM', { locale: vi })}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{leave.reason || 'Nghỉ phép thường niên'}</p>
                        </div>
                     </div>
                     <Badge className={cn("font-black text-[10px] border-none px-3 uppercase", 
                       leave.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : 
                       leave.status === 'REJECTED' ? "bg-destructive/10 text-destructive" :
                       "bg-amber-100 text-amber-700"
                     )}>
                       {leave.status === 'APPROVED' ? 'Đã duyệt' : leave.status === 'REJECTED' ? 'Từ chối' : 'Chờ phê duyệt'}
                     </Badge>
                   </div>
                 ))}
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Leave Modal Overlay */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden scale-in-center rounded-3xl">
            <CardHeader className="bg-primary text-white pb-8 pt-8 px-8">
              <CardTitle className="text-2xl font-black flex items-center gap-3 font-heading italic">
                <CalendarDays className="w-7 h-7" /> ĐĂNG KÝ NGHỈ PHÉP
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 mt-2 font-medium">Thiết lập thời gian vắng mặt cho {staff?.user?.name}</CardDescription>
            </CardHeader>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              registerLeaveMutation.mutate({
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                reason: formData.get('reason'),
              });
            }} className="p-8 space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bắt đầu từ</label>
                  <input name="startDate" type="date" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 bg-slate-50 font-bold text-sm transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đến hết ngày</label>
                  <input name="endDate" type="date" required className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 bg-slate-50 font-bold text-sm transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lý do nghỉ phép</label>
                <textarea name="reason" className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 bg-slate-50 h-28 font-medium text-sm transition-all resize-none" placeholder="vd: Việc gia đình, ốm đau, nghỉ lễ..."></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setLeaveModalOpen(false)} className="flex-1 rounded-2xl h-14 font-bold border-slate-200 hover:bg-slate-50">ĐÓNG</Button>
                <Button type="submit" className="flex-[2] rounded-2xl h-14 font-black shadow-xl shadow-primary/20" disabled={registerLeaveMutation.isPending}>
                  {registerLeaveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                  XÁC NHẬN NGHỈ
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
