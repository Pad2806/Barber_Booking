'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  User,
  History,
  MoreVertical,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Loader2
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
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

export default function ManagerLeaveRequestsPage() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['manager', 'leave-requests'],
    queryFn: managerApi.getLeaveRequests,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => managerApi.approveLeave(id, { status: 'APPROVED' }),
    onSuccess: () => {
      toast.success('Đã duyệt đơn nghỉ phép');
      queryClient.invalidateQueries({ queryKey: ['manager', 'leave-requests'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể duyệt đơn. Có thể do đã có lịch hẹn.';
      toast.error(msg);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => managerApi.approveLeave(id, { status: 'REJECTED', reason: rejectReason }),
    onSuccess: () => {
      toast.success('Đã từ chối đơn nghỉ phép');
      setIsRejectOpen(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['manager', 'leave-requests'] });
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi từ chối đơn');
    }
  });

  const statusMap: any = {
    PENDING: { label: 'Đang chờ', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    REJECTED: { label: 'Từ chối', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle }
  };

  if (isLoading) {
    return (
      <div className="flex bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 items-center justify-center min-h-[600px] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Checking Leave Requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Staff <span className="text-[#C8A97E]">Absence</span>
           </h1>
           <p className="text-slate-500 font-medium">Xét duyệt và quản lý lịch nghỉ của đội ngũ nhân sự.</p>
        </div>
        <div className="flex items-center gap-3">
           <Badge className="bg-slate-900 text-[#C8A97E] font-black uppercase tracking-widest text-[10px] px-4 py-2 border-none h-12 rounded-2xl flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Branch Manager Approval Required
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests?.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 shadow-xl">
             <div className="p-8 rounded-full bg-slate-50 text-slate-200 mb-8 transform scale-125">
                <FileText className="w-16 h-16" />
             </div>
             <p className="text-slate-300 font-black italic uppercase text-lg tracking-tighter">Hiện không có đơn nghỉ phép nào cần xử lý</p>
          </div>
        ) : (
          requests?.map((req: any) => (
            <Card key={req.id} className={cn(
              "group border-none shadow-xl hover:shadow-2xl transition-all duration-700 rounded-[2rem] bg-white overflow-hidden relative",
              req.status === 'PENDING' && "ring-2 ring-amber-400/20 shadow-amber-900/5"
            )}>
               <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row items-stretch min-h-[160px]">
                     {/* Date Preview */}
                     <div className={cn(
                        "lg:w-48 p-8 flex lg:flex-col items-center justify-center lg:border-r border-slate-100 text-center gap-4 transition-colors duration-500",
                        req.status === 'PENDING' ? "bg-amber-50/50" : "bg-slate-50/50"
                     )}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Absence Date</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">{dayjs(req.date).format('DD MMM')}</h3>
                        <Badge className={cn("border-none px-4 py-1.5 font-black uppercase text-[9px] tracking-widest rounded-xl shadow-sm", statusMap[req.status].color)}>
                           {statusMap[req.status].label}
                        </Badge>
                     </div>

                     {/* Content */}
                     <div className="flex-1 p-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                           <Avatar className="h-20 w-20 border-4 border-white shadow-2xl relative">
                              <AvatarImage src={req.staff?.user?.avatar} />
                              <AvatarFallback className="bg-slate-100 text-slate-300 font-black italic text-xl">
                                 {req.staff?.user?.name?.charAt(0)}
                              </AvatarFallback>
                           </Avatar>
                           <div className="space-y-3">
                              <div>
                                 <h4 className="text-2xl font-black text-slate-900 italic tracking-tight">{req.staff?.user?.name}</h4>
                                 <p className="text-[10px] font-black text-[#C8A97E] uppercase tracking-widest mt-1">Staff ID: {req.staffId.slice(-6)}</p>
                              </div>
                              <div className="flex items-center gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed max-w-md">
                                 <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                 <p className="text-xs font-bold text-slate-500 italic leading-relaxed">
                                    {req.reason || '"Không có lý do chi tiết"'}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Control Actions (Only for Pending) */}
                        {req.status === 'PENDING' && (
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                             <Button 
                               onClick={() => approveMutation.mutate(req.id)}
                               disabled={approveMutation.isPending}
                               className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 px-8 font-black italic uppercase text-xs tracking-widest shadow-xl transition-all hover:scale-105"
                             >
                                {approveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-3 text-[#C8A97E]" />}
                                Approve Request
                             </Button>
                             <Button 
                               variant="outline"
                               onClick={() => {
                                  setSelectedRequest(req);
                                  setIsRejectOpen(true);
                               }}
                               className="w-full sm:w-auto border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl h-14 px-8 font-black italic uppercase text-xs tracking-widest transition-all"
                             >
                                <ShieldAlert className="w-5 h-5 mr-3" />
                                Reject
                             </Button>
                          </div>
                        )}

                        {/* Rejection Details Info */}
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 max-w-xs">
                             <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Manager Note</p>
                             <p className="text-xs font-bold text-rose-600 italic">&quot;{req.rejectionReason}&quot;</p>
                          </div>
                        )}
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reject Reason Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
         <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 pb-0">
               <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-rose-500">
                  Reject <span className="text-slate-900 underline decoration-rose-500/30">Request</span>
               </DialogTitle>
               <DialogDescription className="font-medium text-slate-500">
                  Vui lòng cung cấp lý do từ chối đơn nghỉ phép của <span className="font-black text-slate-900">{selectedRequest?.staff?.user?.name}</span>.
               </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-4">
               <Textarea 
                 placeholder="Lý do từ chối (Ví dụ: Chi tiết lịch hẹn trùng, Thiếu nhân sự...)"
                 value={rejectReason}
                 onChange={(e) => setRejectReason(e.target.value)}
                 className="min-h-[120px] rounded-2xl bg-rose-50/50 border-none focus-visible:ring-rose-200 font-medium p-4 text-slate-600 placeholder:text-rose-200"
               />
            </div>

            <DialogFooter className="p-8 pt-0 flex gap-3">
               <Button variant="ghost" onClick={() => setIsRejectOpen(false)} className="flex-1 rounded-2xl font-bold uppercase text-xs">Quay lại</Button>
               <Button 
                onClick={() => rejectMutation.mutate(selectedRequest.id)}
                disabled={rejectMutation.isPending || !rejectReason}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-12 font-black italic uppercase text-xs shadow-xl shadow-rose-500/20"
               >
                  Xác nhận từ chối
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
