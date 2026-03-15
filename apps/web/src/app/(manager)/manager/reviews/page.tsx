'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  Star, 
  MessageSquare,   
  MoreVertical, 
  CheckCircle2,
  XCircle,
  TrendingUp,
  MessageCircle,
  Scissors,
  Filter,
  Search,
  Loader2
} from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { ErrorState } from '@/components/admin/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';



export default function ManagerReviewsPage() {
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: reviews, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['manager', 'reviews'],
    queryFn: managerApi.getReviews,
  });

  const replyMutation = useMutation({
    mutationFn: (data: { id: string, reply: string }) => managerApi.replyToReview(data.id, data.reply),
    onSuccess: () => {
      toast.success('Đã gửi phản hồi đánh giá');
      setIsReplyOpen(false);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['manager', 'reviews'] });
    },
    onError: () => toast.error('Không thể gửi phản hồi')
  });

  const stats = useMemo(() => {
    if (!reviews) return { avg: 0, total: 0, positive: 0, negative: 0 };
    const total = reviews.length;
    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    const positive = reviews.filter((r: any) => r.rating >= 4).length;
    const negative = reviews.filter((r: any) => r.rating <= 2).length;
    return { avg: total > 0 ? sum / total : 0, total, positive, negative };
  }, [reviews]);

  const filteredData = useMemo(() => {
    if (!reviews) return [];
    return reviews.filter((r: any) => {
      const matchRating = ratingFilter === 'ALL' || r.rating === ratingFilter;
      const matchSearch = r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchRating && matchSearch;
    });
  }, [reviews, ratingFilter, searchTerm]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'customerName',
      header: 'Khách hàng',
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarImage src={review.customer?.avatar} alt={review.customerName} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                {review.customerName?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900 line-clamp-1">{review.customerName}</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'rating',
      header: 'Đánh giá',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span className="font-bold text-slate-700">{row.original.rating}</span>
        </div>
      ),
    },
    {
      accessorKey: 'comment',
      header: 'Nội dung',
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="flex flex-col gap-1.5 min-w-[200px] max-w-[400px] text-left">
            <p className="text-sm text-slate-600 line-clamp-2 italic">“{review.comment}”</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5 bg-slate-50 text-slate-500 border-slate-200">
                <Scissors className="w-2.5 h-2.5 mr-1" /> {review.barberName || 'General'}
              </Badge>
              {review.reply && (
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
                  setIsReplyOpen(true);
                }}
                className="rounded-md focus:bg-slate-50 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 mr-2 text-slate-400" /> 
                {review.reply ? 'Sửa phản hồi' : 'Phản hồi'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  if (isError) {
    return (
      <Card className="m-8 border-none shadow-premium">
        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
          <ErrorState message={(error as any)?.response?.data?.message || 'Lỗi tải đánh giá'} onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Đánh giá khách hàng</h1>
          <p className="text-slate-500 mt-1">Lắng nghe và tương tác với khách hàng tại chi nhánh.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-amber-50 border-none shadow-none ring-1 ring-amber-200">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-white rounded-2xl text-amber-500 shadow-sm">
              <Star className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600/70 uppercase tracking-wider">Trung bình</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{stats.avg.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-none shadow-none ring-1 ring-emerald-200">
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
        <Card className="bg-rose-50 border-none shadow-none ring-1 ring-rose-200">
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
        <Card className="bg-primary/5 border-none shadow-none ring-1 ring-primary/10">
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
        <div className="p-4 border-b bg-slate-50/50">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C8A97E]" />
                <input
                  type="text"
                  placeholder="Tìm nội dung / khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  title="Rating Filter"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A97E]/20 appearance-none cursor-pointer font-medium"
                >
                  <option value="ALL">Tất cả xếp hạng</option>
                  {[5, 4, 3, 2, 1].map(s => <option key={s} value={s}>{s} Sao</option>)}
                </select>
              </div>
              <Badge variant="outline" className="h-10 px-4 border-slate-200 bg-white font-bold text-slate-600 justify-center rounded-xl">
                 {filteredData.length} đánh giá được tìm thấy
              </Badge>
           </div>
        </div>
        <CardContent className="px-0 sm:px-6 py-6">
          <DataTable
            columns={columns}
            data={filteredData}
            searchKey="comment"
            loading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
         <DialogContent className="sm:max-w-xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 pb-0">
               <DialogTitle className="text-2xl font-bold font-heading italic text-primary">Phản hồi đánh giá</DialogTitle>
               <DialogDescription className="font-medium text-slate-500">
                  Phản hồi khách hàng <span className="font-bold text-slate-900">{selectedReview?.customerName}</span>.
               </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-6">
               <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm">
                  &ldquo;{selectedReview?.comment}&rdquo;
               </div>

               <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#C8A97E]">Nội dung phản hồi</label>
                  <Textarea 
                    placeholder="Viết phản hồi thân thiện..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[150px] rounded-2xl bg-white border-slate-200 focus-visible:ring-[#C8A97E]/20 p-5 font-medium"
                  />
               </div>
            </div>

            <DialogFooter className="p-8 pt-0 flex gap-3">
               <Button variant="outline" onClick={() => setIsReplyOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Hủy</Button>
               <Button 
                onClick={() => replyMutation.mutate({ id: selectedReview.id, reply: replyText })}
                disabled={replyMutation.isPending || !replyText}
                className="flex-1 bg-slate-900 border-slate-900 text-white rounded-xl h-12 font-bold shadow-xl"
               >
                  {replyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Gửi phản hồi
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
