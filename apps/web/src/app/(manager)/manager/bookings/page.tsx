'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
  import { 
  Search, 
  Calendar, 
  Clock, 
  MoreVertical, 
  CheckCircle,
  XCircle,
  Clock3,
  Filter,
  Award,
  ArrowRight
} from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { formatPrice, formatDate } from '@/lib/utils';
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { ColumnDef } from '@tanstack/react-table';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_CONFIG: Record<string, { label: string, variant: 'warning' | 'info' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Chờ xác nhận', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'info' },
  IN_PROGRESS: { label: 'Đang làm', variant: 'secondary' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
};

export default function ManagerBookingsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<any[]>([]);

  // Reschedule state
  const [rescheduleData, setRescheduleData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    timeSlot: '',
    staffId: ''
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['manager', 'bookings', { status: statusFilter, date: dateFilter, search: searchTerm }],
    queryFn: () => managerApi.getBookings({ 
        status: statusFilter === 'ALL' ? undefined : statusFilter as any, 
        date: dateFilter,
        search: searchTerm
    }),
  });

  const { data: staff } = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: managerApi.getStaff,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => 
      managerApi.updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['manager', 'bookings'] });
    },
    onError: () => toast.error('Không thể cập nhật trạng thái')
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: (status: BookingStatus) => 
      managerApi.bulkUpdateBookingStatus(selectedBookings.map(b => b.id), status),
    onSuccess: () => {
      toast.success(`Đã cập nhật ${selectedBookings.length} lịch đặt`);
      setSelectedBookings([]);
      queryClient.invalidateQueries({ queryKey: ['manager', 'bookings'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật hàng loạt')
  });

  const rescheduleMutation = useMutation({
    mutationFn: (data: any) => managerApi.rescheduleBooking(selectedBooking.id, data),
    onSuccess: () => {
      toast.success('Đã dời lịch hẹn thành công');
      setIsRescheduleOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'bookings'] });
    },
    onError: () => {
      toast.error('Không thể dời lịch. Vui lòng kiểm tra lại.');
    }
  });

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'bookingCode',
      header: 'Mã booking',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-primary">{row.original.bookingCode || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Khách hàng',
      cell: ({ row }) => {
        const booking = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {booking.customerName?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900 leading-none">{booking.customerName}</span>
              <span className="text-xs text-slate-500 mt-1">{booking.customerPhone}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'services',
      header: 'Dịch vụ',
      cell: ({ row }) => {
        const services = row.original.services || [];
        return (
          <div className="text-xs text-slate-600 max-w-[200px] truncate text-left">
            {services.map((s: any) => s.name).join(', ') || 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'staff',
      header: 'Barber',
      cell: ({ row }) => {
        const staffMember = row.original.staff;
        return (
          <div className="flex items-center gap-2 text-left">
             <Avatar className="h-6 w-6 border">
                <AvatarImage src={staffMember?.user?.avatar} />
                <AvatarFallback className="text-[10px]">{staffMember?.user?.name?.charAt(0)}</AvatarFallback>
             </Avatar>
             <span className="text-xs font-medium text-slate-700">{staffMember?.user?.name || 'Chưa chỉ định'}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'timeSlot',
      header: 'Thời gian',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(row.original.date)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{row.original.timeSlot}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Tổng tiền',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">{formatPrice(row.original.totalAmount || 0)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} config={STATUS_CONFIG} />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const booking = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
              <DropdownMenuItem 
                className="font-medium text-xs uppercase"
                onClick={() => {
                  setSelectedBooking(booking);
                  setRescheduleData({
                    date: dayjs(booking.date).format('YYYY-MM-DD'),
                    timeSlot: booking.timeSlot,
                    staffId: booking.staffId
                  });
                  setIsRescheduleOpen(true);
                }}
              >
                <Calendar className="w-4 h-4 mr-3 text-primary" /> Dời lịch hẹn
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="font-medium text-xs uppercase"
                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'CONFIRMED' })}
                disabled={booking.status === 'CONFIRMED'}
              >
                <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" /> Xác nhận
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="font-medium text-xs uppercase"
                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'IN_PROGRESS' })}
                disabled={booking.status === 'IN_PROGRESS'}
              >
                <Clock3 className="w-4 h-4 mr-3 text-indigo-500" /> Bắt đầu làm
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="font-medium text-xs uppercase"
                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'COMPLETED' })}
              >
                <Award className="w-4 h-4 mr-3 text-blue-500" /> Hoàn thành
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="font-medium text-xs uppercase text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'CANCELLED' })}
              >
                <XCircle className="w-4 h-4 mr-3" /> Hủy đặt lịch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [updateStatusMutation]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic uppercase">BRANCH <span className="text-[#C8A97E]">AGENDA</span></h1>
          <p className="text-slate-500 mt-1">Giám sát và điều phối tất cả lịch đặt tại chi nhánh của bạn.</p>
        </div>
      </div>

      <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm">
        <div className="p-4 border-b bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C8A97E] transition-colors" />
              <input
                type="text"
                placeholder="Tìm khách hàng / Mã booking..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                title="Status Filter"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A97E]/20 appearance-none cursor-pointer font-medium"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(STATUS_CONFIG).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>

            <Input
              type="date"
              title="Date Filter"
              className="h-10 rounded-xl"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            <div className="flex items-center gap-2">
               <Badge variant="outline" className="h-10 px-4 border-slate-200 bg-white font-bold text-slate-600 w-full justify-center rounded-xl">
                 {bookings?.length || 0} lịch đặt
               </Badge>
            </div>
          </div>
        </div>

        {selectedBookings.length > 0 && (
          <div className="p-3 bg-[#C8A97E]/5 border-b flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <span className="text-sm font-medium text-[#C8A97E] ml-3 font-bold">
               Đã chọn {selectedBookings.length} booking
            </span>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 h-8 rounded-lg"
                onClick={() => bulkUpdateStatusMutation.mutate('CONFIRMED')}
                disabled={bulkUpdateStatusMutation.isPending}
              >
                 <CheckCircle className="w-4 h-4 mr-1.5" /> Xác nhận
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                className="h-8 rounded-lg"
                onClick={() => bulkUpdateStatusMutation.mutate('CANCELLED')}
                disabled={bulkUpdateStatusMutation.isPending}
              >
                 <XCircle className="w-4 h-4 mr-1.5" /> Hủy hàng loạt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setSelectedBookings([])}
              >
                Hủy chọn
              </Button>
            </div>
          </div>
        )}

        <CardContent className="px-0 sm:px-6 py-6">
          <DataTable
            columns={columns}
            data={bookings || []}
            searchKey="customerName"
            loading={isLoading}
            onRowSelectionChange={setSelectedBookings}
          />
        </CardContent>
      </Card>

      {/* Reschedule Modal */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
         <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-premium p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 pb-0">
               <DialogTitle className="text-2xl font-bold font-heading italic uppercase tracking-tighter">
                  Dời lịch <span className="text-[#C8A97E]">Hẹn</span>
               </DialogTitle>
               <DialogDescription className="font-medium text-slate-500">
                  Thay đổi ngày hoặc khung giờ phục vụ cho khách hàng.
               </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Chọn ngày mới</label>
                  <Input 
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    className="border-slate-100 bg-slate-50 h-10 rounded-xl font-bold focus-visible:ring-[#C8A97E]/20"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Khung giờ</label>
                  <Select 
                    value={rescheduleData.timeSlot} 
                    onValueChange={(val) => setRescheduleData({ ...rescheduleData, timeSlot: val })}
                  >
                     <SelectTrigger className="h-10 border-slate-100 bg-slate-50 rounded-xl font-bold focus:ring-[#C8A97E]/20">
                        <SelectValue placeholder="Chọn giờ phục vụ" />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-slate-100">
                        {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((time) => (
                          <SelectItem key={time} value={time} className="font-bold">{time}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nhân viên phục vụ</label>
                  <Select 
                    value={rescheduleData.staffId} 
                    onValueChange={(val) => setRescheduleData({ ...rescheduleData, staffId: val })}
                  >
                     <SelectTrigger className="h-10 border-slate-100 bg-slate-50 rounded-xl font-bold focus:ring-[#C8A97E]/20">
                        <SelectValue placeholder="Chọn nhân viên" />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-slate-100">
                        {staff?.map((s: any) => (
                           <SelectItem key={s.id} value={s.id} className="font-bold">
                              {s.name}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            </div>

            <DialogFooter className="p-8 pt-0 flex gap-3">
               <Button variant="outline" onClick={() => setIsRescheduleOpen(false)} className="flex-1 h-10 rounded-xl font-bold uppercase text-xs">Quay lại</Button>
               <Button 
                onClick={() => rescheduleMutation.mutate(rescheduleData)}
                disabled={rescheduleMutation.isPending}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 font-bold uppercase text-xs shadow-xl"
               >
                  {rescheduleMutation.isPending ? 'Đang lưu...' : 'Cập nhật lịch'}
                  <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
