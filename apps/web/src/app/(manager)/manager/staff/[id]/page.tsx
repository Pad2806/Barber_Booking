'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  Clock, 
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Activity,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { STAFF_POSITIONS, cn, formatCurrency } from '@/lib/utils';
import dynamicImport from 'next/dynamic';

const AreaChart = dynamicImport(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamicImport(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamicImport(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamicImport(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamicImport(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamicImport(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamicImport(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function StaffDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rateModalOpen, setRateModalOpen] = useState(false);
  
  const { data: staff, isLoading: isLoadingStaff, error } = useQuery({
    queryKey: ['manager', 'staff', id],
    queryFn: () => managerApi.getStaffById(id),
  });

  const rateStaffMutation = useMutation({
    mutationFn: (data: any) => managerApi.rateStaff(id, data),
    onSuccess: () => {
      toast.success('Đã gửi đánh giá hiệu suất');
      setRateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'staff', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    }
  });

  const chartData = useMemo(() => {
    if (!staff?.analytics?.history) return [];
    return staff.analytics.history.map((item: any) => ({
      name: format(new Date(item.createdAt), 'dd/MM'),
      performance: (item.serviceQuality + item.punctuality + item.customerSatisfaction) / 3
    }));
  }, [staff]);

  if (isLoadingStaff) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C8A97E]" />
      </div>
    );
  }

  if (error) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
           <AlertCircle className="w-16 h-16 text-rose-500 mb-4 opacity-20" />
           <h3 className="text-xl font-black text-slate-900 uppercase italic">Không tìm thấy thông tin</h3>
           <p className="text-sm text-slate-500 mt-2 max-w-md">Nhân viên này không thuộc quyền quản lý của bạn hoặc dữ liệu đã bị xóa khỏi hệ thống.</p>
           <Button variant="outline" onClick={() => router.back()} className="mt-8 rounded-xl px-8 font-bold border-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2" /> QUAY LẠI
           </Button>
        </div>
     )
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
              Hồ Sơ Nhân Sự <Badge className="bg-[#C8A97E]/10 text-[#C8A97E] border-none text-[10px]">BRANCH STAFF</Badge>
            </h1>
            <p className="text-sm text-slate-500 font-medium">Theo dõi hiệu suất và lịch làm việc của {staff?.user?.name}</p>
          </div>
        </div>
        <Button onClick={() => setRateModalOpen(true)} className="gap-2 rounded-xl h-10 bg-[#C8A97E] hover:bg-[#B5966A] shadow-lg shadow-[#C8A97E]/20">
          <Star className="w-4 h-4" /> Đánh giá hiệu suất
        </Button>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-none shadow-xl bg-white overflow-hidden group rounded-3xl">
          <div className="h-24 bg-gradient-to-r from-[#C8A97E] to-amber-200 group-hover:scale-110 transition-transform duration-700"></div>
          <CardContent className="pt-0 -mt-12 flex flex-col items-center text-center px-6 pb-8">
            <Avatar className="h-24 w-24 border-4 border-white shadow-xl mb-4 ring-1 ring-slate-100">
              <AvatarImage src={staff?.user?.avatar || ''} />
              <AvatarFallback className="text-2xl font-black bg-slate-900 text-white italic">
                {staff?.user?.name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-tight">{staff?.user?.name}</h2>
            <Badge variant="secondary" className="mt-2 px-4 py-1 bg-[#C8A97E]/10 text-[#C8A97E] border-none font-black text-[10px] uppercase tracking-widest">
              {STAFF_POSITIONS[staff?.position as keyof typeof STAFF_POSITIONS] || staff?.position}
            </Badge>

            <div className="w-full mt-8 space-y-4 text-left border-t border-slate-50 pt-6">
              <div className="flex items-center gap-3 text-slate-600 transition-colors hover:text-[#C8A97E] cursor-default">
                <div className="p-2 bg-slate-50 rounded-xl"><Mail className="w-4 h-4" /></div>
                <span className="text-xs font-bold truncate">{staff?.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 transition-colors hover:text-[#C8A97E] cursor-default">
                <div className="p-2 bg-slate-50 rounded-xl"><Phone className="w-4 h-4" /></div>
                <span className="text-xs font-bold">{staff?.user?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 transition-colors hover:text-[#C8A97E] cursor-default">
                <div className="p-2 bg-slate-50 rounded-xl"><MapPin className="w-4 h-4" /></div>
                <span className="text-xs font-bold">{staff?.salon?.name || 'REETRO BARBER'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 transition-colors hover:text-[#C8A97E] cursor-default">
                <div className="p-2 bg-slate-50 rounded-xl"><Briefcase className="w-4 h-4" /></div>
                <span className="text-xs font-bold">{staff?._count?.bookings || 0} Lượt cắt tóc</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards & Charts */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden rounded-3xl relative">
              <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={80} /></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-2 bg-[#C8A97E] rounded-xl text-white shadow-lg shadow-[#C8A97E]/20"><TrendingUp className="w-5 h-5" /></div>
                  <Badge className="bg-white/10 text-white border-none text-[8px] uppercase font-black tracking-widest">Revenue</Badge>
                </div>
                <p className="text-3xl font-black tracking-tighter italic">
                  {formatCurrency(staff?.analytics?.totalRevenue || 0)}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Tổng doanh thu mang lại</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl border-l-4 border-amber-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><Star className="w-5 h-5 fill-amber-500" /></div>
                  <Badge className="bg-amber-50 text-amber-700 border-none text-[8px] uppercase font-black tracking-widest">Rating</Badge>
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tighter italic">
                  {staff?.rating || '5.0'} / 5.0
                </p>
                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Điểm hài lòng từ khách</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl border-l-4 border-emerald-400">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] uppercase font-black tracking-widest">Success</Badge>
                </div>
                <p className="text-3xl font-black text-slate-900 tracking-tighter italic">
                  {staff?.analytics?.totalCustomers || 0}
                </p>
                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Số lịch hẹn hoàn thành</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl">
            <CardHeader className="pb-0 border-b border-slate-50 flex flex-row items-center justify-between p-6">
              <div>
                <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#C8A97E]" /> Biểu đồ hiệu suất
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Analytics from local performance logs</CardDescription>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-black italic">REAL-TIME DATA</Badge>
            </CardHeader>
            <CardContent className="p-6 pt-10">
              <div className="h-[300px] min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#C8A97E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                      domain={[0, 5]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '16px' }}
                      itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                      labelStyle={{ fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="performance" 
                      stroke="#C8A97E" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorPerf)" 
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
        {/* Weekly Shifts */}
        <Card className="border-none shadow-xl bg-white rounded-3xl">
          <CardHeader className="border-b border-slate-50 p-6">
            <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C8A97E]" /> Ca làm việc tuần này
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Lịch biểu thực tế tại chi nhánh</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {staff?.shifts?.map((shift: any) => (
                <div key={shift.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#C8A97E]">
                         <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase italic">
                           {format(new Date(shift.date), 'EEEE, dd/MM', { locale: vi })}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{shift.type}</p>
                      </div>
                   </div>
                   <Badge className="bg-[#C8A97E] text-white border-none font-black text-xs px-4 py-1.5 rounded-full shadow-lg shadow-[#C8A97E]/20 ring-4 ring-white">
                      {format(new Date(shift.shiftStart), 'HH:mm')} - {format(new Date(shift.shiftEnd), 'HH:mm')}
                   </Badge>
                </div>
              ))}
              {(!staff?.shifts || staff.shifts.length === 0) && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Không có ca làm việc nào</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests */}
        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 p-6">
            <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#C8A97E]" /> Nhật ký xin nghỉ
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Các yêu cầu nghỉ phép gần đây</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
             {!staff?.leaves || staff.leaves.length === 0 ? (
               <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Dữ liệu trống</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {staff.leaves.map((leave: any) => (
                   <div key={leave.id} className="relative pl-6 border-l-2 border-slate-100 group">
                      <div className={cn(
                        "absolute left-[-5px] top-0 w-2 h-2 rounded-full ring-4 ring-white",
                        leave.status === 'APPROVED' ? "bg-emerald-500" : "bg-slate-300"
                      )}></div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-black text-slate-800 text-xs uppercase italic">
                           {format(new Date(leave.startDate), 'dd MMM', { locale: vi })} - {format(new Date(leave.endDate), 'dd MMM', { locale: vi })}
                        </p>
                        <Badge className={cn("font-black text-[8px] border-none px-2 uppercase tracking-tighter italic", 
                          leave.status === 'APPROVED' ? "bg-emerald-500 text-white" : 
                          leave.status === 'REJECTED' ? "bg-rose-500 text-white" :
                          "bg-slate-900 text-white"
                        )}>
                          {leave.status === 'APPROVED' ? 'APPROVED' : leave.status === 'REJECTED' ? 'REJECTED' : 'PENDING'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium italic">&quot;{leave.reason || 'Nghỉ gia đình'}&quot;</p>
                   </div>
                 ))}
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Rate Performance Modal */}
      {rateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg border-none shadow-2xl overflow-hidden rounded-[40px]">
            <CardHeader className="bg-[#C8A97E] text-white p-10 relative">
               <div className="absolute top-[-20%] right-[-10%] opacity-10"><Star size={200} weight="fill" /></div>
              <CardTitle className="text-3xl font-black flex items-center gap-3 font-heading italic uppercase italic">
                <Star className="w-8 h-8 fill-white" /> ĐÁNH GIÁ NHÂN SỰ
              </CardTitle>
              <CardDescription className="text-[#FDF8F3] mt-2 font-black uppercase text-[10px] tracking-[0.2em] opacity-80">Efficiency & Professionalism Audit</CardDescription>
            </CardHeader>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              rateStaffMutation.mutate({
                serviceQuality: Number(formData.get('serviceQuality')),
                punctuality: Number(formData.get('punctuality')),
                customerSatisfaction: Number(formData.get('customerSatisfaction')),
                comment: formData.get('comment'),
              });
            }} className="p-10 space-y-8 bg-white">
              <div className="grid grid-cols-1 gap-8">
                 {[
                   { name: 'serviceQuality', label: 'Chất lượng tay nghề', desc: 'Kỹ thuật cắt & xử lý' },
                   { name: 'punctuality', label: 'Tác phong & Giờ giấc', desc: 'Đúng ca, đúng lịch' },
                   { name: 'customerSatisfaction', label: 'Độ hài lòng của khách', desc: 'Giao tiếp & Phục vụ' }
                 ].map((field) => (
                   <div key={field.name} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                           <label className="text-xs font-black text-slate-900 uppercase italic tracking-tight">{field.label}</label>
                           <p className="text-[10px] text-slate-500 font-bold uppercase opacity-60 m-0">{field.desc}</p>
                        </div>
                        <span className="text-lg font-black text-[#C8A97E] italic">Rating / 5</span>
                      </div>
                      <input 
                        name={field.name} 
                        type="range" 
                        min="1" 
                        max="5" 
                        defaultValue="5" 
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#C8A97E]" 
                      />
                      <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase">
                         <span>1. Poor</span>
                         <span>5. Perfect</span>
                      </div>
                   </div>
                 ))}
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase italic tracking-tight">Ghi chú từ quản lý</label>
                <textarea 
                  name="comment" 
                  className="w-full px-5 py-5 rounded-3xl border border-slate-100 focus:border-[#C8A97E] bg-slate-50 h-32 font-bold text-xs transition-all resize-none italic shadow-inner" 
                  placeholder="Nhận xét về thái độ, kỹ năng phát sinh trong tháng..."
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => setRateModalOpen(false)} className="flex-1 rounded-2xl h-14 font-black tracking-widest text-[10px] uppercase hover:bg-slate-50 text-slate-400">HUỶ BỎ</Button>
                <Button type="submit" className="flex-[2] rounded-3xl h-14 bg-slate-900 hover:bg-[#C8A97E] font-black tracking-widest text-[10px] uppercase transition-all shadow-xl shadow-slate-200" disabled={rateStaffMutation.isPending}>
                  {rateStaffMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-3" />}
                  LƯU ĐÁNH GIÁ
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
