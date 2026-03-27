'use client';

import { useQuery } from '@tanstack/react-query';
import { cashierApi } from '@/lib/api';
import {
  CalendarCheck,
  DollarSign,
  CheckCircle2,
  Smartphone,
  UserPlus,
  CreditCard,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatPrice } from '@/lib/utils';
import Link from 'next/link';
import dayjs from 'dayjs';

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang phục vụ',
  PENDING: 'Chờ duyệt',
};

export default function CashierDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['cashier', 'dashboard'],
    queryFn: cashierApi.getDashboardStats,
    refetchInterval: 30000,
  });

  if (isLoading) return <DashboardSkeleton />;

  const statCards = [
    { label: 'Lịch hôm nay', value: stats?.todayBookings || 0, icon: CalendarCheck, color: 'blue' },
    { label: 'Doanh thu hôm nay', value: stats?.todayRevenue || 0, icon: DollarSign, color: 'emerald', isCurrency: true },
    { label: 'Chờ duyệt online', value: stats?.pendingOnline || 0, icon: Smartphone, color: 'amber' },
    { label: 'Đã hoàn thành', value: stats?.completedToday || 0, icon: CheckCircle2, color: 'emerald' },
  ];

  const quickActions = [
    { label: 'Duyệt lịch Online', href: '/dashboard/online-bookings', icon: Smartphone, desc: 'Duyệt booking mới từ website' },
    { label: 'Tiếp nhận khách', href: '/dashboard/walk-in', icon: UserPlus, desc: 'Tạo booking cho khách vãng lai' },
    { label: 'Thanh toán', href: '/dashboard/checkout', icon: CreditCard, desc: 'Xử lý thanh toán tại quầy' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Tổng quan</h1>
        <p className="text-slate-500 mt-1">Quản lý hoạt động tại quầy thu ngân</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl',
                  s.color === 'blue' && 'bg-blue-50 text-blue-600',
                  s.color === 'emerald' && 'bg-emerald-50 text-emerald-600',
                  s.color === 'amber' && 'bg-amber-50 text-amber-600',
                  s.color === 'orange' && 'bg-orange-50 text-orange-600',
                )}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 leading-tight mt-1">
                {s.isCurrency ? formatPrice(s.value) : s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-bold">Thao tác nhanh</CardTitle>
            <CardDescription>Các chức năng thường dùng</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href}>
                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <a.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{a.label}</p>
                    <p className="text-xs text-slate-400">{a.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Lịch hẹn sắp tới</CardTitle>
                <CardDescription>Các booking hôm nay cần phục vụ</CardDescription>
              </div>
              <Link href="/dashboard/appointments">
                <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
                  Xem tất cả
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!stats?.upcoming?.length ? (
              <div className="flex flex-col items-center py-12 text-slate-400">
                <Clock className="w-10 h-10 mb-3 text-slate-200" />
                <p className="text-sm font-medium">Không có lịch hẹn sắp tới</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {stats.upcoming.map((b: any) => (
                  <div key={b.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center gap-4">
                    <div className="text-center shrink-0 w-16">
                      <p className="text-lg font-bold text-slate-900">{b.timeSlot}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{b.endTime}</p>
                    </div>
                    <div className="h-10 w-px bg-slate-100" />
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={b.customer?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {b.customer?.name?.charAt(0) || 'K'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{b.customer?.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {b.services?.map((s: any) => s.service?.name).join(', ')}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {b.staff && (
                        <Badge variant="outline" className="text-[10px] border-slate-200">
                          {b.staff.user?.name}
                        </Badge>
                      )}
                      <Badge className={cn('text-[10px] border', STATUS_STYLES[b.status])}>
                        {STATUS_LABELS[b.status] || b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}
