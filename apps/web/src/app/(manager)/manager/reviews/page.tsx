'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  Star, 
  MessageSquare, 
  Reply, 
  MoreVertical, 
  User, 
  Scissors, 
  Calendar, 
  ThumbsUp, 
  Trash2, 
  Flag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Quote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

export default function ManagerReviewsPage() {
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  const { data: reviews, isLoading } = useQuery({
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
    onError: () => {
      toast.error('Không thể gửi phản hồi. Vui lòng thử lại.');
    }
  });

  if (isLoading) {
    return (
      <div className="flex bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 items-center justify-center min-h-[600px] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Customer Feedback...</p>
        </div>
      </div>
    );
  }

  const averageRating = reviews?.length > 0 
    ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-10 pb-20">
      {/* Overview Dashboard for Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <Card className="lg:col-span-1 border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C8A97E]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <Star className="w-16 h-16 text-[#C8A97E] mb-4 fill-[#C8A97E] drop-shadow-[0_0_15px_rgba(200,169,126,0.5)]" />
            <h2 className="text-6xl font-black italic tracking-tighter mb-2">{averageRating}</h2>
            <p className="text-[10px] font-black uppercase text-[#C8A97E] tracking-widest italic mb-6">Average Branch Rating</p>
            <div className="flex gap-1">
               {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={cn("w-3 h-3 transition-colors", Number(averageRating) >= i ? "text-[#C8A97E] fill-[#C8A97E]" : "text-slate-700")} />
               ))}
            </div>
         </Card>

         <Card className="lg:col-span-3 border-none shadow-xl rounded-[2.5rem] bg-white p-10 flex flex-col justify-between">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
                     Phản hồi từ <span className="text-[#C8A97E]">Khách hàng</span>
                  </h3>
                  <p className="text-slate-500 font-medium italic">Gắng nghe và phản hồi kịp thời để nâng cao chất lượng dịch vụ.</p>
               </div>
               <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 shadow-inner">
                  <div className="flex flex-col text-right">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Growth Trend</span>
                     <div className="flex items-center gap-2 text-emerald-500 font-black italic tracking-tight">
                        <TrendingUp className="w-4 h-4" />
                        <span>+12.4% vs last month</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar pb-2">
               {['All Reviews', '5 Stars', 'Critical', 'Unanswered'].map((filter, i) => (
                  <Button 
                    key={i} 
                    variant={i === 0 ? 'default' : 'outline'} 
                    className={cn(
                      "rounded-2xl font-black uppercase text-[10px] tracking-widest h-12 px-6 shadow-sm border-slate-100 transition-all",
                      i === 0 ? "bg-[#C8A97E] hover:bg-[#B8975E] text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                     {filter}
                  </Button>
               ))}
            </div>
         </Card>
      </div>

      {/* Reviews ListView */}
      <div className="grid grid-cols-1 gap-6">
        {reviews?.map((review: any) => (
          <Card key={review.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden">
             <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                   {/* Sentiment Side */}
                   <div className={cn(
                      "lg:w-72 p-10 flex flex-col items-center justify-center lg:border-r border-slate-50 text-center transition-colors duration-500",
                      review.rating >= 4 ? "bg-emerald-50/20" : "bg-rose-50/20"
                   )}>
                      <div className="relative mb-6">
                         <Avatar className="h-24 w-24 border-8 border-white shadow-2xl transform group-hover:scale-105 transition-transform duration-700">
                            <AvatarImage src={review.customer?.avatar} />
                            <AvatarFallback className="bg-[#C8A97E] text-white font-black italic text-3xl">
                               {review.customerName?.charAt(0) || 'C'}
                            </AvatarFallback>
                         </Avatar>
                         <div className={cn(
                           "absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white",
                           review.rating >= 4 ? "bg-emerald-500" : "bg-rose-500"
                         )}>
                            <Star className="w-4 h-4 fill-white" />
                         </div>
                      </div>
                      <h4 className="text-xl font-black italic tracking-tighter text-slate-900 line-clamp-1">{review.customerName}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E] mt-2 italic">{dayjs(review.createdAt).format('DD MMMM, YYYY')}</p>
                   </div>

                   {/* Content Side */}
                   <div className="flex-1 p-10 flex flex-col justify-between gap-8 relative overflow-hidden">
                      <div className="absolute top-8 right-8 text-slate-100 opacity-20 pointer-events-none transform scale-x-[-1]">
                         <Quote className="w-20 h-20" />
                      </div>

                      <div className="space-y-6 relative z-10">
                         {/* Stars Rating */}
                         <div className="flex gap-1 bg-slate-50 p-2 rounded-xl w-fit">
                            {[1, 2, 3, 4, 5].map((i) => (
                               <Star key={i} className={cn("w-4 h-4 transition-all", review.rating >= i ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                            ))}
                         </div>

                         {/* Review Comment */}
                         <p className="text-slate-600 text-lg font-bold italic leading-relaxed tracking-tight">
                            "{review.comment}"
                         </p>

                         {/* Context Info */}
                         <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-slate-900/10">
                               <Scissors className="w-3.5 h-3.5 text-[#C8A97E]" />
                               {review.barberName || 'General Service'}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest italic text-slate-400">
                               <Calendar className="w-3.5 h-3.5" />
                               ID: {review.id.slice(-6)}
                            </div>
                         </div>
                      </div>

                      {/* Reply Section */}
                      <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                         {review.reply ? (
                            <div className="flex-1 bg-slate-900 p-6 rounded-[2rem] border border-slate-800 relative group/reply overflow-hidden">
                               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover/reply:rotate-12 transition-transform duration-1000">
                                  <Reply className="w-16 h-16 text-white" />
                               </div>
                               <p className="text-[10px] font-black uppercase text-[#C8A97E] tracking-widest mb-2 flex items-center gap-2">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Branch Manager Reply
                               </p>
                               <p className="text-white text-sm font-bold italic leading-relaxed">
                                  {review.reply}
                               </p>
                            </div>
                         ) : (
                            <div className="flex-1 flex items-center gap-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                               <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-300">
                                  <AlertCircle className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="text-xs font-black italic text-slate-400">No response yet. Engaging with feedback improves retention by 42%.</p>
                                  <Button 
                                    variant="link" 
                                    onClick={() => {
                                       setSelectedReview(review);
                                       setIsReplyOpen(true);
                                    }}
                                    className="p-0 h-auto text-[#C8A97E] font-black uppercase text-[10px] tracking-widest italic underline decoration-[#C8A97E]/30 mt-1 hover:text-slate-900"
                                  >
                                     Xử lý phản hồi ngay
                                  </Button>
                               </div>
                            </div>
                         )}

                         <div className="flex items-center gap-2">
                            <Button variant="outline" className="rounded-xl border-slate-100 h-10 w-10 p-0 text-slate-400 hover:bg-slate-50">
                               <Flag className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => {
                                 setSelectedReview(review);
                                 setReplyText(review.reply || '');
                                 setIsReplyOpen(true);
                              }}
                              className="rounded-[1.25rem] bg-slate-900 border-slate-900 text-white font-black italic uppercase text-[10px] px-8 h-12 shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                               {review.reply ? 'Chỉnh sửa phản hồi' : 'Gửi phản hồi'}
                               <ChevronRight className="w-4 h-4 ml-2 text-[#C8A97E]" />
                            </Button>
                         </div>
                      </div>
                   </div>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Reply Modal */}
      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
         <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-10 pb-0">
               <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
                  Compose <span className="text-[#C8A97E]">Reply</span>
               </DialogTitle>
               <DialogDescription className="font-medium text-slate-500 italic mt-2">
                  Phản hồi đánh giá của khách hàng <span className="font-black text-slate-900">{selectedReview?.customerName}</span>.
               </DialogDescription>
            </DialogHeader>

            <div className="p-10 space-y-8">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-2 right-4 text-slate-200 opacity-50">
                     <Quote className="w-10 h-10" />
                  </div>
                  <div className="flex gap-1 mb-3">
                     {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={cn("w-3 h-3", selectedReview?.rating >= i ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                     ))}
                  </div>
                  <p className="text-xs font-bold text-slate-400 italic">"{selectedReview?.comment}"</p>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E] flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Nội dung phản hồi
                     </label>
                     <span className={cn("text-[9px] font-black uppercase text-slate-300 lg:block hidden tracking-tight")}>
                        {replyText.length} / 500 characters
                     </span>
                  </div>
                  <Textarea 
                    placeholder="Viết phản hồi thân thiện, chuyên nghiệp..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[180px] rounded-[2rem] bg-slate-50 border-none focus-visible:ring-[#C8A97E]/20 p-6 font-bold text-slate-700 italic placeholder:text-slate-200 shadow-inner"
                  />
               </div>
            </div>

            <DialogFooter className="p-10 pt-0 flex gap-4">
               <Button variant="ghost" onClick={() => setIsReplyOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest italic">Hủy bỏ</Button>
               <Button 
                onClick={() => replyMutation.mutate({ id: selectedReview.id, reply: replyText })}
                disabled={replyMutation.isPending || !replyText}
                className="flex-[1.5] bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-black italic uppercase text-xs tracking-widest shadow-2xl shadow-slate-900/20"
               >
                  {replyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-3 text-[#C8A97E]" /> : <Reply className="w-5 h-5 mr-3 text-[#C8A97E]" />}
                  Upload Response
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
