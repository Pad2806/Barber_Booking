'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  Users,
  Award,
  Activity,
  Calendar,
  Loader2,
} from 'lucide-react';
import { STAFF_POSITIONS } from '@/lib/utils';
import { adminApi, managerApi } from '@/lib/api';
import { useSalonScope } from '@/hooks/use-salon-scope';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/admin/error-state';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import ImageUpload from '@/components/ImageUpload';

const STATUS_CONFIG: any = {
  true: { label: 'Đang hoạt động', variant: 'success' },
  false: { label: 'Tạm nghỉ', variant: 'destructive' },
};

export default function AdminStaffPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isGlobalAdmin, isSuperAdmin, isManager, salonId: mySalonId } = useSalonScope();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [salonId, setSalonId] = useState<string | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [position, setPosition] = useState('');

  // Sheet states
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    position: 'STYLIST',
    salonId: '',
    password: '',
    isActive: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Active filter count for the clear button
  const activeFilterCount = [
    debouncedSearch, position,
    salonId, minRating ? String(minRating) : ''
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const clearAllStaffFilters = () => {
    setSearch(''); setPosition('');
    setSalonId(undefined); setMinRating(undefined);
    setSortBy('createdAt'); setSortOrder('desc');
    setPage(1);
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: isSuperAdmin
      ? ['admin', 'staff', { page, limit, salonId, minRating, sortBy, sortOrder, search: debouncedSearch, position }]
      : ['manager', 'staff', { page, limit, minRating, sortBy, sortOrder, search: debouncedSearch, position }],
    queryFn: () => isSuperAdmin
      ? adminApi.getAllStaff({ page, limit, salonId, minRating, sortBy, sortOrder, search: debouncedSearch || undefined, position: position || undefined })
      : managerApi.getStaff({ page, limit, minRating, sortBy, sortOrder }),
    enabled: isSuperAdmin !== undefined,
  });

  // Danh sách salons chỉ dành cho SUPER_ADMIN (để filter)
  const { data: salonsData } = useQuery({
    queryKey: ['admin', 'salons', 'list'],
    queryFn: () => adminApi.getAllSalons({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  // Global stats — NOT affected by search/filter — for the summary cards
  const { data: globalData } = useQuery({
    queryKey: isSuperAdmin ? ['admin', 'staff', 'global-stats'] : ['manager', 'staff', 'global-stats'],
    queryFn: () => isSuperAdmin
      ? adminApi.getAllStaff({ page: 1, limit: 500 })
      : managerApi.getStaff({ page: 1, limit: 500 }),
    enabled: isSuperAdmin !== undefined,
    staleTime: 2 * 60 * 1000, // cache 2 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => isSuperAdmin ? adminApi.deleteStaff(id) : managerApi.deleteStaff(id),
    onSuccess: () => {
      toast.success('Đã xóa nhân viên');
      queryClient.invalidateQueries({ queryKey: isSuperAdmin ? ['admin', 'staff'] : ['manager', 'staff'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa nhân viên');
    },
  });

  const createMutation = useMutation({
    mutationFn: (creationData: any) => isSuperAdmin ? adminApi.createStaff(creationData) : managerApi.createStaff(creationData),
    onSuccess: () => {
      toast.success('Thêm nhân viên thành công');
      setPanelOpen(false);
      queryClient.invalidateQueries({ queryKey: isSuperAdmin ? ['admin', 'staff'] : ['manager', 'staff'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể thêm nhân viên');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: any }) => isSuperAdmin ? adminApi.updateStaff(id, updateData) : managerApi.updateStaff(id, updateData),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      setPanelOpen(false);
      queryClient.invalidateQueries({ queryKey: isSuperAdmin ? ['admin', 'staff'] : ['manager', 'staff'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật nhân viên');
    },
  });

  useEffect(() => {
    if (panelMode === 'create') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        avatar: '',
        position: 'STYLIST',
        salonId: '',
        password: '',
        isActive: true,
      });
    } else if (selectedStaffId && (panelMode === 'edit' || panelMode === 'view')) {
      const staff = data?.data?.find((s: any) => s.id === selectedStaffId);
      if (staff) {
        setFormData({
          name: staff.user?.name || '',
          email: staff.user?.email || '',
          phone: staff.user?.phone || '',
          avatar: staff.user?.avatar || '',
          position: staff.position || 'STYLIST',
          salonId: staff.salonId || '',
          password: '',
          isActive: staff.isActive,
        });
      }
    }
  }, [panelMode, selectedStaffId, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (panelMode === 'create') {
      createMutation.mutate(formData);
    } else if (panelMode === 'edit' && selectedStaffId) {
      const staff = data?.data?.find((s: any) => s.id === selectedStaffId);
      if (staff?.user?.id) {
        const { password, ...rest } = formData;
        const updateData = password ? formData : rest;
        updateMutation.mutate({ id: staff.user.id, updateData });
      }
    }
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'user.name',
      header: 'Nhân viên',
      cell: ({ row }) => {
        const staff = row.original;
        const user = staff.user;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-slate-200">
              <AvatarImage src={user?.avatar || ''} alt={user?.name} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold font-heading italic">
                {user?.name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900 line-clamp-1">{user?.name}</span>
              <span className="text-xs text-slate-500 line-clamp-1">{user?.email || user?.phone}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'position',
      header: 'Vị trí',
      cell: ({ row }) => {
        const pos = row.getValue('position') as string;
        return (
          <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-700 border-none whitespace-nowrap">
            {STAFF_POSITIONS[pos as keyof typeof STAFF_POSITIONS] || pos}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'salon.name',
      header: 'Chi nhánh',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-medium line-clamp-1">{row.original.salon?.name || '-'}</span>
        </div>
      ),
    },
    {
      id: 'stats',
      header: 'Thống kê',
      cell: ({ row }) => {
        const rating = row.original.rating || 0;
        const bookings = row.original._count?.bookings || 0;
        return (
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
              < Star className="w-3 h-3 fill-amber-500" />
              <span>{rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({row.original.totalReviews || 0})</span>
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">{bookings}</span> lượt đặt
            </div>
          </div>
        );
      },
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
        const staff = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full transition-colors">
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-1 shadow-xl border-slate-200">
              <DropdownMenuItem
                onClick={() => router.push(`/admin/staff/${staff.id}`)}
                className="rounded-md focus:bg-slate-50 cursor-pointer flex items-center"
              >
                <Eye className="w-4 h-4 mr-2 text-slate-400" /> Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setSelectedStaffId(staff.id); setPanelMode('edit'); setPanelOpen(true); }}
                className="rounded-md focus:bg-slate-50 cursor-pointer flex items-center"
              >
                <Edit className="w-4 h-4 mr-2 text-slate-400" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/5 focus:text-destructive rounded-md cursor-pointer flex items-center"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa nhân viên ${staff.user?.name}?`)) {
                    deleteMutation.mutate(staff.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa nhân viên
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [deleteMutation, router]);

  if (isError) {
    return (
      <Card className="m-8 border-none shadow-premium">
        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
          <ErrorState
            message={(error as any)?.response?.data?.message || 'Không thể tải danh sách nhân viên'}
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Nhân Viên</h1>
          <p className="text-slate-500 mt-1">Quản lý đội ngũ stylist, thợ phụ và phân quyền tại các chi nhánh.</p>
        </div>
        <Button onClick={() => { setPanelMode('create'); setSelectedStaffId(null); setPanelOpen(true); }} className="gap-2 shadow-sm rounded-xl px-6">
          <Plus className="w-4 h-4" /> Thêm nhân viên
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-none shadow-none ring-1 ring-primary/10 transition-all hover:ring-primary/20">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng nhân sự</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{globalData?.meta?.total ?? data?.meta?.total ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-none shadow-none ring-1 ring-amber-200/50 transition-all hover:ring-amber-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-amber-100 rounded-2xl text-amber-600 shadow-inner">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Stylist nổi bật</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {globalData?.data?.filter((s: any) => s.rating >= 4.5).length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-none shadow-none ring-1 ring-emerald-200/50 transition-all hover:ring-emerald-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Đang hoạt động</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {globalData?.data?.filter((s: any) => s.isActive).length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm">
        <CardHeader className="px-6 flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-100 text-left">
          <CardTitle className="text-xl font-bold text-slate-800">Danh sách nhân sự</CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="h-9 px-3 border-slate-200 bg-white font-medium text-slate-600 hidden lg:flex">
              {data?.meta?.total || 0} nhân viên
            </Badge>

            {/* Search box */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="Tìm tên, email, SĐT..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="h-9 pl-9 pr-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-48"
              />
            </div>

            {/* Position filter */}
            <select
              title="Position Filter"
              value={position}
              onChange={e => { setPosition(e.target.value); setPage(1); }}
              className="h-9 px-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
            >
              <option value="">Tất cả vị trí</option>
              {Object.entries(STAFF_POSITIONS).map(([key, value]) => (
                <option key={key} value={key}>{value as string}</option>
              ))}
            </select>

            {/* Dropdown chi nhánh chỉ hiển thị cho SUPER_ADMIN */}
            {isSuperAdmin && (
              <select
                title="Salon Filter"
                value={salonId || 'ALL'}
                onChange={e => setSalonId(e.target.value === 'ALL' ? undefined : e.target.value)}
                className="h-9 px-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
              >
                <option value="ALL">Tất cả chi nhánh</option>
                {salonsData?.data?.map((salon: any) => (
                  <option key={salon.id} value={salon.id}>
                    {salon.name}
                  </option>
                ))}
              </select>
            )}

            <select
              title="Rating Filter"
              value={minRating || 'ALL'}
              onChange={e => setMinRating(e.target.value === 'ALL' ? undefined : Number(e.target.value))}
              className="h-9 px-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
            >
              <option value="ALL">⭐ Mọi điểm số</option>
              <option value="4.5">⭐ 4.5+ (Xuất sắc)</option>
              <option value="4.0">⭐ 4.0+ (Tốt)</option>
              <option value="3.0">⭐ 3.0+ (Trung bình)</option>
            </select>

            <select
              title="Sort By"
              value={`${sortBy}:${sortOrder}`}
              onChange={e => {
                const [field, order] = e.target.value.split(':');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="h-9 px-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
            >
              <option value="createdAt:desc">Mới nhất</option>
              <option value="bookings:desc">🔥 Phổ biến nhất</option>
              <option value="rating:desc">⭐ Rating cao nhất</option>
              <option value="rating:asc">⭐ Rating thấp nhất</option>
            </select>
          </div>
        </CardHeader>

        {/* Clear all filters bar for staff page */}
        {hasActiveFilters && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between animate-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              <span className="text-xs font-semibold text-amber-700">
                Đang lọc với <span className="bg-amber-200 text-amber-800 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{activeFilterCount}</span> điều kiện
              </span>
            </div>
            <button
              onClick={clearAllStaffFilters}
              className="text-xs font-semibold text-amber-700 hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Xoá bộ lọc
            </button>
          </div>
        )}

        <CardContent className="px-0 sm:px-6 py-6">
          <DataTable
            columns={columns}
            data={data?.data || []}
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
        </CardContent>
      </Card>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent className="sm:max-w-2xl flex flex-col h-full p-0 border-none shadow-premium bg-white">
          <SheetHeader className="px-8 py-6 border-b border-slate-100 text-left shrink-0">
            <SheetTitle className="text-2xl font-bold font-heading italic text-primary flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {panelMode === 'create' ? <Plus className="w-5 h-5" /> : panelMode === 'edit' ? <Edit className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
              {panelMode === 'create' ? 'Thêm nhân viên' : panelMode === 'edit' ? 'Chỉnh sửa nhân viên' : 'Thông tin nhân viên'}
            </SheetTitle>
            <SheetDescription className="text-slate-500 mt-1">
              {panelMode === 'create' ? 'Tạo hồ sơ nhân sự mới và thiết lập quyền truy cập cho hệ thống.' : 'Xem hoặc cập nhật thông tin chi tiết và quyền hạn của nhân viên.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-8 py-8">
            <form id="staff-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
              <div className="grid grid-cols-1 gap-8">
                {/* Avatar upload */}
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 group transition-all hover:bg-slate-100/50">
                  <ImageUpload
                    variant="avatar"
                    value={formData.avatar}
                    onChange={url => setFormData({ ...formData, avatar: url })}
                    folder="avatars"
                    disabled={panelMode === 'view'}
                  />
                  <p className="text-xs text-slate-400 mt-4 text-center font-medium">
                    Tải lên ảnh chân dung chuyên nghiệp.<br />
                    Định dạng JPG, PNG tối đa 10MB.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Họ và tên</label>
                    <input
                      title="Name"
                      required
                      disabled={panelMode === 'view'}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all bg-white disabled:bg-slate-50"
                      placeholder="vd: Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Số điện thoại</label>
                    <input
                      title="Phone"
                      required
                      disabled={panelMode === 'view'}
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all bg-white disabled:bg-slate-50"
                      placeholder="vd: 0912..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                    <input
                      title="Email"
                      required
                      type="email"
                      disabled={panelMode === 'view'}
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all bg-white disabled:bg-slate-50"
                      placeholder="vd: nhanvien@barber.vn"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Vị trí</label>
                    <select
                      title="Position"
                      required
                      disabled={panelMode === 'view'}
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all bg-white disabled:bg-slate-50 cursor-pointer"
                    >
                      {Object.entries(STAFF_POSITIONS).map(([key, value]) => (
                        <option key={key} value={key}>{value as string}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Chi nhánh trực thuộc</label>
                    <select
                      title="Salon"
                      required
                      disabled={panelMode === 'view'}
                      value={formData.salonId}
                      onChange={e => setFormData({ ...formData, salonId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all bg-white disabled:bg-slate-50 cursor-pointer"
                    >
                      <option value="">Chọn chi nhánh</option>
                      {salonsData?.data?.map((salon: any) => (
                        <option key={salon.id} value={salon.id}>{salon.name}</option>
                      ))}
                    </select>
                  </div>
                  {panelMode === 'create' && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu khởi tạo</label>
                      <input
                        title="Password"
                        required
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                        placeholder="Tối thiểu 6 ký tự"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2 flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <input
                      title="Is Active"
                      type="checkbox"
                      id="isActive"
                      disabled={panelMode === 'view'}
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded-md border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                      Nhân viên này đang trong trạng thái sẵn sàng phục vụ khách hàng.
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" onClick={() => setPanelOpen(false)} className="rounded-xl px-8 h-12 min-w-[100px]">Hủy</Button>
            {panelMode !== 'view' && (
              <Button
                form="staff-form"
                type="submit"
                className="rounded-xl px-12 h-12 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                {panelMode === 'create' ? 'Tạo nhân viên' : 'Lưu thay đổi'}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
