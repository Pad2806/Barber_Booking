'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  User,
  MapPin,
  Download,
  Filter,
  Trash2,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { adminApi, Booking } from '@/lib/api';
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
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/admin/error-state';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-hot-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const STATUS_CONFIG: Record<string, { label: string, variant: 'warning' | 'info' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Chờ xác nhận', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'info' },
  IN_PROGRESS: { label: 'Đang làm', variant: 'secondary' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
  NO_SHOW: { label: 'Vắng mặt', variant: 'outline' },
};

export default function AdminBookingsPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  // Filters
  const [status, setStatus] = useState<string>('');
  const [salonId, setSalonId] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [search] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selection
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Data
  const { data: salonsData } = useQuery({
    queryKey: ['admin', 'salons', 'list'],
    queryFn: () => adminApi.getAllSalons({ limit: 100 }),
  });

  const { data: staffData } = useQuery({
    queryKey: ['admin', 'staff', 'list', salonId],
    queryFn: () => adminApi.getAllStaff({ limit: 100, salonId: salonId || undefined }),
  });

  const { data: servicesData } = useQuery({
    queryKey: ['admin', 'services', 'list', salonId],
    queryFn: () => adminApi.getAllServices({ limit: 100, salonId: salonId || undefined }),
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'bookings', { page, limit, status, salonId, staffId, serviceId, dateFrom, dateTo, search: debouncedSearch }],
    queryFn: () => adminApi.getAllBookings({ 
      page, 
      limit, 
      status: status || undefined, 
      salonId: salonId || undefined, 
      staffId: staffId || undefined,
      serviceId: serviceId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: debouncedSearch || undefined,
    }),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => adminApi.updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[], status: string }) => adminApi.bulkUpdateBookingStatus(ids, status),
    onSuccess: (res: any) => {
      toast.success(`Đã cập nhật ${res.count} đặt lịch`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      setSelectedBookings([]);
    },
  });

  const handleExport = async () => {
    try {
      toast.loading('Đang khởi tạo file export...', { id: 'export' });
      const blob = await adminApi.exportBookings({ 
        status: status || undefined, 
        salonId: salonId || undefined, 
        staffId: staffId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: debouncedSearch || undefined,
      });
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings-export-${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Gửi yêu cầu xuất file thành công', { id: 'export' });
    } catch (err) {
      toast.error('Không thể xuất file', { id: 'export' });
    }
  };

  const columns: ColumnDef<Booking>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
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
        const customer = (row.original as any).customer;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={customer?.avatar} />
              <AvatarFallback>{customer?.name?.charAt(0)}</AvatarFallback>
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
      accessorKey: 'salon',
      header: 'Chi nhánh / Stylist',
      cell: ({ row }) => {
        const salon = row.original.salon;
        const staff = row.original.staff;
        return (
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[120px]">{salon?.name}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <User className="w-3 h-3 text-slate-400" />
              <span>{staff?.user.name || 'Chưa chỉ định'}</span>
            </div>
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
            {services.map((s: any) => s.service.name).join(', ') || 'N/A'}
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
              <Calendar className="w-3.5 h-3.5" />
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/bookings/${booking.id}`} className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Xem chi tiết
                </Link>
              </DropdownMenuItem>
              {booking.status === 'PENDING' && (
                <DropdownMenuItem 
                  className="text-green-600"
                  onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'CONFIRMED' })}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Xác nhận
                </DropdownMenuItem>
              )}
              {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => updateStatusMutation.mutate({ id: booking.id, status: 'CANCELLED' })}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Hủy đặt lịch
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [updateStatusMutation]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading italic">Quản Lý Đặt Lịch</h1>
          <p className="text-slate-500 text-sm">Theo dõi và xử lý các lịch hẹn cắt tóc trên toàn hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
            <Download className="w-4 h-4 mr-2" /> Xuất Excel
          </Button>
        </div>
      </div>

      {isError && (
        <Card className="p-6">
          <ErrorState 
            message={(error as any)?.response?.data?.message || 'Không thể tải danh sách đặt lịch'} 
            onRetry={() => refetch()} 
          />
        </Card>
      )}

      <Card className="border shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                title="Status Filter"
                className="w-full h-9 pl-9 pr-4 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(STATUS_CONFIG).map(([key, value]: any) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
            
            <select
              title="Salon Filter"
              className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              value={salonId}
              onChange={(e) => {
                setSalonId(e.target.value);
                setStaffId('');
              }}
            >
              <option value="">Tất cả chi nhánh</option>
              {salonsData?.data?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              title="Staff Filter"
              className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              <option value="">Tất cả nhân viên</option>
              {staffData?.data?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.user?.name}</option>
              ))}
            </select>

            <select
              title="Service Filter"
              className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Tất cả dịch vụ</option>
              {servicesData?.data?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 lg:col-span-2">
              <Input
                type="date"
                title="From date"
                className="h-9"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-slate-400">→</span>
              <Input
                type="date"
                title="To date"
                className="h-9"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {selectedBookings.length > 0 && (
          <div className="p-3 bg-primary/5 border-b flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <span className="text-sm font-medium text-primary ml-3">
               Đã chọn <strong>{selectedBookings.length}</strong> booking
            </span>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="default"
                className="bg-green-600 hover:bg-green-700 h-8"
                onClick={() => bulkStatusMutation.mutate({ ids: selectedBookings.map(b => b.id), status: 'CONFIRMED' })}
                disabled={bulkStatusMutation.isPending}
              >
                 <CheckCircle className="w-4 h-4 mr-1.5" /> Xác nhận hàng loạt
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                className="h-8"
                onClick={() => bulkStatusMutation.mutate({ ids: selectedBookings.map(b => b.id), status: 'CANCELLED' })}
                disabled={bulkStatusMutation.isPending}
              >
                 <Trash2 className="w-4 h-4 mr-1.5" /> Hủy hàng loạt
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

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.data || []}
            searchKey="bookingCode"
            loading={isLoading}
            onRowSelectionChange={setSelectedBookings}
            pagination={{
              pageCount: data?.meta?.lastPage || 1,
              onPageChange: (p) => setPage(p),
              pageIndex: page,
              pageSize: limit,
            }}
          />
        </CardContent>
      </Card>

    </div>
  );
}
