'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle,
  XCircle,
  User,
  Filter,
  Search,
  Clock3,
  Award,
  ArrowRight,
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCheck,
  Ban,
  X,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { managerApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-hot-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import dayjs from 'dayjs';

const STATUS_CONFIG: Record<string, { label: string, variant: 'warning' | 'info' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Chờ xác nhận', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'info' },
  IN_PROGRESS: { label: 'Đang làm', variant: 'secondary' },
  DONE: { label: 'Xong dịch vụ', variant: 'info' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
};

export default function ManagerBookingsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filters
  const [status, setStatus] = useState<string>('ALL');
  const [staffId, setStaffId] = useState<string>('ALL');
  const [serviceId, setServiceId] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    timeSlot: '',
    staffId: ''
  });

  // Selection
  const [selectedBookings, setSelectedBookings] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Data
  const { data: staffData, error: staffError } = useQuery({
    queryKey: ['manager', 'staff', 'list-for-filter'],
    queryFn: () => managerApi.getStaff({ limit: 100 }),
    retry: 2,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['manager', 'services', 'list-for-filter'],
    queryFn: () => managerApi.getServices(),
    retry: 2,
  });



  const { data: bookings, isLoading } = useQuery({
    queryKey: ['manager', 'bookings', { status, staffId, serviceId, dateFrom, dateTo, search: debouncedSearch }],
    queryFn: () => managerApi.getBookings({
      status: status === 'ALL' ? undefined : status as any,
      staffId: staffId === 'ALL' ? undefined : staffId,
      serviceId: serviceId === 'ALL' ? undefined : serviceId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: debouncedSearch || undefined
    }),
  });

  // Services list
  const servicesList = useMemo(() => {
    if (!servicesData) return [];
    if (Array.isArray(servicesData)) return servicesData;
    if (Array.isArray(servicesData.data)) return servicesData.data;
    return [];
  }, [servicesData]);

  // Staff list — handle both array and paginated response shapes
  const staffList = useMemo(() => {
    if (!staffData) return [];
    if (Array.isArray(staffData)) return staffData;
    if (Array.isArray(staffData.data)) return staffData.data;
    return [];
  }, [staffData]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => managerApi.updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['manager', 'bookings'] });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: (status: string) => managerApi.bulkUpdateBookingStatus(selectedBookings.map(b => b.id), status),
    onSuccess: () => {
      toast.success(`Đã cập nhật ${selectedBookings.length} đặt lịch`);
      queryClient.invalidateQueries({ queryKey: ['manager', 'bookings'] });
      setSelectedBookings([]);
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (data: any) => managerApi.rescheduleBooking(selectedBooking.id, data),
    onSuccess: () => {
      toast.success('Đã dời lịch hẹn thành công');
      setIsRescheduleOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'bookings'] });
    },
    onError: () => toast.error('Không thể dời lịch. Vui lòng kiểm tra lại.')
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await managerApi.exportBookings({
        status: status === 'ALL' ? undefined : status,
        staffId: staffId === 'ALL' ? undefined : staffId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: debouncedSearch || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${dayjs().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Xuất file Excel thành công!');
    } catch {
      toast.error('Không thể xuất file. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => {
        // Only allow "select all" for PENDING rows
        const pendingRows = table.getRowModel().rows.filter(row => row.original.status === 'PENDING');
        const allPendingSelected = pendingRows.length > 0 && pendingRows.every(row => row.getIsSelected());
        const somePendingSelected = pendingRows.some(row => row.getIsSelected());

        return (
          <Checkbox
            checked={allPendingSelected ? true : somePendingSelected ? 'indeterminate' : false}
            onCheckedChange={(value) => {
              pendingRows.forEach(row => row.toggleSelected(!!value));
            }}
            aria-label="Select all pending"
            className="rounded border-slate-300 data-[state=checked]:bg-[#C8A97E] data-[state=checked]:border-[#C8A97E]"
          />
        );
      },
      cell: ({ row }) => {
        const isPending = row.original.status === 'PENDING';
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            disabled={!isPending}
            aria-label="Select row"
            className={`rounded border-slate-300 data-[state=checked]:bg-[#C8A97E] data-[state=checked]:border-[#C8A97E] ${!isPending ? 'opacity-30 cursor-not-allowed' : ''}`}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'bookingCode',
      header: 'Mã booking',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-primary">{row.getValue('bookingCode')}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Khách hàng',
      cell: ({ row }) => {
        const customer = row.original.customer;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={customer?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {customer?.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900 leading-none">{customer?.name}</span>
              <span className="text-xs text-slate-500 mt-1">{customer?.phone}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'staff',
      header: 'Stylist',
      cell: ({ row }) => {
        const staff = row.original.staff;
        return (
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <User className="w-3 h-3 text-slate-400" />
            <span className="font-medium">{staff?.user?.name || 'Chưa chỉ định'}</span>
          </div>
        );
      },
    },
    {
      id: 'service_info',
      header: 'Dịch vụ',
      cell: ({ row }) => {
        const services = row.original.services || [];
        return (
          <div className="text-xs text-slate-600 max-w-[200px] truncate text-left">
            {services.map((s: any) => s.service?.name).join(', ') || 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'date',
      header: 'Thời gian',
      cell: ({ row }) => {
        const date = row.original.date;
        const timeSlot = row.original.timeSlot;
        return (
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-700">{timeSlot}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalAmount',
      header: 'Tổng tiền',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">{formatPrice(row.getValue('totalAmount'))}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <StatusBadge status={row.getValue('status')} config={STATUS_CONFIG} />
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
                disabled={booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' || booking.status === 'CANCELLED'}
              >
                <CheckCircle className="w-4 h-4 mr-3 text-emerald-500" /> Xác nhận
              </DropdownMenuItem>
              <DropdownMenuItem
                className="font-medium text-xs uppercase"
                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'IN_PROGRESS' })}
                disabled={booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED' || booking.status === 'CANCELLED'}
              >
                <Clock3 className="w-4 h-4 mr-3 text-indigo-500" /> Bắt đầu làm
              </DropdownMenuItem>
              <DropdownMenuItem
                className="font-medium text-xs uppercase"
                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'DONE' })}
                disabled={booking.status === 'DONE' || booking.status === 'COMPLETED' || booking.status === 'CANCELLED'}
              >
                <Award className="w-4 h-4 mr-3 text-blue-500" /> Xong dịch vụ
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-medium text-xs uppercase text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'CANCELLED' })}
                disabled={booking.status === 'CANCELLED' || booking.status === 'COMPLETED'}
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading italic uppercase">QUẢN LÝ <span className="text-primary">LỊCH ĐẶT</span></h1>
          <p className="text-slate-500 text-sm">Giám sát và điều phối tất cả lịch đặt tại chi nhánh của bạn.</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          className="gap-2 rounded-xl px-5 h-10 border-slate-200 hover:bg-slate-50 font-medium"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          )}
          Xuất Excel
        </Button>
      </div>

      <Card className="border shadow-premium overflow-hidden bg-white rounded-2xl">
        <div className="p-4 bg-slate-50/50 space-y-4">
          {/* Row 1: Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                title="Status Filter"
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer font-medium"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(STATUS_CONFIG).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
            <select
              title="Staff Filter"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer font-medium"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              <option value="ALL">Tất cả nhân viên ({staffList.length})</option>
              {staffList.map((s: any) => (
                <option key={s.id} value={s.id}>{s.user?.name || s.name || `Staff ${s.id?.slice(0, 6)}`}</option>
              ))}
            </select>

            <select
              title="Service Filter"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer font-medium"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="ALL">Tất cả dịch vụ ({servicesList.length})</option>
              {servicesList.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                title="From date"
                className="h-10 rounded-xl"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-slate-400">→</span>
              <Input
                type="date"
                title="To date"
                className="h-10 rounded-xl"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Search */}
          <div className="relative group max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
        </div>

        {/* Bulk Action Bar - Redesigned */}
        {selectedBookings.length > 0 && (
          <div className="px-4 py-3 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-y border-amber-200/60 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-700">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-amber-900">
                    Đã chọn {selectedBookings.length} đơn chờ xác nhận
                  </span>
                  <span className="text-xs text-amber-600">
                    Chỉ các đơn &quot;Chờ xác nhận&quot; mới có thể thao tác hàng loạt
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4 font-bold rounded-lg gap-1.5 shadow-sm shadow-emerald-200 transition-all hover:shadow-md hover:shadow-emerald-200"
                  onClick={() => bulkStatusMutation.mutate('CONFIRMED')}
                  disabled={bulkStatusMutation.isPending}
                >
                  {bulkStatusMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Xác nhận tất cả
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 font-bold rounded-lg gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
                  onClick={() => bulkStatusMutation.mutate('CANCELLED')}
                  disabled={bulkStatusMutation.isPending}
                >
                  <Ban className="w-3.5 h-3.5" />
                  Hủy tất cả
                </Button>
                <div className="w-px h-6 bg-amber-200 mx-1" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 p-0 rounded-lg text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                  onClick={() => setSelectedBookings([])}
                  title="Bỏ chọn tất cả"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={bookings || []}
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
              Dời lịch <span className="text-primary">Hẹn</span>
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
                className="border-slate-100 bg-slate-50 h-10 rounded-xl font-bold focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Khung giờ</label>
              <Select
                value={rescheduleData.timeSlot}
                onValueChange={(val) => setRescheduleData({ ...rescheduleData, timeSlot: val })}
              >
                <SelectTrigger className="h-10 border-slate-100 bg-slate-50 rounded-xl font-bold focus:ring-primary/20">
                  <SelectValue placeholder="Chọn giờ phục vụ" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'].map((time) => (
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
                <SelectTrigger className="h-10 border-slate-100 bg-slate-50 rounded-xl font-bold focus:ring-primary/20">
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  {staffList.map((s: any) => (
                    <SelectItem key={s.id} value={s.id} className="font-bold">
                      {s.user?.name}
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
