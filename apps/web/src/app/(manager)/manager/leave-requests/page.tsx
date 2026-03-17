'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Search,
  CalendarDays,
} from 'lucide-react';
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
          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
            <AvatarImage src={row.original.staff?.user?.avatar} />
            <AvatarFallback className="bg-slate-100 text-slate-400 text-xs font-bold">{row.original.staff?.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-900 text-sm leading-tight">{row.original.staff?.user?.name}</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
               {row.original.staff?.position}
            </span>
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
          <div className="flex flex-col gap-0.5 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
               <CalendarDays className="w-3.5 h-3.5 text-[#7C3AED]" />
               {start.isSame(end, 'day') ? start.format('DD/MM/YYYY') : `${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')}`}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Gửi: {dayjs(row.original.createdAt).format('HH:mm DD/MM')}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'reason',
      header: 'Lý do',
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-xs text-slate-500 italic text-left">
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
                   className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg h-8 px-3 text-xs font-semibold shadow-sm transition-all"
                >
                   {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Duyệt'}
                </Button>
                <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => { setSelectedRequest(req); setIsRejectOpen(true); }}
                   className="border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg h-8 px-3 text-xs font-semibold transition-all"
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
                   className="hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg h-8 px-3 text-xs font-semibold transition-all"
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
           <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
           <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Đang tải yêu cầu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <Badge className="bg-[#7C3AED]/10 text-[#7C3AED] border-none mb-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Chi nhánh
           </Badge>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Duyệt <span className="text-[#7C3AED]">Nghỉ phép</span>
           </h1>
           <p className="text-slate-500 text-sm mt-1">Phê duyệt yêu cầu nghỉ phép của nhân viên tại chi nhánh.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
           <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
           <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              {requests?.filter((r: any) => r.status === 'PENDING').length || 0} Đơn chưa xử lý
           </span>
        </div>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#7C3AED] transition-colors" />
               <input
                 type="text"
                 placeholder="Tìm nhân viên..."
                 value={searchStaff}
                 onChange={(e) => setSearchStaff(e.target.value)}
                 className="w-full h-10 pl-9 pr-4 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/10 transition-all font-medium"
               />
            </div>

            {/* Date Filter */}
            <div className="md:col-span-2">
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: '#7C3AED',
                    borderRadius: 8,
                  },
                }}
              >
                <RangePicker 
                  className="w-full h-10 border-slate-200 bg-white rounded-lg shadow-none text-sm" 
                  placeholder={['Từ ngày', 'Đến ngày']}
                  format="DD/MM/YYYY"
                  onChange={(dates: any) => setDateRange(dates)}
                />
              </ConfigProvider>
            </div>

            {/* Status Filter */}
            <Tabs defaultValue="PENDING" onValueChange={setActiveTab} className="h-10">
              <TabsList className="bg-slate-100 p-1 rounded-lg h-full w-full">
                 <TabsTrigger value="ALL" className="flex-1 rounded-md px-3 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-[#7C3AED] shadow-none">TẤT CẢ</TabsTrigger>
                 <TabsTrigger value="PENDING" className="flex-1 rounded-md px-3 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-amber-500 shadow-none">CHỜ</TabsTrigger>
                 <TabsTrigger value="APPROVED" className="flex-1 rounded-md px-3 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-500 shadow-none">XONG</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="p-0">
          <DataTable
            columns={columns}
            data={filteredRequests}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Reject Reason Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
         <DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden bg-white rounded-2xl">
            <DialogHeader className="p-6 pb-0 text-left">
               <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  Từ chối yêu cầu
               </DialogTitle>
               <DialogDescription className="text-sm text-slate-500 pt-1">
                  Nhập lý do từ chối cho <span className="font-bold text-slate-900">{selectedRequest?.staff?.user?.name}</span>?
               </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4">
               <Textarea 
                 placeholder="Lý do từ chối..."
                 value={rejectReason}
                 onChange={(e) => setRejectReason(e.target.value)}
                 className="min-h-[100px] rounded-xl bg-slate-50 border-none focus-visible:ring-[#7C3AED]/20 font-medium p-3 text-sm"
               />
            </div>

            <DialogFooter className="p-6 pt-0 flex gap-2">
               <Button variant="ghost" onClick={() => setIsRejectOpen(false)} className="flex-1 rounded-xl text-xs font-bold uppercase text-slate-400">Hủy</Button>
               <Button 
                onClick={() => rejectMutation.mutate(selectedRequest.id)}
                disabled={rejectMutation.isPending || !rejectReason}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-10 text-xs font-bold shadow-sm"
               >
                  Xác nhận
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
