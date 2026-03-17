'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  ShieldCheck,
  Loader2,
  Search,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
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
import { DatePicker, ConfigProvider } from 'antd';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { ColumnDef } from '@tanstack/react-table';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const STATUS_CONFIG: any = {
  PENDING: { label: 'Đang chờ', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'destructive' }
};

export default function ManagerLeaveRequestsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [searchStaff, setSearchStaff] = useState('');
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
      queryClient.invalidateQueries({ queryKey: ['manager', 'schedules'] });
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
      queryClient.invalidateQueries({ queryKey: ['manager', 'schedules'] });
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi từ chối đơn');
    }
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    return (requests as any[]).filter((req: any) => {
      const matchesStatus = activeTab === 'ALL' || req.status === activeTab;
      const staffName = req.staff?.user?.name?.toLowerCase() || '';
      const matchesSearch = !searchStaff || staffName.includes(searchStaff.toLowerCase());
      
      let matchesDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const start = dateRange[0].startOf('day');
        const end = dateRange[1].endOf('day');
        const reqStart = dayjs(req.startDate);
        const reqEnd = dayjs(req.endDate);
        
        matchesDate = (reqStart.isBetween(start, end, 'day', '[]') || 
                      reqEnd.isBetween(start, end, 'day', '[]') ||
                      (reqStart.isBefore(start) && reqEnd.isAfter(end)));
      }
      
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [requests, activeTab, searchStaff, dateRange]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'staff',
      header: 'Nhân viên',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white shadow-md">
            <AvatarImage src={row.original.staff?.user?.avatar} />
            <AvatarFallback className="bg-slate-100 text-slate-300 font-black italic">{row.original.staff?.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left">
            <span className="font-black text-slate-900 leading-none uppercase italic text-xs tracking-tight">{row.original.staff?.user?.name}</span>
            <Badge className="bg-[#C8A97E]/10 text-[#C8A97E] border-none text-[8px] px-2 py-0 h-4 font-black tracking-widest uppercase mt-1 w-fit">
               {row.original.staff?.position}
            </Badge>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'dateRange',
      header: 'Thời gian nghỉ',
      cell: ({ row }) => {
        const start = dayjs(row.original.startDate);
        const end = dayjs(row.original.endDate);
        return (
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 italic">
               <CalendarDays className="w-3.5 h-3.5 text-[#C8A97E]" />
               {start.isSame(end, 'day') ? start.format('DD/MM/YYYY') : `${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')}`}
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dayjs(row.original.createdAt).format('[Gửi lúc:] HH:mm DD/MM')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'reason',
      header: 'Lý do',
      cell: ({ row }) => (
        <div className="max-w-[250px] truncate text-xs font-bold text-slate-500 italic text-left">
          &quot;{row.original.reason || "Không có lý do"}&quot;
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <StatusBadge status={row.original.status} config={STATUS_CONFIG} />
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            {req.status === 'PENDING' ? (
              <>
                <Button 
                   size="sm" 
                   onClick={() => approveMutation.mutate(req.id)}
                   disabled={approveMutation.isPending}
                   className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-9 px-4 font-black italic uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all text-center"
                >
                   {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Duyệt'}
                </Button>
                <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => { setSelectedRequest(req); setIsRejectOpen(true); }}
                   className="border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl h-9 px-4 font-black italic uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                >
                   Từ chối
                </Button>
              </>
            ) : req.status === 'APPROVED' ? (
                <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => {
                     if(confirm('Bạn có chắc muốn hủy duyệt đơn này?')) rejectMutation.mutate(req.id);
                   }}
                   disabled={rejectMutation.isPending}
                   className="hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl h-9 px-4 font-black italic uppercase text-[10px] tracking-widest transition-all"
                >
                   Hủy duyệt
                </Button>
            ) : null}
          </div>
        );
      }
    }
  ], [approveMutation, rejectMutation]);

  if (isLoading) {
    return (
      <div className="flex bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 items-center justify-center min-h-[600px] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Đang kiểm tra yêu cầu nghỉ phép...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div>
           <Badge className="bg-[#C8A97E]/10 text-[#C8A97E] border-none mb-4 px-3 py-1 font-bold text-[9px] uppercase tracking-[0.2em] rounded-lg">
              Trình quản lý chi nhánh
           </Badge>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic uppercase">
              DUYỆT <span className="text-[#C8A97E]">NGHỈ PHÉP</span>
           </h1>
           <p className="text-slate-500 mt-1">Quản lý và phê duyệt các yêu cầu nghỉ phép của nhân viên.</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
           <div className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#C8A97E]" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                 {requests?.filter((r: any) => r.status === 'PENDING').length || 0} Đơn đang chờ
              </span>
           </div>
        </div>
      </div>

      <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C8A97E] transition-colors" />
               <input
                 type="text"
                 placeholder="Tìm nhân viên..."
                 value={searchStaff}
                 onChange={(e) => setSearchStaff(e.target.value)}
                 className="w-full h-11 pl-9 pr-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium"
               />
            </div>

            {/* Date Filter */}
            <div className="lg:col-span-2">
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: '#C8A97E',
                    borderRadius: 12,
                  },
                }}
              >
                <RangePicker 
                  className="w-full h-11 border-slate-200 bg-white rounded-xl shadow-none font-bold text-slate-600" 
                  placeholder={['Từ ngày', 'Đến ngày']}
                  format="DD/MM/YYYY"
                  onChange={(dates: any) => setDateRange(dates)}
                />
              </ConfigProvider>
            </div>

            {/* Status Filter */}
            <Tabs defaultValue="PENDING" onValueChange={setActiveTab} className="h-11">
              <TabsList className="bg-slate-900/5 p-1 rounded-xl h-full border-none w-full">
                 <TabsTrigger value="ALL" className="flex-1 rounded-lg px-3 font-black italic uppercase text-[8px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white h-full transition-all">TẤT CẢ</TabsTrigger>
                 <TabsTrigger value="PENDING" className="flex-1 rounded-lg px-3 font-black italic uppercase text-[8px] tracking-widest data-[state=active]:bg-amber-400 data-[state=active]:text-white h-full transition-all">CHỜ</TabsTrigger>
                 <TabsTrigger value="APPROVED" className="flex-1 rounded-lg px-3 font-black italic uppercase text-[8px] tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-white h-full transition-all">XONG</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <CardContent className="p-0 sm:p-6 sm:pt-4">
          <DataTable
            columns={columns}
            data={filteredRequests}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Reject Reason Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
         <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-premium p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 pb-0 text-left">
               <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-rose-500">
                  Từ chối <span className="text-slate-900">yêu cầu</span>
               </DialogTitle>
               <DialogDescription className="font-medium text-slate-500 pt-2 text-sm leading-relaxed">
                  Vui lòng nhập lý do từ chối cho nhân viên <span className="font-black text-slate-900">{selectedRequest?.staff?.user?.name}</span>?
               </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-4">
               <Textarea 
                 placeholder="Lý do từ chối..."
                 value={rejectReason}
                 onChange={(e) => setRejectReason(e.target.value)}
                 className="min-h-[120px] rounded-2xl bg-rose-50/50 border-none focus-visible:ring-rose-200 font-medium p-4 text-slate-600 placeholder:text-rose-200"
               />
            </div>

            <DialogFooter className="p-8 pt-0 flex gap-3">
               <Button variant="ghost" onClick={() => setIsRejectOpen(false)} className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest">Hủy</Button>
               <Button 
                onClick={() => rejectMutation.mutate(selectedRequest.id)}
                disabled={rejectMutation.isPending || !rejectReason}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-11 font-black italic uppercase text-xs shadow-xl transition-all"
               >
                  Xác nhận từ chối
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
