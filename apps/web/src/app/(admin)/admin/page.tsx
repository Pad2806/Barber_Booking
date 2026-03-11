'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Scissors,
  Activity,
  Star,
  UserPlus,
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
import { adminApi, ActivityItem } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

  const loading = statsLoading || bookingLoading || revenueLoading;

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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Trung tâm phân tích</h1>
        <p className="text-gray-500 mt-1">Theo dõi và quản lý hiệu suất kinh doanh của bạn</p>
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
              <div className="space-y-1">
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
          <CardHeader className="border-b bg-gray-50/50">
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
            <div className="h-[350px] w-full mt-4">
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
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-lg font-bold">Dịch vụ thịnh hành</CardTitle>
            <CardDescription>Tỉ lệ các dịch vụ được đặt nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.topServices}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {stats?.topServices.map((_, index) => (
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
              {stats?.topServices.map((service, index) => (
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
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-lg font-bold">Lưu lượng đặt lịch</CardTitle>
            <CardDescription>Đang phân tích số lượng booking mỗi ngày</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full mt-4">
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
          <CardHeader className="border-b bg-gray-50/50 shrink-0">
            <CardTitle className="text-lg font-bold">Hoạt động mới nhất</CardTitle>
            <CardDescription>Các sự kiện vừa diễn ra trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1 max-h-[500px] custom-scrollbar">
            <div className="divide-y divide-gray-100">
              {stats?.activityFeed.map((activity, index) => (
                <div key={index} className="p-4 hover:bg-gray-50/50 transition-colors flex gap-4">
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
                      <span className="text-[10px] text-gray-400 font-medium">
                        {formatDistanceToNow(new Date(activity.time))}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{activity.description}</p>
                  </div>
                </div>
              ))}
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
    <div className="space-y-8 animate-pulse">
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
