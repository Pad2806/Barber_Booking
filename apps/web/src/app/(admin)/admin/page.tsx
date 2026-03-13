'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Scissors,
  Star,
  UserPlus,
  Trophy,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { adminApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AdminDashboardPage(): JSX.Element {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const { data: bookingStats, isLoading: bookingLoading } = useQuery({
    queryKey: ['admin-booking-stats'],
    queryFn: () => adminApi.getBookingStats('month'),
  });
  const { data: revenueStats, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-revenue-stats'],
    queryFn: () => adminApi.getRevenueStats('month'),
  });

  const { data: ranking, isLoading: rankingLoading } = useQuery({
    queryKey: ['admin-barber-ranking'],
    queryFn: () => adminApi.getBarberRanking(5),
  });

  const { data: ratingDist, isLoading: distLoading } = useQuery({
    queryKey: ['admin-rating-distribution'],
    queryFn: () => adminApi.getRatingDistribution(),
  });

  const { data: barberAverages, isLoading: averagesLoading } = useQuery({
    queryKey: ['admin-barber-averages'],
    queryFn: () => adminApi.getBarberAverages(),
  });

  const { data: botm, isLoading: botmLoading } = useQuery({
    queryKey: ['admin-botm'],
    queryFn: () => adminApi.getBarberOfTheMonth(),
  });

  const { data: botmHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['admin-botm-history'],
    queryFn: () => adminApi.getBarberHistory(6),
  });

  const loading = statsLoading || bookingLoading || revenueLoading || rankingLoading || distLoading || averagesLoading || botmLoading || historyLoading;

  if (loading) return <DashboardSkeleton />;

  const statCards = [
    {
      label: 'Đặt lịch hôm nay',
      value: stats?.todayBookings || 0,
      growth: stats?.todayBookingsGrowth || 0,
      icon: Calendar,
      color: 'blue',
    },
    {
      label: 'Doanh thu hôm nay',
      value: stats?.todayRevenue || 0,
      growth: stats?.todayRevenueGrowth || 0,
      isCurrency: true,
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Doanh thu tháng',
      value: stats?.monthRevenue || 0,
      growth: stats?.monthRevenueGrowth || 0,
      isCurrency: true,
      icon: TrendingUp,
      color: 'indigo',
    },
    {
      label: 'Tổng khách hàng',
      value: stats?.totalCustomers || 0,
      growth: stats?.customerGrowth || 0,
      icon: Users,
      color: 'purple',
    },
    {
      label: 'Tổng nhân viên',
      value: stats?.totalStaff || 0,
      icon: Scissors,
      color: 'orange',
    },
    {
      label: 'Chi nhánh',
      value: stats?.totalSalons || 0,
      icon: Store,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight text-left">Trung tâm phân tích</h1>
        <p className="text-gray-500 mt-1 text-left">Theo dõi và quản lý hiệu suất kinh doanh của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  stat.color === 'blue' && "bg-blue-50 text-blue-600",
                  stat.color === 'green' && "bg-green-50 text-green-600",
                  stat.color === 'indigo' && "bg-indigo-50 text-indigo-600",
                  stat.color === 'purple' && "bg-purple-50 text-purple-600",
                  stat.color === 'orange' && "bg-orange-50 text-orange-600",
                  stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                )}>
                  <stat.icon className="w-5 h-5" />
                </div>
                {typeof stat.growth !== 'undefined' && stat.growth !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full",
                    stat.growth > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {stat.growth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(stat.growth)}%
                  </div>
                )}
              </div>
              <div className="space-y-1 text-left">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 leading-tight">
                  {stat.isCurrency ? formatPrice(stat.value as number) : stat.value.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 text-left">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Xu hướng doanh thu</CardTitle>
                <CardDescription>Doanh thu hàng ngày trong 30 ngày qua</CardDescription>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] min-h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueStats?.dailyRevenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [formatPrice(Number(val)), 'Doanh thu']}
                    labelFormatter={(label) => format(new Date(label), 'eeee, dd MMMM', { locale: vi })}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0ea5e9" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Services Pie Chart */}
        <Card className="border-none shadow-sm h-full">
          <CardHeader className="border-b bg-gray-50/50 text-left">
            <CardTitle className="text-lg font-bold">Dịch vụ thịnh hành</CardTitle>
            <CardDescription>Tỉ lệ các dịch vụ được đặt nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.topServices || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {stats?.topServices?.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {stats?.topServices?.map((service: any, index: number) => (
                <div key={service.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{service.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{service.count} lượt</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Bar Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 text-left">
            <CardTitle className="text-lg font-bold">Lưu lượng đặt lịch</CardTitle>
            <CardDescription>Đang phân tích số lượng booking mỗi ngày</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] min-h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingStats?.timeline}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6', radius: 8 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="border-none shadow-sm h-full flex flex-col">
          <CardHeader className="border-b bg-gray-50/50 shrink-0 text-left">
            <CardTitle className="text-lg font-bold">Hoạt động mới nhất</CardTitle>
            <CardDescription>Các sự kiện vừa diễn ra trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1 max-h-[500px] custom-scrollbar">
            <div className="divide-y divide-gray-100">
              {stats?.activityFeed?.map((activity: any, index: number) => (
                <div key={index} className="p-4 hover:bg-gray-50/50 transition-colors flex gap-4 text-left">
                  <div className={cn(
                    "w-10 h-10 rounded-full shrink-0 flex items-center justify-center",
                    activity.type === 'BOOKING' && "bg-blue-100 text-blue-600",
                    activity.type === 'REVIEW' && "bg-yellow-100 text-yellow-600",
                    activity.type === 'USER' && "bg-green-100 text-green-600",
                  )}>
                    {activity.type === 'BOOKING' && <Clock className="w-5 h-5" />}
                    {activity.type === 'REVIEW' && <Star className="w-5 h-5" />}
                    {activity.type === 'USER' && <UserPlus className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">{activity.title}</p>
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                        {activity.time ? formatDistanceToNow(new Date(activity.time)) : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* --- NEW ADVANCED ANALYTICS SECTION --- */}
        
        {/* Barber of the Month - HERO WIDGET */}
        {botm && (
          <Card className="lg:col-span-3 border-none shadow-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <Trophy className="w-48 h-48" />
            </div>
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
               <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
                  <Avatar className="w-32 h-32 border-4 border-white/30 shadow-2xl relative z-10">
                    <AvatarImage src={botm.avatar} alt={botm.name} className="object-cover" />
                    <AvatarFallback className="bg-indigo-700 text-white text-3xl font-bold">{botm.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-full shadow-lg border-2 border-white text-indigo-900 z-20">
                    <Trophy className="w-5 h-5 fill-current" />
                  </div>
               </div>
               
               <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-3 py-1 mb-2 font-black tracking-widest uppercase text-[10px]">
                       Barber of the Month • {format(new Date(), 'MMMM yyyy', { locale: vi })}
                    </Badge>
                    <h2 className="text-4xl font-black tracking-tight">{botm.name}</h2>
                    <p className="text-white/80 font-medium text-lg mt-1 italic opacity-90">Kỷ lục phục vụ xuất sắc nhất tháng này!</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 max-w-md">
                     <div className="text-center border-r border-white/10">
                        <p className="text-2xl font-black leading-none">{botm.averageRating.toFixed(1)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-70">Rating</p>
                     </div>
                     <div className="text-center border-r border-white/10">
                        <p className="text-2xl font-black leading-none">{botm.totalBookings}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-70">Bookings</p>
                     </div>
                     <div className="text-center">
                        <p className="text-2xl font-black leading-none">{botm.totalReviews}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-70">Reviews</p>
                     </div>
                  </div>
               </div>
               
               <div className="shrink-0">
                  <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-8 h-12 rounded-xl border-none shadow-xl">
                    Gửi lời chúc mừng 👏
                  </Button>
               </div>
            </CardContent>
          </Card>
        )}

        {/* Honoring History - Recent BOTMs */}
        {botmHistory && botmHistory.length > 0 && (
          <Card className="lg:col-span-3 border-none shadow-premium bg-white overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-slate-50 flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="text-md font-bold text-slate-800">Lịch sử vinh danh</CardTitle>
                  <CardDescription className="text-xs">Barber xuất sắc nhất 6 tháng gần nhất</CardDescription>
               </div>
               <Badge variant="outline" className="text-[10px] font-bold text-slate-400">HISTORY</Badge>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                  {botmHistory?.map((winner: any, idx: number) => (
                    <div key={`${winner.month}-${winner.year}`} className="flex flex-col items-center min-w-[140px] text-center space-y-3 group">
                       <div className="relative">
                          <Avatar className="w-20 h-20 border-2 border-slate-100 group-hover:border-indigo-200 transition-colors">
                             <AvatarImage src={winner.avatar} alt={winner.name} />
                             <AvatarFallback className="bg-slate-50 text-slate-400 font-bold">{winner.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-slate-50">
                             <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                {idx + 1}
                             </div>
                          </div>
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tháng {winner.month} • {winner.year}</p>
                          <p className="text-sm font-black text-slate-800 truncate w-full group-hover:text-indigo-600 transition-colors uppercase">{winner.name}</p>
                          <div className="flex items-center justify-center gap-1.5 mt-1.5">
                             <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                {winner.averageRating.toFixed(1)}
                             </div>
                             <span className="text-slate-200 text-[10px]">|</span>
                             <p className="text-[10px] font-bold text-slate-500">{winner.totalBookings} BUỔI</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        )}

        {/* Top Rated Barbers Widget */}
        <Card className="lg:col-span-1 border-none shadow-sm flex flex-col h-full">
          <CardHeader className="border-b bg-gray-50/50 text-left">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Top Rated Barbers</CardTitle>
                <CardDescription>Xếp hạng dựa trên rating và hiệu suất</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="divide-y">
              {ranking?.map((barber: any, index: number) => (
                <div key={barber.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="relative">
                    <Image 
                      src={barber.avatar || '/images/default-avatar.png'} 
                      alt={barber.name} 
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className={cn(
                      "absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-md",
                      index === 0 ? "bg-yellow-400 text-white" : 
                      index === 1 ? "bg-gray-300 text-gray-700" : 
                      index === 2 ? "bg-orange-400 text-white" : "bg-gray-100 text-gray-500"
                    )}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors uppercase">{barber.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-700 font-bold text-xs border border-yellow-100">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {barber.averageRating?.toFixed(1) || '0.0'}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">({barber.totalReviews || 0} reviews)</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900 leading-none">{barber.totalBookings || 0}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rating Distribution Pie Chart */}
        <Card className="border-none shadow-sm flex flex-col h-full">
          <CardHeader className="border-b bg-gray-50/50 text-left">
            <CardTitle className="text-lg font-bold">Phân bổ đánh giá</CardTitle>
            <CardDescription>Tỉ lệ sao từ khách hàng</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratingDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="star"
                  >
                    {[5, 4, 3, 2, 1].map((star, index) => (
                      <Cell key={`cell-${star}`} fill={[
                        '#10b981', // 5 star
                        '#3b82f6', // 4 star
                        '#f59e0b', // 3 star
                        '#f97316', // 2 star
                        '#ef4444'  // 1 star
                      ][index]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val, name) => [val, `${name} sao`]}
                  />
                  <Legend 
                     verticalAlign="bottom" 
                     formatter={(value, entry: any) => `${entry.payload.star} sao`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Barber Average Ratings Bar Chart */}
        <Card className="lg:col-span-1 border-none shadow-sm flex flex-col h-full">
          <CardHeader className="border-b bg-gray-50/50 text-left">
             <CardTitle className="text-lg font-bold">Hiệu suất Barber</CardTitle>
             <CardDescription>Xếp hạng sao trung bình</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barberAverages} layout="vertical" margin={{ left: -20 }}>
                  <XAxis type="number" hide domain={[0, 5]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#374151' }}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6', radius: 4 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val) => [`${val} sao`, 'Đánh giá']}
                  />
                  <Bar 
                    dataKey="averageRating" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  >
                    {barberAverages?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.averageRating >= 4.5 ? '#10b981' : entry.averageRating >= 4 ? '#3b82f6' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 justify-center">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#10b981]" /> Xuất sắc</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#3b82f6]" /> Tốt</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-[#f59e0b]" /> Cần cải thiện</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDistanceToNow(date: Date) {
  const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return format(date, 'dd/MM', { locale: vi });
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
