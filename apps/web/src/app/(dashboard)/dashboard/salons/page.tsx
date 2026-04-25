'use client';
export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  MapPin,
  Phone,
  Clock,
  Store,
  Users,
  Calendar,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { adminApi, salonApi } from '@/lib/api';
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

const STATUS_CONFIG: any = {
  true: { label: 'Đang hoạt động', variant: 'success' },
  false: { label: 'Tạm đóng', variant: 'destructive' },
};

export default function AdminSalonsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('ALL');

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const activeFilterCount = [debouncedSearch, isActiveFilter !== 'ALL' ? isActiveFilter : ''].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const clearAllSalonFilters = () => { setSearch(''); setIsActiveFilter('ALL'); setPage(1); };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'salons', { page, limit, search: debouncedSearch, isActiveFilter }],
    queryFn: () => adminApi.getAllSalons({ page, limit, search: debouncedSearch || undefined }),
  });

  // Client-side status filter (salons dataset is small)
  const filteredSalons = useMemo(() => {
    if (!data?.data) return [];
    if (isActiveFilter === 'ALL') return data.data;
    return data.data.filter((s: any) => String(s.isActive) === isActiveFilter);
  }, [data?.data, isActiveFilter]);


  const deleteMutation = useMutation({
    mutationFn: (id: string) => salonApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa chi nhánh');
      queryClient.invalidateQueries({ queryKey: ['admin', 'salons'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa chi nhánh');
    },
  });

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Chi nhánh',
      cell: ({ row }) => {
        const salon = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 relative">
              {salon.coverImage ? (
                <Image
                  src={salon.coverImage}
                  alt={salon.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Store className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-900 line-clamp-1">{salon.name}</span>
              <span className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {salon.district}, {salon.city}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'contact',
      header: 'Liên hệ',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.original.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.original.openTime} - {row.original.closeTime}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'stats',
      header: 'Thống kê',
      cell: ({ row }) => {
        const salon = row.original;
        const rating = salon.averageRating || 0;
        return (
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
              <Star className="w-3 h-3 fill-amber-500" />
              <span>{rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({salon._count?.reviews || 0})</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {salon._count?.staff || 0}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {salon._count?.bookings || 0}</span>
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
        const salon = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full transition-colors">
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-1 shadow-xl border-slate-200">
              <DropdownMenuItem asChild>
                <Link href={`/salons/${salon.slug}`} target="_blank" className="rounded-md focus:bg-slate-50 cursor-pointer flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2 text-slate-400" /> Xem trang chủ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/salons/${salon.id}`} className="rounded-md focus:bg-slate-50 cursor-pointer flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-slate-400" /> Xem chi tiết
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/salons/${salon.id}/edit`} className="rounded-md focus:bg-slate-50 cursor-pointer flex items-center">
                  <Edit className="w-4 h-4 mr-2 text-slate-400" /> Chỉnh sửa
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/5 focus:text-destructive rounded-md cursor-pointer flex items-center"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa chi nhánh ${salon.name}? Mọi dữ liệu liên quan sẽ bị xóa sạch!`)) {
                    deleteMutation.mutate(salon.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa chi nhánh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [deleteMutation]);

  if (isError) {
    return (
      <Card className="m-8 border-none shadow-premium">
        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
          <ErrorState
            message={(error as any)?.response?.data?.message || 'Không thể tải danh sách chi nhánh'}
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Chi Nhánh</h1>
          <p className="text-slate-500 mt-1">Quản lý mạng lưới các salon, thông tin liên hệ và thời gian hoạt động.</p>
        </div>
        <Button asChild className="gap-2 shadow-sm rounded-xl px-6">
          <Link href="/admin/salons/new">
            <Plus className="w-4 h-4" /> Thêm chi nhánh
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-none shadow-none ring-1 ring-primary/10 transition-all hover:ring-primary/20">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng chi nhánh</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{data?.meta?.total || 0}</p>
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
                {data?.data?.filter((s: any) => s.isActive).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-none shadow-none ring-1 ring-amber-200/50 transition-all hover:ring-amber-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-amber-100 rounded-2xl text-amber-600 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng nhân sự</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {data?.data?.reduce((acc: number, s: any) => acc + (s._count?.staff || 0), 0) || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm">
        <CardHeader className="px-6 flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-100">
          <CardTitle className="text-xl font-bold text-slate-800">Danh sách các chi nhánh</CardTitle>
          <Badge variant="outline" className="h-9 px-4 border-slate-200 bg-white font-medium text-slate-600">
            {data?.meta?.total || 0} Chi nhánh
          </Badge>
        </CardHeader>

        {/* Filter toolbar */}
        <div className="px-6 pb-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="salon-search"
              placeholder="Tìm tên, SĐT chi nhánh..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 pl-9 pr-4 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-56"
            />
          </div>
          <select
            title="Status Filter"
            value={isActiveFilter}
            onChange={e => { setIsActiveFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Tạm đóng</option>
          </select>
        </div>

        {/* Clear filters bar */}
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
            <button onClick={clearAllSalonFilters}
              className="text-xs font-semibold text-amber-700 hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors">
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
            data={filteredSalons}
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
    </div>
  );
}
