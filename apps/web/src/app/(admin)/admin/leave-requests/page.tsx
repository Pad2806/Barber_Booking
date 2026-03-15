'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, salonApi } from '@/lib/api';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText,
  CalendarDays,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Store
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { cn } from '@/lib/utils';
import { DatePicker, Input, ConfigProvider, Select } from 'antd';
import { Search, Filter } from 'lucide-react';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

export default function AdminLeaveRequestsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [searchStaff, setSearchStaff] = useState('');
  const [selectedSalon, setSelectedSalon] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin', 'leave-requests'],
    queryFn: () => adminApi.getGlobalLeaveRequests(),
  });

  const { data: salons } = useQuery({
    queryKey: ['salons'],
    queryFn: () => salonApi.getAll(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveGlobalLeave(id, { status: 'APPROVED' }),
    onSuccess: () => {
      toast.success('Đã duyệt đơn nghỉ phép');
      queryClient.invalidateQueries({ queryKey: ['admin', 'leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể duyệt đơn. Có thể do đã có lịch hẹn.';
      toast.error(msg);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveGlobalLeave(id, { status: 'REJECTED', reason: rejectReason }),
    onSuccess: () => {
      toast.success('Đã từ chối đơn nghỉ phép');
      setIsRejectOpen(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi từ chối đơn');
    }
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    return requests.filter((req: any) => {
      // 1. Filter by Status Tab
      const matchesStatus = activeTab === 'ALL' || req.status === activeTab;
      
      // 2. Filter by Search Text
      const staffName = req.staff?.user?.name?.toLowerCase() || '';
      const matchesSearch = !searchStaff || staffName.includes(searchStaff.toLowerCase());
      
      // 3. Filter by Salon
      const matchesSalon = selectedSalon === 'ALL' || req.staff?.salonId === selectedSalon;

      // 4. Filter by Date Range
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const start = dateRange[0].startOf('day');
        const end = dateRange[1].endOf('day');
        const reqStart = dayjs(req.startDate);
        const reqEnd = dayjs(req.endDate);
        
        // Match if requested range overlaps with filter range
        matchesDate = (reqStart.isBetween(start, end, 'day', '[]') || 
                      reqEnd.isBetween(start, end, 'day', '[]') ||
                      (reqStart.isBefore(start) && reqEnd.isAfter(end)));
      }
      
      return matchesStatus && matchesSearch && matchesDate && matchesSalon;
    });
  }, [requests, activeTab, searchStaff, dateRange, selectedSalon]);

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div>
           <Badge className="bg-[#C8A97E]/10 text-[#C8A97E] border-none mb-4 px-3 py-1 font-bold text-[9px] uppercase tracking-[0.2em] rounded-lg">
              Admin Control Panel
           </Badge>
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-tight">
              Global <span className="text-[#C8A97E]">Leave</span><br/>
              <span className="text-slate-300">Management</span>
           </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#C8A97E]" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                 {requests?.filter((r: any) => r.status === 'PENDING').length || 0} Pending Requests
              </span>
           </div>
           <p className="text-[10px] font-bold text-slate-400 italic">Cập nhật lúc {dayjs().format('HH:mm DD/MM')}</p>
        </div>
      </div>

      {/* Filter Bar - Modern Glassmorphism */}
      <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2.5rem] p-4 shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row gap-4 sticky top-4 z-40">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#C8A97E] transition-colors" />
            <Input 
               placeholder="Tìm kiếm theo tên nhân viên..." 
               className="w-full h-14 pl-16 rounded-[1.8rem] border-slate-100 hover:border-[#C8A97E]/30 focus:border-[#C8A97E] bg-slate-50/50 font-medium text-slate-700 placeholder:text-slate-300 transition-all shadow-inner"
               value={searchStaff}
               onChange={(e) => setSearchStaff(e.target.value)}
            />
         </div>
         
         <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            {/* Salon Filter */}
            <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-[1.8rem] px-6 h-14 group hover:border-[#C8A97E]/30 transition-all">
               <Store className="w-4 h-4 text-slate-300 group-hover:text-[#C8A97E] transition-colors" />
               <Select
                  defaultValue="ALL"
                  onChange={setSelectedSalon}
                  className="w-40 border-none bg-transparent hover:bg-transparent focus:bg-transparent shadow-none font-bold text-slate-700"
                  bordered={false}
                  options={[
                    { label: 'Tất cả Chi nhánh', value: 'ALL' },
                    ...(salons?.data.map((s: any) => ({ label: s.name, value: s.id })) || [])
                  ]}
               />
            </div>

            <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-[1.8rem] px-6 h-14 group hover:border-[#C8A97E]/30 transition-all">
               <Filter className="w-4 h-4 text-slate-300 group-hover:text-[#C8A97E] transition-colors" />
               <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: '#C8A97E',
                      borderRadius: 16,
                    },
                  }}
               >
                  <RangePicker 
                    className="border-none bg-transparent hover:bg-transparent focus:bg-transparent shadow-none font-bold text-slate-700" 
                    placeholder={['Từ ngày', 'Đến ngày']}
                    format="DD/MM/YYYY"
                    onChange={(dates: any) => setDateRange(dates)}
                  />
               </ConfigProvider>
            </div>
            
            <Tabs defaultValue="ALL" onValueChange={setActiveTab} className="h-14">
              <TabsList className="bg-slate-900/5 p-1 rounded-[1.8rem] h-full border-none">
                 <TabsTrigger value="ALL" className="rounded-[1.4rem] px-6 font-black italic uppercase text-[9px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white h-full transition-all">TẤT CẢ</TabsTrigger>
                 <TabsTrigger value="PENDING" className="rounded-[1.4rem] px-6 font-black italic uppercase text-[9px] tracking-widest data-[state=active]:bg-amber-400 data-[state=active]:text-white h-full transition-all">CHỜ DUYỆT</TabsTrigger>
                 <TabsTrigger value="APPROVED" className="rounded-[1.4rem] px-6 font-black italic uppercase text-[9px] tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-white h-full transition-all">ĐÃ DUYỆT</TabsTrigger>
              </TabsList>
            </Tabs>
         </div>
      </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredRequests?.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 shadow-xl">
               <div className="p-8 rounded-full bg-slate-50 text-slate-200 mb-8 transform scale-125">
                  <FileText className="w-16 h-16" />
               </div>
                <p className="text-slate-300 font-black italic uppercase text-lg tracking-tighter">
                   {searchStaff || dateRange || selectedSalon !== 'ALL'
                     ? "Không tìm thấy kết quả khớp với bộ lọc" 
                     : "Hiện không có đơn nghỉ phép nào"}
                </p>
            </div>
          ) : (
            filteredRequests?.map((req: any) => (
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
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter italic whitespace-nowrap">
                           {dayjs(req.startDate).isSame(dayjs(req.endDate), 'day') 
                             ? dayjs(req.startDate).format('DD MMM') 
                             : `${dayjs(req.startDate).format('DD/MM')} - ${dayjs(req.endDate).format('DD/MM')}`}
                        </h3>
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
                              <div className="flex flex-col">
                                 <h4 className="text-2xl font-black text-slate-900 italic tracking-tight">{req.staff?.user?.name}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                    <Store className="w-3 h-3 text-[#C8A97E]" />
                                    <p className="text-[10px] font-black text-[#C8A97E] uppercase tracking-widest">{req.staff?.salon?.name}</p>
                                 </div>
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
                         {req.status === 'PENDING' ? (
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
                         ) : req.status === 'APPROVED' ? (
                           <Button 
                             variant="outline"
                             onClick={() => rejectMutation.mutate(req.id)}
                             disabled={rejectMutation.isPending}
                             className="w-full sm:w-auto border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-200 rounded-2xl h-14 px-8 font-black italic uppercase text-xs tracking-widest transition-all"
                           >
                              <XCircle className="w-5 h-5 mr-3" />
                              Hủy Duyệt
                           </Button>
                         ) : null}

                        {/* Rejection Details Info */}
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 max-w-xs">
                             <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Admin Note</p>
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
               <DialogHeader className="font-medium text-slate-500 pt-2">
                  Vui lòng cung cấp lý do từ chối đơn nghỉ phép của <span className="font-black text-slate-900">{selectedRequest?.staff?.user?.name}</span>.
               </DialogHeader>
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
