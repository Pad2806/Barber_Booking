'use client';

import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  CalendarX, 
  Star, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Clock,
  Briefcase
} from 'lucide-react';
import dynamicImport from 'next/dynamic';
const AreaChart = dynamicImport(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamicImport(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamicImport(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamicImport(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamicImport(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamicImport(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamicImport(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamicImport(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamicImport(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const Cell = dynamicImport(() => import('recharts').then(mod => mod.Cell), { ssr: false });
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ManagerDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['manager', 'stats'],
    queryFn: managerApi.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: staff } = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: managerApi.getStaff,
  });

  if (isLoading) {
    return (
      <div className="flex bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 items-center justify-center min-h-[600px] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
           <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin absolute top-0"></div>
           </div>
           <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Syncing Branch Data...</p>
        </div>
      </div>
    );
  }

  const overview = stats?.today || { total: 0, completed: 0, cancelled: 0, revenue: 0 };
  const monthly = stats?.monthly || { revenue: 0 };
  const performance = stats?.performance || { averageRating: 5.0, activeStaff: 0, totalCustomers: 0 };

  const statCards = [
    { label: 'Doanh thu hôm nay', value: overview.revenue.toLocaleString() + 'đ', icon: DollarSign, trend: '+12%', color: 'from-emerald-500 to-teal-600' },
    { label: 'Booking hoàn tất', value: overview.completed, icon: CalendarCheck, trend: '+5%', color: 'from-[#C8A97E] to-amber-600' },
    { label: 'Đánh giá trung bình', value: performance.averageRating.toFixed(1), icon: Star, trend: 'Premium', color: 'from-amber-400 to-orange-500' },
    { label: 'Tổng khách hàng', value: performance.totalCustomers, icon: Users, trend: '+18%', color: 'from-blue-500 to-indigo-600' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Management <span className="text-[#C8A97E]">Pulse</span>
           </h1>
           <p className="text-slate-500 font-medium mt-1">Hệ thống giám sát hiệu năng chi nhánh thời gian thực.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Status: Stable</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <Card key={i} className="group relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 rounded-3xl bg-white">
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br transition-opacity duration-500", card.color)}></div>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={cn("p-3 rounded-2xl bg-gradient-to-br text-white shadow-lg", card.color)}>
                  <card.icon className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black text-[9px] border-none">
                  {card.trend}
                </Badge>
              </div>
              <div className="mt-6">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{card.label}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tighter italic">{card.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2 border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-8 pb-0">
             <div className="flex items-center justify-between">
                <div>
                   <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Xu hướng doanh thu</CardTitle>
                   <CardDescription className="font-medium">Thống kê 7 ngày gần nhất</CardDescription>
                </div>
                <div className="flex gap-2">
                   <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1">Online</Badge>
                   <Badge className="bg-amber-50 text-[#C8A97E] border-amber-100 font-bold px-3 py-1">In-Shop</Badge>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.reports?.revenueTrend || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#C8A97E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN', { weekday: 'short' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}}
                    tickFormatter={(val) => `${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#C8A97E" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Staff Performance Preview */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-[#0f172a] text-white">
          <CardHeader className="p-8">
             <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Top Performers</CardTitle>
             <CardDescription className="text-slate-400 font-medium italic">Nhân viên xuất sắc trong tháng</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            {staff?.slice(0, 4).map((member: any, idx: number) => (
              <div key={member.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-slate-800 group-hover:border-[#C8A97E] transition-colors">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-slate-800 text-slate-400">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0f172a]">
                        #{idx + 1}
                      </div>
                   </div>
                   <div>
                      <h4 className="font-bold text-sm group-hover:text-[#C8A97E] transition-colors">{member.name}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{member.role}</p>
                   </div>
                </div>
                <div className="text-right">
                   <div className="flex items-center gap-1 text-[#C8A97E]">
                      <Star className="w-3 h-3 fill-[#C8A97E]" />
                      <span className="text-xs font-black">{member.rating.toFixed(1)}</span>
                   </div>
                   <p className="text-[9px] text-slate-500 font-bold">{member.todayAppointments} bookings today</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full bg-transparent border-slate-800 text-slate-400 hover:bg-[#C8A97E] hover:text-white rounded-xl font-bold uppercase text-[10px] tracking-widest h-11 border-dashed mt-4" asChild>
               <Link href="/manager/staff">Chi tiết đội ngũ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Peak Hours - Bonus Smart Feature */}
         <Card className="border-none shadow-xl rounded-[2rem] bg-white">
            <CardHeader className="p-8">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                     <Clock className="w-5 h-5" />
                  </div>
                  <div>
                     <CardTitle className="text-lg font-black italic uppercase tracking-tighter">Giờ cao điểm</CardTitle>
                     <CardDescription className="text-slate-500 font-medium">Bản đồ mật độ khách hàng</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
               <div className="flex items-end justify-between h-40 gap-2">
                  {[40, 60, 45, 90, 85, 30, 20, 50, 70, 60, 40, 30].map((h, i) => (
                    <div key={i} className="flex-1 group relative">
                       <div 
                         style={{ height: `${h}%` }} 
                         className={cn(
                           "w-full rounded-t-lg transition-all duration-500",
                           h > 70 ? "bg-rose-500" : "bg-slate-200 group-hover:bg-[#C8A97E]"
                         )}
                       ></div>
                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-md">{8+i}h</span>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4">
                  <span className="text-[9px] font-black text-slate-400">08:00</span>
                  <span className="text-[9px] font-black text-slate-400">20:00</span>
               </div>
            </CardContent>
         </Card>

         {/* Utilization Rate - Bonus Smart Feature */}
         <Card className="border-none shadow-xl rounded-[2rem] bg-white">
            <CardHeader className="p-8">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                     <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                     <CardTitle className="text-lg font-black italic uppercase tracking-tighter">Công suất nhân sự</CardTitle>
                     <CardDescription className="text-slate-500 font-medium">Utilization Rate per Shift</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex items-center justify-center h-48">
               <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                     <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                     <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * 78) / 100} className="text-[#C8A97E]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-3xl font-black italic tracking-tighter">78%</span>
                     <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Efficient</span>
                  </div>
               </div>
               <div className="ml-8 space-y-3">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#C8A97E]"></div>
                     <span className="text-[10px] font-bold text-slate-600 tracking-tight italic">Working: 128h</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-slate-100"></div>
                     <span className="text-[10px] font-bold text-slate-600 tracking-tight italic">Idle: 32h</span>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
