'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cashierApi, paymentApi } from '@/lib/api';
import {
  DollarSign, TrendingUp, Banknote, QrCode, CreditCard,
  Search, Download, AlertCircle, CheckCircle2, Users,
  ChevronLeft, ChevronRight, Clock, Loader2, RefreshCw,
  ArrowUpRight, Scissors,
} from 'lucide-react';
import dynamicImport from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

const AreaChart = dynamicImport(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area = dynamicImport(() => import('recharts').then(m => m.Area), { ssr: false });
const BarChart = dynamicImport(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamicImport(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamicImport(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamicImport(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamicImport(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamicImport(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamicImport(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toYMD(d: Date) {
  return d.toISOString().split('T')[0];
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  VIETQR: 'VietQR',
  BANK_TRANSFER: 'CK ngân hàng',
};

const DAILY_GOAL = 5_000_000; // 5M — có thể để dynamic sau

// ─── Pending Payment Card ─────────────────────────────────────────────────────

function PendingCard({ booking, onPaid }: { booking: any; onPaid: () => void }) {
  const [paying, setPaying] = useState<string | null>(null);

  const remaining = (booking.totalAmount || 0) - (booking.depositPaid || 0);

  const handleCheckout = async (method: string) => {
    setPaying(method);
    try {
      await cashierApi.checkout(booking.id, method);
      toast.success(`✅ Thanh toán ${formatPrice(remaining)} thành công!`);
      onPaid();
    } catch {
      toast.error('Thanh toán thất bại, thử lại.');
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="p-4 border border-amber-200 bg-amber-50/60 rounded-2xl hover:bg-amber-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={booking.customer?.avatar} />
            <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">
              {booking.customer?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm truncate">{booking.customer?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">
              {booking.services?.map((s: any) => s.service?.name).join(', ')}
            </p>
            {booking.depositPaid > 0 && (
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                Đã cọc: {formatPrice(booking.depositPaid)}
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-black text-slate-900 text-sm">{formatPrice(remaining)}</p>
          <p className="text-[10px] text-slate-400">{booking.timeSlot}</p>
        </div>
      </div>

      {/* Quick pay buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handleCheckout('CASH')}
          disabled={!!paying}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-all disabled:opacity-50"
        >
          {paying === 'CASH' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />}
          Tiền mặt
        </button>
        <button
          onClick={() => handleCheckout('VIETQR')}
          disabled={!!paying}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold transition-all disabled:opacity-50"
        >
          {paying === 'VIETQR' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
          VietQR
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TX_PAGE_LIMIT = 15;

export default function CashierRevenuePage() {
  const queryClient = useQueryClient();

  // Date for history view
  const [historyDate, setHistoryDate] = useState(toYMD(new Date()));
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);

  // ── Queries ──

  // Live revenue stats (today, week, month) — auto-refresh 60s
  const { data: revenue, isLoading: loadingRevenue, refetch: refetchRevenue } = useQuery({
    queryKey: ['cashier', 'revenue'],
    queryFn: () => cashierApi.getRevenue(),
    refetchInterval: 60_000,
  });

  // Payment history for selected date — chỉ fetch khi có date hợp lệ
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['cashier', 'payment-history', historyDate],
    queryFn: () => cashierApi.getPaymentHistory(historyDate),
    staleTime: 30_000,
    enabled: !!historyDate,
  });

  // Pending payments — auto-refresh 30s
  const { data: pendingPayments, isLoading: loadingPending } = useQuery({
    queryKey: ['cashier', 'pending-payments'],
    queryFn: cashierApi.getPendingPayments,
    refetchInterval: 30_000,
  });

  const rev = revenue as any;
  const stats = rev?.stats || { today: 0, week: 0, month: 0, todayTransactions: 0 };
  const trend = rev?.trend || [];
  const byMethod = rev?.byMethod || [];
  const byStaff = rev?.byStaff || [];
  const byService = rev?.byService || [];

  const pending: any[] = pendingPayments || [];

  // History data
  const historyBookings: any[] = historyData?.bookings || [];
  const historySummary = historyData?.summary || { totalAmount: 0, totalCash: 0, totalTransfer: 0, totalTransactions: 0 };

  // Client-side search on history
  const filteredHistory = useMemo(() =>
    txSearch
      ? historyBookings.filter((b: any) =>
        b.customer?.name?.toLowerCase().includes(txSearch.toLowerCase()) ||
        b.customer?.phone?.includes(txSearch) ||
        b.staff?.user?.name?.toLowerCase().includes(txSearch.toLowerCase())
      )
      : historyBookings,
    [historyBookings, txSearch]
  );

  // Paginate
  const totalPages = Math.ceil(filteredHistory.length / TX_PAGE_LIMIT);
  const pagedHistory = filteredHistory.slice((txPage - 1) * TX_PAGE_LIMIT, txPage * TX_PAGE_LIMIT);

  // ── Derived ──

  // Daily goal progress
  const goalPercent = Math.min(100, (stats.today / DAILY_GOAL) * 100);

  // Mini payment method comparison (7-day) — compute from trend & method
  // Use today's byMethod for the pie-like breakdown
  const cashAmount = byMethod.find((m: any) => m.method === 'CASH')?.amount || 0;
  const transferAmount = byMethod.filter((m: any) => m.method !== 'CASH').reduce((s: number, m: any) => s + m.amount, 0);
  const methodTotal = cashAmount + transferAmount;
  const cashPct = methodTotal > 0 ? Math.round((cashAmount / methodTotal) * 100) : 0;

  // ── Export PDF-like CSV ──
  const handleExport = useCallback(() => {
    if (!filteredHistory.length) return;
    const headers = ['Giờ', 'Khách hàng', 'SĐT', 'Nhân viên', 'Dịch vụ', 'PT TT', 'Số tiền'];
    const rows = filteredHistory.map((b: any) => {
      const payment = b.payments?.[0];
      return [
        b.updatedAt ? new Date(b.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
        b.customer?.name || '',
        b.customer?.phone || '',
        b.staff?.user?.name || '',
        b.services?.map((s: any) => s.service?.name).join(' + ') || '',
        payment ? METHOD_LABELS[payment.method] || payment.method : '',
        b.totalAmount || 0,
      ];
    });
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `canh-thu-${historyDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [filteredHistory, historyDate]);

  // Invalidate pending + revenue after a payment
  const handlePaid = () => {
    queryClient.invalidateQueries({ queryKey: ['cashier', 'pending-payments'] });
    queryClient.invalidateQueries({ queryKey: ['cashier', 'revenue'] });
    queryClient.invalidateQueries({ queryKey: ['cashier', 'payment-history', historyDate] });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Doanh thu</h1>
          <p className="text-slate-500 mt-1 text-sm">Tổng quan doanh thu tại chi nhánh hôm nay</p>
        </div>
        <button
          onClick={() => refetchRevenue()}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400 hover:text-primary"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── KPI Cards Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hôm nay', value: stats.today, icon: DollarSign, color: 'emerald', sub: `${stats.todayTransactions} GD` },
          { label: 'Tuần này', value: stats.week, icon: TrendingUp, color: 'blue', sub: '' },
          { label: 'Tháng này', value: stats.month, icon: CreditCard, color: 'indigo', sub: '' },
          { label: 'Tiền mặt hôm nay', value: cashAmount, icon: Banknote, color: 'amber', sub: `${cashPct}% tổng` },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'p-2.5 rounded-xl',
                  kpi.color === 'emerald' && 'bg-emerald-50 text-emerald-600',
                  kpi.color === 'blue' && 'bg-blue-50    text-blue-600',
                  kpi.color === 'indigo' && 'bg-indigo-50  text-indigo-600',
                  kpi.color === 'amber' && 'bg-amber-50   text-amber-600',
                )}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                {kpi.sub && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{kpi.sub}</span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">
                {loadingRevenue ? '...' : formatPrice(kpi.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Daily Goal Progress ── */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-slate-700">Tiến độ ngày hôm nay</p>
              <p className="text-xs text-slate-400">Mục tiêu: {formatPrice(DAILY_GOAL)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-primary">{goalPercent.toFixed(0)}%</p>
              <p className="text-[10px] text-slate-400">{formatPrice(stats.today)} / {formatPrice(DAILY_GOAL)}</p>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                goalPercent >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : goalPercent >= 60 ? 'bg-gradient-to-r from-amber-400  to-orange-400'
                    : 'bg-gradient-to-r from-primary     to-primary/70',
              )}
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          {goalPercent >= 100 && (
            <div className="flex items-center gap-1.5 mt-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold">🎉 Đã đạt chỉ tiêu ngày!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Main 2-column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Trend Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Xu hướng 7 ngày</CardTitle>
                <CardDescription>Doanh thu từng ngày (theo payment.paidAt)</CardDescription>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingRevenue ? (
              <Skeleton className="h-[240px] rounded-xl" />
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="cashierGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#C8A97E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false} tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={v => new Date(v).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit' })}
                    />
                    <YAxis
                      axisLine={false} tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={v => `${v / 1000}k`}
                      width={40}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatPrice(val), 'Doanh thu']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px -5px rgba(0,0,0,.12)' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#C8A97E" strokeWidth={2.5} fillOpacity={1} fill="url(#cashierGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Mini method breakdown bars */}
            {!loadingRevenue && methodTotal > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-50 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">PT Thanh toán hôm nay</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Banknote className="w-3 h-3" />Tiền mặt</span>
                      <span className="text-xs font-bold text-emerald-700">{cashPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${cashPct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatPrice(cashAmount)}</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><QrCode className="w-3 h-3" />Chuyển khoản</span>
                      <span className="text-xs font-bold text-blue-700">{100 - cashPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${100 - cashPct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatPrice(transferAmount)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT: Pending Payments */}
        <Card className="border-none shadow-sm bg-white flex flex-col">
          <CardHeader className="border-b border-slate-50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Chờ thanh toán
                </CardTitle>
                <CardDescription>Đã hoàn thành dịch vụ</CardDescription>
              </div>
              {pending.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-black rounded-full">
                  {pending.length}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 flex-1 overflow-y-auto max-h-[360px]">
            {loadingPending ? (
              <div className="space-y-3 p-1">
                {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
            ) : pending.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto" />
                <p className="text-sm text-slate-400 mt-2">Không có booking tồn đọng!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((b: any) => (
                  <PendingCard key={b.id} booking={b} onPaid={handlePaid} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Staff & Service Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Staff */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Doanh thu theo nhân viên
            </CardTitle>
            <CardDescription>Hôm nay</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {byStaff.length === 0 ? (
              <div className="py-10 text-center">
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

        {/* By Service */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Scissors className="w-4 h-4 text-primary" /> Dịch vụ bán chạy
            </CardTitle>
            <CardDescription>Hôm nay</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {byService.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-300">Chưa có dữ liệu</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {byService.slice(0, 6).map((s: any, i: number) => {
                  const maxRev = byService[0]?.revenue || 1;
                  return (
                    <div key={i} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-semibold text-slate-800 truncate flex-1">{s.name}</p>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <Badge variant="secondary" className="text-[10px] bg-slate-50">{s.count}x</Badge>
                          <p className="text-sm font-bold text-primary">{formatPrice(s.revenue)}</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                          style={{ width: `${(s.revenue / maxRev) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── History / Đối soát ── */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold">Lịch sử giao dịch</CardTitle>
              <CardDescription>Đối soát theo ngày</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date picker */}
              <input
                type="date"
                value={historyDate}
                max={toYMD(new Date())}
                onChange={e => { setHistoryDate(e.target.value); setTxPage(1); }}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={txSearch}
                  onChange={e => { setTxSearch(e.target.value); setTxPage(1); }}
                  placeholder="Tìm khách, nhân viên..."
                  className="pl-9 rounded-xl h-9 w-52 text-sm"
                />
              </div>
              {/* Export */}
              <Button onClick={handleExport} variant="outline" size="sm" className="gap-2 rounded-xl">
                <Download className="w-3.5 h-3.5" />
                CSV
              </Button>
            </div>
          </div>

          {/* Summary for selected date */}
          {!loadingHistory && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Tổng thu', value: historySummary.totalAmount, color: 'emerald' },
                { label: 'Tiền mặt', value: historySummary.totalCash, color: 'blue' },
                { label: 'Chuyển khoản', value: historySummary.totalTransfer, color: 'indigo' },
              ].map(s => (
                <div key={s.label} className={cn(
                  'rounded-xl p-3 text-center',
                  s.color === 'emerald' ? 'bg-emerald-50' : s.color === 'blue' ? 'bg-blue-50' : 'bg-indigo-50'
                )}>
                  <p className={cn('text-[10px] font-bold uppercase tracking-wider',
                    s.color === 'emerald' ? 'text-emerald-600' : s.color === 'blue' ? 'text-blue-600' : 'text-indigo-600'
                  )}>{s.label}</p>
                  <p className={cn('text-lg font-black mt-0.5',
                    s.color === 'emerald' ? 'text-emerald-900' : s.color === 'blue' ? 'text-blue-900' : 'text-indigo-900'
                  )}>{formatPrice(s.value)}</p>
                </div>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loadingHistory ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : !historyDate ? (
            <div className="py-14 text-center">
              <Clock className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Chọn ngày để xem lịch sử giao dịch</p>
            </div>
          ) : pagedHistory.length === 0 ? (
            <div className="py-14 text-center">
              <Clock className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Không có giao dịch ngày {historyDate}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Giờ', 'Khách hàng', 'Nhân viên', 'Dịch vụ', 'PT TT', 'Số tiền'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedHistory.map((b: any, idx: number) => {
                      const payment = b.payments?.[0];
                      const services = b.services?.map((s: any) => s.service?.name).join(', ');
                      return (
                        <tr key={b.id || idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                            {b.timeSlot || (b.updatedAt ? new Date(b.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—')}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-800">{b.customer?.name || 'Khách lẻ'}</p>
                            <p className="text-[10px] text-slate-400">{b.customer?.phone}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-xs">{b.staff?.user?.name || '—'}</td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-[180px] truncate">{services || '—'}</td>
                          <td className="py-3 px-4">
                            {payment ? (
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-bold',
                                payment.method === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                              )}>
                                {METHOD_LABELS[payment.method] || payment.method}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900">{formatPrice(b.totalAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    Trang {txPage}/{totalPages} ({filteredHistory.length} giao dịch)
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTxPage(p => Math.max(1, p - 1))}
                      disabled={txPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = txPage <= 3 ? i + 1 : txPage + i - 2;
                      if (p < 1 || p > totalPages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => setTxPage(p)}
                          className={cn(
                            'w-7 h-7 rounded-lg text-xs font-bold',
                            p === txPage ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
                      disabled={txPage >= totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
