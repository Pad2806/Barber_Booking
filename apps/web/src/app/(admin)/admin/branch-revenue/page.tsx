'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Store,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowLeft,
  Download,
  Trophy,
  Target,
  CreditCard,
  Banknote,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Period = 'week' | 'month' | 'quarter' | 'year';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year', label: 'Năm' },
];

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString('vi-VN');
}

function formatFullCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

function StatusBadge({ percentage }: { percentage: number | null }) {
  if (percentage === null) return <span className="text-xs text-slate-400">—</span>;
  const color =
    percentage >= 100
      ? 'bg-emerald-100 text-emerald-700'
      : percentage >= 70
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';
  const icon = percentage >= 100 ? '🟢' : percentage >= 70 ? '🟡' : '🔴';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold', color)}>
      {icon} {percentage}%
    </span>
  );
}

function MiniBarChart({ data, maxRevenue }: { data: any[]; maxRevenue: number }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="flex items-end gap-[2px] h-12">
      {data.map((d: any, i: number) => {
        const height = maxRevenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, 4) : 4;
        return (
          <div
            key={i}
            className="bg-primary/60 rounded-t-sm min-w-[3px] flex-1 transition-all hover:bg-primary"
            style={{ height: `${height}%` }}
            title={`${d.date}: ${formatFullCurrency(d.revenue)}`}
          />
        );
      })}
    </div>
  );
}

function BranchDetailPanel({
  salonId,
  period,
  onClose,
}: {
  salonId: string;
  period: Period;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-revenue-detail', salonId, period],
    queryFn: () => adminApi.getBranchRevenueDetail(salonId, { period }),
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-in fade-in">
        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-600">Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxDaily = Math.max(...(data.dailyBreakdown?.map((d: any) => d.revenue) || [0]));
  const methodTotal = (data.byMethod?.cash || 0) + (data.byMethod?.transfer || 0);
  const cashPercent = methodTotal > 0 ? Math.round(((data.byMethod?.cash || 0) / methodTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md rounded-t-3xl border-b p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{data.salon?.name}</h2>
              <p className="text-xs text-slate-500">{data.transactionCount} giao dịch</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Tổng doanh thu</p>
              <p className="text-xl font-black text-emerald-900 mt-1">{formatFullCurrency(data.totalRevenue || 0)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Tiền mặt</p>
              <p className="text-xl font-black text-blue-900 mt-1">{formatCurrency(data.byMethod?.cash || 0)}</p>
              <p className="text-[10px] text-blue-500 mt-0.5">{cashPercent}%</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">Chuyển khoản</p>
              <p className="text-xl font-black text-purple-900 mt-1">{formatCurrency(data.byMethod?.transfer || 0)}</p>
              <p className="text-[10px] text-purple-500 mt-0.5">{100 - cashPercent}%</p>
            </div>
          </div>

          {/* Revenue Target */}
          {data.salon?.revenueTarget && (
            <div className="p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-600">Tiến độ chỉ tiêu</p>
                <StatusBadge percentage={Math.round((data.totalRevenue / data.salon.revenueTarget) * 100)} />
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (data.totalRevenue / data.salon.revenueTarget) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {formatFullCurrency(data.totalRevenue)} / {formatFullCurrency(data.salon.revenueTarget)}
              </p>
            </div>
          )}

          {/* Daily Chart */}
          {data.dailyBreakdown?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-600 mb-3">Doanh thu theo ngày</p>
              <div className="flex items-end gap-1 h-32 px-2">
                {data.dailyBreakdown.map((d: any, i: number) => {
                  const height = maxDaily > 0 ? Math.max((d.revenue / maxDaily) * 100, 2) : 2;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-md transition-all hover:from-primary hover:to-primary/80"
                        style={{ height: `${height}%` }}
                        title={`${d.date}: ${formatFullCurrency(d.revenue)} (${d.count} GD)`}
                      />
                      {data.dailyBreakdown.length <= 14 && (
                        <span className="text-[8px] text-slate-400 -rotate-45 origin-top-left whitespace-nowrap">
                          {d.date.slice(5)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transactions */}
          {data.transactions?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-600 mb-3">Giao dịch gần đây</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.transactions.map((tx: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'p-2 rounded-lg',
                        tx.method === 'CASH' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      )}>
                        {tx.method === 'CASH' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{tx.bookingCode}</p>
                        <p className="text-[10px] text-slate-500 truncate">{tx.customerName} · {tx.services}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-bold text-slate-900">{formatFullCurrency(tx.amount)}</p>
                      <p className="text-[10px] text-slate-400">
                        {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString('vi-VN') : '—'}
                      </p>
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

export default function BranchRevenuePage() {
  const [period, setPeriod] = useState<Period>('month');
  const [search, setSearch] = useState('');
  const [selectedSalon, setSelectedSalon] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['branch-revenue', period, search],
    queryFn: () => adminApi.getBranchRevenue({ period, search: search || undefined }),
  });

  const branches = data?.branches || [];
  const totalRevenue = data?.totalSystemRevenue || 0;
  const topBranch = branches[0];
  const avgRevenue = branches.length > 0 ? totalRevenue / branches.length : 0;

  const handleExportCSV = () => {
    if (!branches.length) return;
    const headers = ['Chi nhánh', 'Doanh thu', 'Giao dịch', 'Chỉ tiêu', 'Tỷ lệ %'];
    const rows = branches.map((b: any) => [
      b.salonName,
      b.totalRevenue,
      b.bookingCount,
      b.revenueTarget || '',
      b.percentage !== null ? `${b.percentage}%` : '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doanh-thu-chi-nhanh-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Doanh thu chi nhánh</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi hiệu quả kinh doanh từng cơ sở</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="rounded-xl gap-2">
          <Download className="w-4 h-4" />
          Xuất CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-premium bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-emerald-100">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Tổng doanh thu</span>
            </div>
            <p className="text-3xl font-black mt-2">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-emerald-200 mt-1">{branches.length} chi nhánh</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-amber-100">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">CN đầu bảng</span>
            </div>
            <p className="text-xl font-black mt-2 truncate">{topBranch?.salonName || '—'}</p>
            <p className="text-xs text-amber-200 mt-1">
              {topBranch ? formatFullCurrency(topBranch.totalRevenue) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-blue-100">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">TB / Chi nhánh</span>
            </div>
            <p className="text-3xl font-black mt-2">{formatCurrency(avgRevenue)}</p>
            <p className="text-xs text-blue-200 mt-1">Trung bình</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-bold transition-all',
                period === opt.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm chi nhánh..."
            className="pl-10 rounded-xl h-11"
          />
        </div>
      </div>

      {/* Branch Table */}
      <Card className="border-none shadow-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">Chi tiết từng chi nhánh</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500 mt-3">Không tìm thấy chi nhánh nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">#</th>
                    <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Chi nhánh</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Doanh thu</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Giao dịch</th>
                    <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Chỉ tiêu</th>
                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Trạng thái</th>
                    <th className="text-center py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch: any, idx: number) => (
                    <tr
                      key={branch.salonId}
                      className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedSalon(branch.salonId)}
                    >
                      <td className="py-3 px-4">
                        <span className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black',
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-slate-200 text-slate-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-50 text-slate-400'
                        )}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{branch.salonName}</p>
                          <p className="text-[10px] text-slate-400">{branch.city}{branch.district ? `, ${branch.district}` : ''}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-black text-slate-900">{formatFullCurrency(branch.totalRevenue)}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] text-slate-400">{branch.cashCount} TM</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] text-slate-400">{branch.transferCount} CK</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">{branch.bookingCount}</td>
                      <td className="py-3 px-4 text-right">
                        {branch.revenueTarget ? (
                          <p className="text-xs text-slate-500">{formatCurrency(branch.revenueTarget)}</p>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge percentage={branch.percentage} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Panel */}
      {selectedSalon && (
        <BranchDetailPanel
          salonId={selectedSalon}
          period={period}
          onClose={() => setSelectedSalon(null)}
        />
      )}
    </div>
  );
}
