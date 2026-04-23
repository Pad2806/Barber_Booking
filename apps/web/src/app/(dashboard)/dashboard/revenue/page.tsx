'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, cashierApi } from '@/lib/api';
import { useSalonScope } from '@/hooks/use-salon-scope';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  CreditCard, Banknote, QrCode, Search, Download,
  Store, ArrowUpRight, Users, Scissors,
  CalendarRange, ChevronLeft, ChevronRight, X,
  ArrowLeft, Trophy,
} from 'lucide-react';
import dynamicImport from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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



function GrowthBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-400">—</span>;
  const positive = value >= 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full',
      positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
    )}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ─── Branch Drill-Down Panel (reused from existing code) ─────────────────────

function BranchDetailPanel({ salonId, onClose }: { salonId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-revenue-detail', salonId, 'month'],
    queryFn: () => adminApi.getBranchRevenueDetail(salonId, { period: 'month' }),
  });

  if (isLoading) return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-in fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-600">Đang tải...</span>
      </div>
    </div>
  );
  if (!data) return null;

  const maxDaily = Math.max(...(data.dailyBreakdown?.map((d: any) => d.revenue) || [0]));
  const methodTotal = (data.byMethod?.cash || 0) + (data.byMethod?.transfer || 0);
  const cashPct = methodTotal > 0 ? Math.round(((data.byMethod?.cash || 0) / methodTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-md rounded-t-3xl border-b p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{data.salon?.name}</h2>
              <p className="text-xs text-slate-500">{data.transactionCount} giao dịch tháng này</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tổng doanh thu', value: formatPrice(data.totalRevenue || 0), color: 'emerald' },
              { label: 'Tiền mặt', value: `${formatPrice(data.byMethod?.cash || 0)} (${cashPct}%)`, color: 'blue' },
              { label: 'Chuyển khoản', value: `${formatPrice(data.byMethod?.transfer || 0)} (${100 - cashPct}%)`, color: 'indigo' },
            ].map(s => (
              <div key={s.label} className={cn(
                'p-4 rounded-2xl',
                s.color === 'emerald' ? 'bg-emerald-50' : s.color === 'blue' ? 'bg-blue-50' : 'bg-indigo-50'
              )}>
                <p className={cn('text-[10px] uppercase font-bold tracking-wider',
                  s.color === 'emerald' ? 'text-emerald-600' : s.color === 'blue' ? 'text-blue-600' : 'text-indigo-600'
                )}>{s.label}</p>
                <p className={cn('text-lg font-black mt-1',
                  s.color === 'emerald' ? 'text-emerald-900' : s.color === 'blue' ? 'text-blue-900' : 'text-indigo-900'
                )}>{s.value}</p>
              </div>
            ))}
          </div>

          {data.dailyBreakdown?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-600 mb-3">Doanh thu theo ngày (tháng này)</p>
              <div className="relative flex items-end gap-0.5 h-28 px-1">
                {(() => {
                  const safeMax = Math.max(maxDaily, 1);
                  return data.dailyBreakdown.map((d: any, i: number) => {
                    const pct = Math.max((d.revenue / safeMax) * 100, 2);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 h-full">
                        <div
                          className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-sm transition-all duration-300 hover:opacity-80"
                          style={{ height: `${pct}%` }}
                          title={`${d.date}: ${formatPrice(d.revenue)}`}
                        />
                        {data.dailyBreakdown.length <= 15 && (
                          <span className="text-[7px] text-slate-400 mt-0.5">{d.date.slice(8)}</span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {data.transactions?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">Giao dịch gần đây</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {data.transactions.map((tx: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{tx.customerName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{tx.services}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-bold text-slate-900">{formatPrice(tx.amount)}</p>
                      <p className="text-[10px] text-slate-400">{tx.paidAt ? new Date(tx.paidAt).toLocaleDateString('vi-VN') : '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Breakdown Tabs ───────────────────────────────────────────────────────────

type BreakdownTab = 'salon' | 'staff' | 'service' | 'method';

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt', VIETQR: 'VietQR / CK', BANK_TRANSFER: 'CK ngân hàng',
};
const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-emerald-100 text-emerald-700', VIETQR: 'bg-blue-100 text-blue-700', BANK_TRANSFER: 'bg-indigo-100 text-indigo-700',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const GRANULARITY_OPTIONS = [
  { value: 'day' as const, label: 'Ngày' },
  { value: 'week' as const, label: 'Tuần' },
  { value: 'month' as const, label: 'Tháng' },
];

const QUICK_RANGES = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
  { label: 'Năm nay', days: 365 },
];

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function AdminRevenuePage(): React.ReactElement {
  const { isSuperAdmin } = useSalonScope();

  // ── Filters ──
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [dateFrom, setDateFrom] = useState(() => toDateStr(new Date(Date.now() - 29 * 86400000)));
  const [dateTo, setDateTo] = useState(() => toDateStr(new Date()));
  const [salonId, setSalonId] = useState<string>('');
  const [method, setMethod] = useState<string>('');
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const TX_LIMIT = 15;

  // ── Breakdown tab ──
  const [tab, setTab] = useState<BreakdownTab>('salon');

  // ── Drill-down ──
  const [selectedSalon, setSelectedSalon] = useState<string | null>(null);

  const applyQuickRange = useCallback((days: number) => {
    const end = new Date();
    const start = new Date(Date.now() - (days - 1) * 86400000);
    setDateFrom(toDateStr(start));
    setDateTo(toDateStr(end));
    setTxPage(1);
  }, []);

  // ── Primary query ──
  const queryParams = useMemo(() => ({
    dateFrom,
    dateTo,
    salonId: salonId || undefined,
    granularity,
    method: method || undefined,
    page: txPage,
    limit: TX_LIMIT,
  }), [dateFrom, dateTo, salonId, granularity, method, txPage]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'revenue-dashboard', queryParams],
    queryFn: () => adminApi.getAdminRevenue(queryParams),
    staleTime: 30000,
  });

  // ── Salons for filter dropdown ──
  const { data: salonsData } = useQuery({
    queryKey: ['admin', 'salons-list'],
    queryFn: () => adminApi.getAllSalons({ limit: 100 }),
    staleTime: 300000,
  });
  const salons = salonsData?.data || [];

  const kpi = data?.kpi || { totalRevenue: 0, revenueGrowth: null, transactionCount: 0, txGrowth: null, avgOrderValue: 0, avgOrderGrowth: null };
  const chart = data?.chart || [];
  const bd = data?.breakdown || { byMethod: [], bySalon: [], byStaff: [], byService: [] };
  const txData = data?.transactions?.data || [];
  const txMeta = data?.transactions?.meta || { total: 0, page: 1, lastPage: 1 };

  // ── Client-side search filter on transactions ──
  const filteredTx = useMemo(() =>
    txSearch
      ? txData.filter((t: any) =>
        t.customerName?.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.salonName?.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.staffName?.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.services?.toLowerCase().includes(txSearch.toLowerCase())
      )
      : txData,
    [txData, txSearch]
  );

  // ── CSV Export ──
  const handleExport = useCallback(() => {
    if (!txData.length) return;
    const headers = ['Ngày', 'Khách hàng', 'Điện thoại', 'Nhân viên', 'Chi nhánh', 'Dịch vụ', 'PT Thanh toán', 'Số tiền'];
    const rows = txData.map((t: any) => [
      t.paidAt ? new Date(t.paidAt).toLocaleDateString('vi-VN') : '',
      t.customerName || '', t.customerPhone || '', t.staffName || '',
      t.salonName || '', t.services || '', METHOD_LABELS[t.method] || t.method, t.amount,
    ]);
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `doanh-thu-${dateFrom}-${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [txData, dateFrom, dateTo]);

  // ─── KPI Cards ─────────────────────────────────────────────────────────────
  const kpiCards = [
    {
      title: 'Tổng doanh thu',
      value: formatPrice(kpi.totalRevenue),
      growth: kpi.revenueGrowth,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Giao dịch',
      value: kpi.transactionCount.toLocaleString('vi-VN'),
      growth: kpi.txGrowth,
      icon: CreditCard,
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Trung bình / GD',
      value: formatPrice(kpi.avgOrderValue),
      growth: kpi.avgOrderGrowth,
      icon: BarChart3,
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Doanh thu</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isSuperAdmin ? 'Tổng quan doanh thu toàn hệ thống' : 'Tổng quan doanh thu chi nhánh'}
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2 rounded-xl shrink-0">
          <Download className="w-4 h-4" />
          Xuất CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Quick range */}
            <div className="flex gap-1">
              {QUICK_RANGES.map(r => (
                <button
                  key={r.days}
                  onClick={() => applyQuickRange(r.days)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setTxPage(1); }}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-slate-400 text-sm">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setTxPage(1); }}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Salon filter */}
            {isSuperAdmin && (
              <select
                value={salonId}
                onChange={e => { setSalonId(e.target.value); setTxPage(1); }}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Tất cả chi nhánh</option>
                {salons.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            {/* Method filter */}
            <select
              value={method}
              onChange={e => { setMethod(e.target.value); setTxPage(1); }}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Tất cả PT</option>
              <option value="CASH">Tiền mặt</option>
              <option value="VIETQR">VietQR</option>
            </select>

            {/* Granularity */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              {GRANULARITY_OPTIONS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setGranularity(g.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    granularity === g.value ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map((card, i) => (
          <Card key={i} className={cn(
            'border-none shadow-premium text-white overflow-hidden relative',
            `bg-gradient-to-br ${card.gradient}`
          )}>
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-x-6 -translate-y-6" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-white/20">
                  <card.icon className="w-5 h-5" />
                </div>
                <GrowthBadge value={card.growth} />
              </div>
              <p className="text-sm text-white/80 font-medium">{card.title}</p>
              <p className="text-3xl font-black mt-1 tracking-tight">{isLoading ? '...' : card.value}</p>
              {card.growth !== null && (
                <p className="text-xs text-white/60 mt-1">so với kỳ trước</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Xu hướng doanh thu</CardTitle>
              <CardDescription>{dateFrom} → {dateTo}</CardDescription>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-[280px] w-full rounded-xl" />
          ) : chart.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-sm text-slate-400">Chưa có dữ liệu trong khoảng thời gian này</p>
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#C8A97E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={v => {
                      if (granularity === 'month') return v.slice(0, 7);
                      if (granularity === 'week') return v;
                      return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                    }}
                  />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={v => `${v / 1000}k`}
                    width={50}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatPrice(val), 'Doanh thu']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,.12)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#C8A97E" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown Tabs */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg font-bold">Phân tích chi tiết</CardTitle>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {([
                { key: 'salon', label: 'Chi nhánh', icon: Store },
                { key: 'staff', label: 'Nhân viên', icon: Users },
                { key: 'service', label: 'Dịch vụ', icon: Scissors },
                { key: 'method', label: 'PT TT', icon: CreditCard },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : (
            <>
              {/* By Salon */}
              {tab === 'salon' && (
                <div className="space-y-2">
                  {bd.bySalon.length === 0 ? (
                    <p className="text-center py-8 text-sm text-slate-400">Chưa có dữ liệu</p>
                  ) : bd.bySalon.map((s: any, i: number) => {
                    const maxRev = bd.bySalon[0]?.revenue || 1;
                    return (
                      <div
                        key={s.salonId}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                        onClick={() => setSelectedSalon(s.salonId)}
                      >
                        <span className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0',
                          i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                        )}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                            <p className="text-sm font-black text-slate-900 ml-2 flex-shrink-0">{formatPrice(s.revenue)}</p>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
                              style={{ width: `${(s.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* By Staff */}
              {tab === 'staff' && (
                <div className="space-y-2">
                  {bd.byStaff.length === 0 ? (
                    <p className="text-center py-8 text-sm text-slate-400">Chưa có dữ liệu</p>
                  ) : bd.byStaff.map((s: any, i: number) => (
                    <div key={s.staffId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={s.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {s.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.count} giao dịch</p>
                      </div>
                      <p className="font-black text-primary text-sm">{formatPrice(s.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* By Service */}
              {tab === 'service' && (
                <div className="space-y-2">
                  {bd.byService.length === 0 ? (
                    <p className="text-center py-8 text-sm text-slate-400">Chưa có dữ liệu</p>
                  ) : bd.byService.map((s: any, i: number) => {
                    const maxRev = bd.byService[0]?.revenue || 1;
                    return (
                      <div key={s.serviceId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <span className="text-[10px] font-black text-slate-400 w-5 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-bold text-slate-800 truncate">{s.name}</p>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              <Badge variant="secondary" className="text-[10px]">{s.count} lần</Badge>
                              <p className="text-sm font-black text-slate-900">{formatPrice(s.revenue)}</p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                              style={{ width: `${(s.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* By Method */}
              {tab === 'method' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bd.byMethod.length === 0 ? (
                    <p className="col-span-3 text-center py-8 text-sm text-slate-400">Chưa có dữ liệu</p>
                  ) : bd.byMethod.map((m: any) => (
                    <div key={m.method} className={cn('rounded-2xl p-5', METHOD_COLORS[m.method] || 'bg-slate-100 text-slate-700')}>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-70">{METHOD_LABELS[m.method] || m.method}</p>
                      <p className="text-xl font-black mt-2">{formatPrice(m.revenue)}</p>
                      <p className="text-xs opacity-60 mt-1">{m.count} giao dịch</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-slate-50 pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg font-bold">Lịch sử giao dịch</CardTitle>
              <CardDescription>Tổng {txMeta.total} giao dịch</CardDescription>
            </div>
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={txSearch}
                onChange={e => { setTxSearch(e.target.value); setTxPage(1); }}
                placeholder="Tìm khách, chi nhánh..."
                className="pl-9 rounded-xl h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="py-16 text-center">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-400 mt-3">Không có giao dịch</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Thời gian', 'Khách hàng', 'Nhân viên', 'Chi nhánh', 'Dịch vụ', 'PT TT', 'Số tiền'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map((tx: any) => (
                      <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-xs">
                          {tx.paidAt ? new Date(tx.paidAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{tx.customerName || '—'}</p>
                          <p className="text-[10px] text-slate-400">{tx.customerPhone}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{tx.staffName || '—'}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs">{tx.salonName || '—'}</td>
                        <td className="py-3 px-4 text-slate-600 text-xs max-w-[180px] truncate">{tx.services || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold',
                            tx.method === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          )}>
                            {METHOD_LABELS[tx.method] || tx.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">{formatPrice(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination — dùng filteredTx.length để tính đúng số trang khi đang search */}
              {(() => {
                const searchLastPage = txSearch
                  ? Math.max(1, Math.ceil(filteredTx.length / TX_LIMIT))
                  : txMeta.lastPage;
                const displayPage = txSearch ? txPage : txMeta.page;
                const totalShown = txSearch ? filteredTx.length : txMeta.total;
                if (searchLastPage <= 1) return null;
                return (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      Trang {displayPage} / {searchLastPage} ({totalShown} giao dịch)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTxPage(p => Math.max(1, p - 1))}
                        disabled={txPage <= 1}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, searchLastPage) }, (_, i) => {
                        const p = txPage <= 3 ? i + 1 : txPage + i - 2;
                        if (p < 1 || p > searchLastPage) return null;
                        return (
                          <button
                            key={p}
                            onClick={() => setTxPage(p)}
                            className={cn(
                              'w-7 h-7 rounded-lg text-xs font-bold transition-all',
                              p === txPage ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                            )}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setTxPage(p => Math.min(searchLastPage, p + 1))}
                        disabled={txPage >= searchLastPage}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Branch Drill-down Panel */}
      {selectedSalon && (
        <BranchDetailPanel
          salonId={selectedSalon}
          onClose={() => setSelectedSalon(null)}
        />
      )}
    </div>
  );
}
