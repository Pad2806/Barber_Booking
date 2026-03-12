'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Scissors,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { formatPrice, SERVICE_CATEGORIES } from '@/lib/utils';
import { adminApi } from '@/lib/api';
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
  false: { label: 'Đã ẩn', variant: 'destructive' },
};

export default function AdminServicesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'services', { page, limit, category }],
    queryFn: () => adminApi.getAllServices({ page, limit, category: category === 'ALL' ? undefined : category }),
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin', 'services', 'performance'],
    queryFn: () => adminApi.getServiceAnalytics(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteService(id),
    onSuccess: () => {
      toast.success('Đã xóa dịch vụ');
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa dịch vụ');
    },
  });

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Dịch vụ',
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 relative">
              {service.image ? (
                <Image 
                  src={service.image} 
                  alt={service.name} 
                  fill 
                  className="object-cover" 
                />
              ) : (
                <Scissors className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900">{service.name}</span>
              <span className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{service.description || 'Không có mô tả'}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Danh mục',
      cell: ({ row }) => {
        const cat = row.getValue('category') as string;
        const config = (SERVICE_CATEGORIES as any)[cat];
        return (
          <Badge variant="outline" className="gap-1.5 font-medium py-1 px-2.5">
            <span className="text-sm">{config?.icon || '📦'}</span>
            {config?.label || cat}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Giá dịch vụ',
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">{formatPrice(row.getValue('price'))}</span>
      ),
    },
    {
      accessorKey: 'duration',
      header: 'Thời lượng',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>{row.getValue('duration')} phút</span>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive');
        return (
          <StatusBadge status={String(isActive)} config={STATUS_CONFIG} />
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const service = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem asChild>
                <Link href={`/admin/services/${service.id}/edit`} className="flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Chỉnh sửa
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive flex items-center"
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa dịch vụ này?')) {
                    deleteMutation.mutate(service.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa dịch vụ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [deleteMutation]);

  if (isError) {
    return (
      <Card className="m-8">
        <CardContent className="pt-6">
          <ErrorState 
            message={(error as any)?.response?.data?.message || 'Không thể tải danh sách dịch vụ'} 
            onRetry={() => refetch()} 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Dịch Vụ</h1>
          <p className="text-slate-500 mt-1">Quản lý bảng giá, danh mục và thời lượng các dịch vụ tại salon.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/services/new">
            <Plus className="w-4 h-4" /> Thêm dịch vụ
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-premium bg-white">
          <CardHeader className="pb-2 text-left">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Dịch vụ được đặt nhiều nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topBooked?.slice(0, 3).map((item: any, idx: number) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                    <span className="font-bold text-sm text-slate-800">{item.name}</span>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">{item._count.bookings} lượt đặt</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-premium bg-white">
          <CardHeader className="pb-2 text-left">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Doanh thu cao nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topRevenue?.slice(0, 3).map((item: any, idx: number) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                    <span className="font-bold text-sm text-slate-800">{item.name}</span>
                  </div>
                  <span className="font-black text-sm text-slate-900">{formatPrice(item.revenue || 0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-slate-50/50">
        <CardHeader className="px-0 flex flex-row items-center justify-between space-y-0 pb-4 pr-6 text-left">
          <CardTitle className="text-lg font-semibold px-6">Bảng giá dịch vụ</CardTitle>
          <div className="flex gap-2">
            <select
              title="Category Filter"
              value={category || 'ALL'}
              onChange={e => setCategory(e.target.value === 'ALL' ? undefined : e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-medium"
            >
              <option value="ALL">Tất cả danh mục</option>
              {Object.entries(SERVICE_CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
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
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
