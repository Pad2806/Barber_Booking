'use client';

import { useQuery } from '@tanstack/react-query';
import { cashierApi } from '@/lib/api';
import {
  DollarSign,
  TrendingUp,
  Banknote,
  QrCode,
  Loader2,
} from 'lucide-react';
import dynamicImport from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const AreaChart = dynamicImport(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamicImport(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamicImport(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamicImport(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamicImport(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamicImport(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamicImport(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const BarChart = dynamicImport(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamicImport(() => import('recharts').then(mod => mod.Bar), { ssr: false });

export default function RevenuePage() {
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['cashier', 'revenue'],
    queryFn: cashierApi.getRevenue,
    refetchInterval: 60000,
  });

  if (isLoading) return <RevenueSkeleton />;

  const stats = revenue?.stats || { today: 0, week: 0, month: 0, todayTransactions: 0 };
  const byService = revenue?.byService || [];
  const byStaff = revenue?.byStaff || [];
  const byMethod = revenue?.byMethod || [];
  const trend = revenue?.trend || [];

  const METHOD_LABELS: Record<string, string> = {
    CASH: 'Tiền mặt',
    VIETQR: 'Chuyển khoản',
    BANK_TRANSFER: 'Chuyển khoản',
  };

  const METHOD_ICONS: Record<string, any> = {
    CASH: Banknote,
    VIETQR: QrCode,
    BANK_TRANSFER: QrCode,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Doanh thu</h1>
        <p className="text-slate-500 mt-1">Tổng quan doanh thu tại chi nhánh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Hôm nay', value: stats.today, color: 'emerald', trend: `${stats.todayTransactions} giao dịch` },
          { label: 'Tuần này', value: stats.week, color: 'blue' },
          { label: 'Tháng này', value: stats.month, color: 'indigo' },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl',
                  s.color === 'emerald' && 'bg-emerald-50 text-emerald-600',
                  s.color === 'blue' && 'bg-blue-50 text-blue-600',
                  s.color === 'indigo' && 'bg-indigo-50 text-indigo-600',
                )}>
                  <DollarSign className="w-5 h-5" />
                </div>
                {s.trend && (
                  <Badge variant="secondary" className="bg-slate-50 text-slate-500 text-[10px] border-none">
                    {s.trend}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 leading-tight mt-1">{formatPrice(s.value)}</p>
            </CardContent>
          </Card>
        ))}

        {/* Payment Methods */}
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-slate-500 mb-3">Phương thức thanh toán</p>
            {byMethod.length === 0 ? (
              <p className="text-xs text-slate-300">Chưa có giao dịch</p>
            ) : (
              <div className="space-y-2">
                {byMethod.map((m: any) => {
                  const Icon = METHOD_ICONS[m.method] || DollarSign;
                  return (
                    <div key={m.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{METHOD_LABELS[m.method] || m.method}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{formatPrice(m.amount)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Xu hướng doanh thu</CardTitle>
                <CardDescription>7 ngày gần nhất</CardDescription>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="colorRevCashier" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#C8A97E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN', { weekday: 'short' })}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatPrice(val), 'Doanh thu']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#C8A97E" strokeWidth={3} fillOpacity={1} fill="url(#colorRevCashier)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Staff */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-bold">Theo nhân viên</CardTitle>
            <CardDescription>Doanh thu hôm nay</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {byStaff.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-300">Chưa có dữ liệu</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {byStaff.map((s: any, i: number) => (
                  <div key={i} className="p-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={s.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{s.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.count} booking</p>
                    </div>
                    <p className="font-bold text-primary text-sm">{formatPrice(s.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Service */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <CardTitle className="text-lg font-bold">Doanh thu theo dịch vụ</CardTitle>
          <CardDescription>Top dịch vụ có doanh thu cao nhất hôm nay</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {byService.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-300">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dịch vụ</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Số lần</th>
                    <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {byService.map((s: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary" className="bg-slate-50 text-slate-600 font-bold">{s.count}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <p className="text-sm font-bold text-primary">{formatPrice(s.revenue)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RevenueSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
