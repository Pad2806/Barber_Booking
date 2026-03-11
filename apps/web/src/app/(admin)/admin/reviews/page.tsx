'use client';

import { useMemo, useState } from 'react';
import {
  Star,
  MessageSquare,
  MoreVertical,
  Trash2,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Store,
} from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';
import { adminApi, salonApi, Salon } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/admin/error-state';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const VISIBILITY_CONFIG: any = {
  true: { label: 'Hiển thị', variant: 'success' },
  false: { label: 'Đã ẩn', variant: 'destructive' },
};

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [page] = useState(1);
  const [limit] = useState(10);
  const [search] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [salonId, setSalonId] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  const { data: salonsData } = useQuery({
    queryKey: ['admin', 'salons', 'list'],
    queryFn: () => salonApi.getAll({ limit: 100 }),
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'reviews', { page, limit, search, rating, salonId, dateFrom, dateTo }],
    queryFn: () => adminApi.getAllReviews({ 
      page, 
      limit, 
      search, 
      rating, 
      salonId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      toast.success('Đã xóa đánh giá');
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa đánh giá');
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => adminApi.replyReview(id, reply),
    onSuccess: () => {
      toast.success('Đã gửi phản hồi');
      setReplyDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể gửi phản hồi');
    },
  });

  // Calculate stats at top level
  // Use meta stats from API
  const stats = useMemo(() => {
    if (!data?.meta) return { avg: 0, positive: 0, negative: 0, total: 0 };
    
    // Distribution can be used to calculate positive (4-5) and negative (1-2) accurately
    const dist = data.meta.distribution || {};
    const positive = (dist[4] || 0) + (dist[5] || 0);
    const negative = (dist[1] || 0) + (dist[2] || 0);
    
    return { 
      avg: data.meta.averageRating || 0, 
      positive, 
      negative, 
      total: data.meta.total 
    };
  }, [data]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'customer.name',
      header: 'Khách hàng',
      cell: ({ row }) => {
        const customer = row.original.customer;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarImage src={customer?.avatar || ''} alt={customer?.name} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                {customer?.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900 line-clamp-1">{customer?.name || 'Ẩn danh'}</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                {formatDateTime(row.original.createdAt)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'rating',
      header: 'Đánh giá',
      cell: ({ row }) => {
        const ratingVal = row.original.rating;
        return (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span className="font-bold text-slate-700">{ratingVal}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'comment',
      header: 'Nội dung',
      cell: ({ row }) => {
        const review = row.original;
        const hasReply = !!review.reply;
        return (
          <div className="flex flex-col gap-1.5 min-w-[200px] max-w-[400px] text-left">
            <p className="text-sm text-slate-600 line-clamp-2 italic">“{review.comment}”</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5 bg-slate-50 text-slate-500 border-slate-200">
                <Store className="w-2.5 h-2.5 mr-1" /> {review.salon?.name}
              </Badge>
              {hasReply && (
                <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-600 border-emerald-100">
                  <MessageSquare className="w-2.5 h-2.5 mr-1" /> Đã trả lời
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'isVisible',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <StatusBadge status={String(row.getValue('isVisible'))} config={VISIBILITY_CONFIG} />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const review = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-1 shadow-xl border-slate-200">
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedReview(review);
                  setReplyText(review.reply || '');
                  setReplyDialogOpen(true);
                }}
                className="rounded-md focus:bg-slate-50 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 mr-2 text-slate-400" /> 
                {review.reply ? 'Sửa phản hồi' : 'Phản hồi'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:bg-destructive/5 focus:text-destructive rounded-md cursor-pointer"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa đánh giá của ${review.customer?.name}?`)) {
                    deleteMutation.mutate(review.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa đánh giá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [deleteMutation]);

  if (isError) {
    return (
      <Card className="m-8 border-none shadow-premium">
        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
          <ErrorState 
            message={(error as any)?.response?.data?.message || 'Không thể tải danh sách đánh giá'} 
            onRetry={() => refetch()} 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Đánh giá</h1>
          <p className="text-slate-500 mt-1">Lắng nghe ý kiến của khách hàng để không ngừng cải thiện chất lượng dịch vụ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-amber-50 border-none shadow-none ring-1 ring-amber-200 transition-all hover:ring-amber-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-white rounded-2xl text-amber-500 shadow-sm">
              <Star className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600/70 uppercase tracking-wider">Trung bình</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.avg.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 5.0</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-none shadow-none ring-1 ring-emerald-200 transition-all hover:ring-emerald-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-white rounded-2xl text-emerald-500 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600/70 uppercase tracking-wider">Tích cực</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.positive}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-rose-50 border-none shadow-none ring-1 ring-rose-200 transition-all hover:ring-rose-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-white rounded-2xl text-rose-500 shadow-sm">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-rose-600/70 uppercase tracking-wider">Tiêu cực</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.negative}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-none shadow-none ring-1 ring-primary/10 transition-all hover:ring-primary/20">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-white rounded-2xl text-primary shadow-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng cộng</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm">
        <CardHeader className="px-6 flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-100">
          <CardTitle className="text-xl font-bold text-slate-800">Phản hồi khách hàng</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            {/* Salon Filter */}
            <select
              title="Salon Filter"
              value={salonId || 'ALL'}
              onChange={(e) => setSalonId(e.target.value === 'ALL' ? undefined : e.target.value)}
              className="h-9 px-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium min-w-[160px]"
            >
              <option value="ALL">Tất cả chi nhánh</option>
              {salonsData?.data.map((s: Salon) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Rating Filter */}
            <select
              title="Rating Filter"
              value={rating || 'ALL'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRating(e.target.value === 'ALL' ? undefined : parseInt(e.target.value))}
              className="h-9 px-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
            >
              <option value="ALL">Tất cả xếp hạng</option>
              <option value="5">5 Sao</option>
              <option value="4">4 Sao</option>
              <option value="3">3 Sao</option>
              <option value="2">2 Sao</option>
              <option value="1">1 Sao</option>
            </select>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                title="Từ ngày"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <span className="text-slate-400 font-bold text-xs">→</span>
              <input
                type="date"
                title="Đến ngày"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {(salonId || rating || dateFrom || dateTo) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSalonId(undefined);
                  setRating(undefined);
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-xs text-slate-500 hover:text-primary"
              >
                Xóa lọc
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 py-6">
          <DataTable
            columns={columns}
            data={data?.data || []}
            searchKey="comment"
            loading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-heading italic text-primary">Phản hồi đánh giá</DialogTitle>
            <DialogDescription className="text-slate-500">
              Trả lời ý kiến của khách hàng để xây dựng lòng tin và cải thiện dịch vụ.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6 py-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-600 text-sm">
                &ldquo;{selectedReview.comment}&rdquo;
                <div className="mt-2 text-[10px] text-slate-400 font-bold not-italic font-heading">
                  — {selectedReview.customer?.name} • {selectedReview.rating} ⭐
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nội dung phản hồi</label>
                <Textarea
                  placeholder="Cảm ơn quý khách đã dành thời gian đánh giá..."
                  className="min-h-[120px] rounded-xl border-slate-200 focus:ring-primary/20"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)} className="rounded-xl px-6">Hủy</Button>
            <Button 
              className="rounded-xl px-8 font-bold"
              disabled={replyMutation.isPending || !replyText.trim()}
              onClick={() => replyMutation.mutate({ id: selectedReview.id, reply: replyText })}
            >
              {replyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Gửi phản hồi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
