'use client';

import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  UserPlus, 
  TrendingUp, 
  Star,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

export default function ManagerDashboard(): JSX.Element {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['manager', 'dashboard'],
    queryFn: () => managerApi.getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-[#E8E0D4]" />
          ))}
        </div>
        <div className="h-[400px] bg-white rounded-xl animate-pulse border border-[#E8E0D4]" />
      </div>
    );
  }

  const overview = stats?.overview || {
    revenueToday: 0,
    bookingsToday: 0,
    activeBarbers: 0,
    newCustomers: 0
  };

  const statCards = [
    {
      title: 'Doanh thu hôm nay',
      value: `${(overview.revenueToday / 1000).toLocaleString()}k`,
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      trend: '+12.5%'
    },
    {
      title: 'Tổng Booking',
      value: overview.bookingsToday,
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600',
      trend: '+4 từ hôm qua'
    },
    {
      title: 'Barber đang làm',
      value: overview.activeBarbers,
      icon: Users,
      color: 'bg-amber-50 text-amber-600',
      trend: 'Đầy đủ ca'
    },
    {
      title: 'Khách hàng mới',
      value: overview.newCustomers,
      icon: UserPlus,
      color: 'bg-purple-50 text-purple-600',
      trend: 'Hôm nay'
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#2C1E12] tracking-tight italic uppercase">
            Salon <span className="text-[#C8A97E]">Overview</span>
          </h1>
          <p className="text-[#8B7355] font-medium">Báo cáo hiệu suất chi nhánh hôm nay</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="border-[#E8E0D4] text-[#8B7355] font-bold">
                Tải báo cáo
            </Button>
            <Link href="/manager/schedule">
                <Button className="bg-[#C8A97E] hover:bg-[#B8975E] text-white font-bold shadow-sm">
                    Quản lý lịch làm
                </Button>
            </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-[#8B7355] bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E8E0D4]">
                        {card.trend}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#8B7355] uppercase tracking-wider mb-1">{card.title}</p>
                    <h3 className="text-3xl font-black text-[#2C1E12] italic">{card.value}</h3>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-[#FAF8F5]">
                  <div className={`h-full ${card.color.split(' ')[0].replace('-50', '-500')} w-2/3 opacity-30`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white p-6">
          <CardHeader className="px-0 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-[#2C1E12] italic uppercase tracking-tight">Biểu đồ doanh thu</CardTitle>
                <p className="text-sm text-[#8B7355]">Xu hướng doanh thu 7 ngày qua</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#C8A97E] bg-[#C8A97E]/10 px-3 py-1.5 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                +15.2%
              </div>
            </div>
          </CardHeader>
          <div className="h-[350px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueTrend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C8A97E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE3" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8B7355', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN', { weekday: 'short' })}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8B7355', fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 800, marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#C8A97E" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Barbers */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-[#FAF8F5] pb-4">
            <CardTitle className="text-xl font-black text-[#2C1E12] italic uppercase tracking-tight flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                Top Rated Barbers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#FAF8F5]">
              {(stats?.topBarbers || []).map((barber: any, idx: number) => (
                <div key={barber.id} className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarImage src={barber.avatar} />
                            <AvatarFallback className="bg-[#C8A97E]/10 text-[#C8A97E] font-bold">
                                {barber.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-black italic shadow-md border border-[#E8E0D4] text-[#C8A97E]">
                            #{idx + 1}
                        </div>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#2C1E12] group-hover:text-[#C8A97E] transition-colors">{barber.name}</h4>
                      <p className="text-xs font-bold text-[#8B7355] flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {barber.rating} • {Math.floor(Math.random() * 50) + 10} reviews
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-[#C8A97E]/10 text-[#C8A97E] rounded-full">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="p-4 bg-[#FAF8F5]">
                <Button variant="ghost" className="w-full text-[#8B7355] font-bold text-xs uppercase tracking-widest hover:text-[#C8A97E] transition-colors">
                    Xem tất cả nhân viên
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
