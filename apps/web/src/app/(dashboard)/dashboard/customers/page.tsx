'use client';

import { useMemo, useState } from 'react';
import {
  Users,
  Calendar,
  ShoppingBag,
  Mail,
  Phone,
  ArrowRight,
  UserPlus,
  Activity,
  User,
  AlertCircle,
  Loader2,
  ShieldOff,
  Shield,
  MoreVertical,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/admin/error-state';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';

const STATUS_CONFIG: any = {
  true: { label: 'Hoạt động', variant: 'success' },
  false: { label: 'Đã khóa', variant: 'destructive' },
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
  NO_SHOW: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'customers', { page, limit, search }],
    queryFn: () => adminApi.getAllUsers({ page, limit, search, role: 'CUSTOMER' }),
  });

  const { data: customerDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin', 'customer', selectedCustomerId],
    queryFn: () => adminApi.getUserById(selectedCustomerId!),
    enabled: !!selectedCustomerId && isDetailOpen,
  });

  const toggleMutation = useMutation({
    mutationFn: (userId: string) => adminApi.toggleUserStatus(userId),
    onSuccess: (result: any) => {
      const action = result.isActive ? 'Đã mở khóa' : 'Đã khóa';
      toast.success(`${action} tài khoản ${result.name || ''} thành công.`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể thực hiện thao tác này.');
    },
  });

  // Calculate metrics at top level to avoid hook violation
  const metrics = useMemo(() => {
    if (!data?.data) return { totalUsers: 0, activeUsers: 0, newUsers: 0 };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalUsers: data?.meta?.total || 0,
      activeUsers: data?.data?.filter((u: any) => u.isActive).length || 0,
      newUsers: data?.data?.filter((u: any) => new Date(u.createdAt) >= startOfMonth).length || 0,
    };
  }, [data]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Khách hàng',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-slate-200">
              <AvatarImage src={user.avatar || ''} alt={user.name} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {user.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900 line-clamp-1">{user.name || 'Chưa cập nhật'}</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                ID: {user.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'contact',
      header: 'Liên hệ',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col gap-1 text-left">
            {user.email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail className="w-3 h-3 text-slate-400" />
                {user.email}
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="w-3 h-3 text-slate-400" />
                {user.phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: '_count.bookings',
      header: 'Đơn đặt',
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Badge variant="outline" className="h-6 px-2.5 bg-slate-50 text-slate-700 font-bold border-slate-200">
            {row.original._count?.bookings || 0}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Ngày tham gia',
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">{formatDateTime(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <StatusBadge status={String(row.getValue('isActive'))} config={STATUS_CONFIG} />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        const isBlocked = !user.isActive;
        const isPending = toggleMutation.isPending && toggleMutation.variables === user.id;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[185px] p-1 shadow-xl border-slate-200">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCustomerId(user.id);
                  setIsDetailOpen(true);
                }}
                className="rounded-md focus:bg-slate-50 cursor-pointer flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4 text-slate-400" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => {
                  const action = isBlocked ? 'mở khóa' : 'khóa';
                  if (confirm(`Bạn có chắc muốn ${action} tài khoản của "${user.name}"?`)) {
                    toggleMutation.mutate(user.id);
                  }
                }}
                className={cn(
                  'rounded-md cursor-pointer flex items-center gap-2 font-medium',
                  isBlocked
                    ? 'text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700'
                    : 'text-rose-600 focus:bg-rose-50 focus:text-rose-700',
                )}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isBlocked ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <ShieldOff className="w-4 h-4" />
                )}
                {isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [toggleMutation]);

  if (isError) {
    return (
      <Card className="m-8 border-none shadow-premium">
        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
          <ErrorState
            message={(error as any)?.response?.data?.message || 'Không thể tải danh sách khách hàng'}
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic uppercase">Khách hàng</h1>
          <p className="text-slate-500 mt-1">Quản lý cơ sở dữ liệu khách hàng và lịch sử tương tác.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-premium transition-all hover:translate-y-[-2px]">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng khách hàng</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{metrics.totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-premium transition-all hover:translate-y-[-2px]">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600 shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Đang hoạt động</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{metrics.activeUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-premium transition-all hover:translate-y-[-2px]">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-amber-100 rounded-2xl text-amber-600 shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Mới tháng này</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{metrics.newUsers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-heading italic">Danh sách khách hàng</CardTitle>
          <CardDescription>Tìm kiếm và quản lý chi tiết khách hàng.</CardDescription>
        </CardHeader>
        <DataTable
          columns={columns}
          data={data?.data || []}
          searchKey="name"
          loading={isLoading}
          pagination={{
            pageCount: data?.meta?.lastPage || 1,
            onPageChange: (p) => setPage(p),
            pageIndex: page,
            pageSize: limit,
            total: data?.meta?.total,
            onPageSizeChange: (s) => {
              setLimit(s);
              setPage(1);
            }
          }}
        />
      </Card>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl p-0 border-none overflow-y-auto bg-slate-50">
          {isDetailLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : customerDetail ? (
            <div className="flex flex-col h-full">
              <div className="bg-white p-8 border-b border-slate-100 shadow-sm relative">
                <SheetHeader className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-md">
                      <AvatarImage src={customerDetail.avatar || ''} alt={customerDetail.name} />
                      <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                        {customerDetail.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <SheetTitle className="text-2xl font-bold text-slate-900">{customerDetail.name}</SheetTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={cn('', customerDetail.isActive ? 'bg-emerald-500' : 'bg-slate-400')}>
                          {customerDetail.isActive ? 'Bình thường' : 'Đã khóa'}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 text-slate-500">
                          {customerDetail.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </SheetHeader>
              </div>

              <div className="p-8 space-y-8 flex-1">
                {/* Contact Section */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 uppercase text-xs tracking-widest leading-none">
                    <User className="w-4 h-4 text-primary" /> Thông tin liên hệ
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Email</span>
                      <p className="text-sm font-medium text-slate-700 truncate">{customerDetail.email || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Số điện thoại</span>
                      <p className="text-sm font-medium text-slate-700">{customerDetail.phone || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Ngày tham gia</span>
                      <p className="text-sm font-medium text-slate-700">{new Date(customerDetail.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </section>

                {/* History Section */}
                <section className="space-y-4">
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 uppercase text-xs tracking-widest leading-none">
                    <Calendar className="w-4 h-4 text-primary" /> Lịch sử đặt lịch
                  </h4>
                  <div className="space-y-3">
                    {customerDetail.bookings?.length > 0 ? (
                      customerDetail.bookings.map((booking: any) => (
                        <div key={booking.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary/20 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 line-clamp-1">{booking.salon?.name}</p>
                              <p className="text-[xs] text-slate-400">{formatDateTime(booking.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{formatPrice(booking.totalAmount)}</p>
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', BOOKING_STATUS_COLORS[booking.status])}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-400 text-sm">Chưa có lịch sử đặt lịch nào.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
              <AlertCircle className="h-12 w-12 text-slate-300" />
              <p className="text-slate-500">Không tìm thấy thông tin khách hàng này.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
