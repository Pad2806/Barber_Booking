'use client';

import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  Star, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Briefcase,
  Activity,
  UserCheck
} from 'lucide-react';
import dynamicImport from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const AreaChart = dynamicImport(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamicImport(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamicImport(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamicImport(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamicImport(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamicImport(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamicImport(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

export default function ManagerDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['manager', 'stats'],
    queryFn: managerApi.getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: staff } = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: managerApi.getStaff,
  });

  if (isLoading) return <DashboardSkeleton />;

  const overview = stats?.today || { total: 0, completed: 0, cancelled: 0, revenue: 0 };
  const performance = stats?.performance || { averageRating: 5.0, activeStaff: 0, totalCustomers: 0 };

  const statCards = [
    { label: 'Doanh thu hôm nay', value: overview.revenue, isCurrency: true, icon: DollarSign, trend: '+12%', color: 'emerald' },
    { label: 'Booking hoàn tất', value: overview.completed, icon: CalendarCheck, trend: '+5%', color: 'blue' },
    { label: 'Đánh giá trung bình', value: performance.averageRating.toFixed(1), icon: Star, trend: 'Premium', color: 'amber' },
    { label: 'Tổng khách hàng', value: performance.totalCustomers, icon: Users, trend: '+18%', color: 'indigo' },
    { label: 'Nhân viên trực', value: staff?.filter((s:any) => s.isActive).length || 0, icon: UserCheck, color: 'orange' },
    { label: 'Công suất', value: '78%', icon: Activity, color: 'purple' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight text-left">Trung tâm quản lý</h1>
        <p className="text-gray-500 mt-1 text-left">Theo dõi hiệu suất và hoạt động tại chi nhánh của bạn</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                  stat.color === 'blue' && "bg-blue-50 text-blue-600",
                  stat.color === 'amber' && "bg-amber-50 text-amber-600",
                  stat.color === 'indigo' && "bg-indigo-50 text-indigo-600",
                  stat.color === 'orange' && "bg-orange-50 text-orange-600",
                  stat.color === 'purple' && "bg-purple-50 text-purple-600",
                )}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.trend && (
                  <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-bold text-[10px] border-none px-2 py-0.5">
                    {stat.trend}
                  </Badge>
                )}
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 leading-tight">
                  {stat.isCurrency ? formatPrice(stat.value as number) : stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Line Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b bg-gray-50/50 text-left">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Xu hướng doanh thu</CardTitle>
                <CardDescription>Biểu đồ biến động 7 ngày gần nhất</CardDescription>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <TrendingUp className="w-5 h-5 text-[#C8A97E]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.reports?.revenueTrend || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#C8A97E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6b7280', fontSize: 12}}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN', { weekday: 'short' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6b7280', fontSize: 12}}
                    tickFormatter={(val) => `${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#C8A97E" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Staff Sidebar */}
        <Card className="border-none shadow-sm h-full flex flex-col bg-white">
          <CardHeader className="border-b bg-gray-50/50 text-left shrink-0">
            <CardTitle className="text-lg font-bold">Nhân viên xuất sắc</CardTitle>
            <CardDescription>Hiệu suất phục vụ trong ngày</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1 max-h-[500px]">
            <div className="divide-y divide-gray-100">
              {staff?.slice(0, 5).map((member: any, idx: number) => (
                <div key={member.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between text-left group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm group-hover:border-[#C8A97E] transition-colors">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-slate-100 text-slate-400 font-bold">
                          {member.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-amber-400 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow">
                        #{idx + 1}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#C8A97E] transition-colors uppercase">{member.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span className="text-xs font-black">{member.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{member.todayAppointments} bookings</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50/30">
              <Button variant="outline" className="w-full rounded-xl font-bold h-10 text-xs uppercase" asChild>
                <Link href="/manager/staff">Xem tất cả đội ngũ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bonus Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="border-none shadow-sm bg-white">
            <CardHeader className="text-left border-b bg-gray-50/50">
               <CardTitle className="text-lg font-bold">Giờ cao điểm</CardTitle>
               <CardDescription>Phân bổ mật độ khách hàng theo khung giờ</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
               <div className="flex items-end justify-between h-32 gap-2">
                  {[40, 60, 45, 90, 85, 30, 20, 50, 70, 60, 40, 30].map((h, i) => (
                    <div key={i} className="flex-1 group relative">
                       <div 
                         style={{ height: `${h}%` }} 
                         className={cn(
                           "w-full rounded-t-md transition-all duration-300",
                           h > 70 ? "bg-rose-500" : "bg-slate-100 group-hover:bg-[#C8A97E]"
                         )}
                       ></div>
                       <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-md">{8+i}h</span>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4">
                  <span className="text-[10px] font-bold text-slate-300">08:00</span>
                  <span className="text-[10px] font-bold text-slate-300">20:00</span>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm bg-white">
            <CardHeader className="text-left border-b bg-gray-50/50">
               <CardTitle className="text-lg font-bold">Hiệu suất chi nhánh</CardTitle>
               <CardDescription>Tỉ lệ khai thác công suất nhân sự</CardDescription>
            </CardHeader>
            <CardContent className="p-8 flex items-center justify-center">
               <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                     <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-50" />
                     <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * 78) / 100} className="text-[#C8A97E]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-2xl font-black text-gray-900">78%</span>
                     <span className="text-[9px] font-black uppercase text-slate-400">Efficient</span>
                  </div>
               </div>
               <div className="ml-8 space-y-4">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#C8A97E]"></div>
                     <span className="text-xs font-bold text-slate-600">Làm việc: 128h</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-slate-100"></div>
                     <span className="text-xs font-bold text-slate-600">Trống lịch: 32h</span>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse text-left">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 bg-gray-200" />
        <Skeleton className="h-5 w-96 bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[450px] rounded-xl bg-gray-100" />
        <Skeleton className="h-[450px] rounded-xl bg-gray-100" />
        <Skeleton className="lg:col-span-2 h-[400px] rounded-xl bg-gray-100" />
        <Skeleton className="h-[400px] rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
