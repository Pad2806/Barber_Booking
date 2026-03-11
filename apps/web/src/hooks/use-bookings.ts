'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, BookingQueryDto } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { BookingStatus } from '@prisma/client';

export function useBookings(initialQuery: BookingQueryDto = {}) {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState<BookingQueryDto>({
        page: 1,
        limit: 10,
        ...initialQuery,
    });

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['admin', 'bookings', query],
        queryFn: () => adminApi.getAllBookings(query),
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: BookingStatus }) =>
            adminApi.bulkUpdateBookingStatus(ids, status),
        onSuccess: () => {
            toast.success('Cập nhật trạng thái thành công');
            queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
        },
    });

    const exportMutation = useMutation({
        mutationFn: () => adminApi.exportBookings(query),
        onSuccess: (data: any) => {
            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bookings-${new Date().toISOString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Xuất file thành công');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Không thể xuất file');
        },
    });

    const updateQuery = (newQuery: Partial<BookingQueryDto>) => {
        setQuery((prev) => ({ ...prev, ...newQuery, page: newQuery.page || 1 }));
    };

    const handlePageChange = (page: number) => {
        updateQuery({ page });
    };

    const handleSearch = (search: string) => {
        updateQuery({ search, page: 1 });
    };

    return {
        bookings: data?.data || [],
        meta: data?.meta,
        isLoading,
        isError,
        error,
        query,
        updateQuery,
        handlePageChange,
        handleSearch,
        bulkUpdateStatus: bulkUpdateMutation.mutate,
        isBulkUpdating: bulkUpdateMutation.isPending,
        exportToExcel: exportMutation.mutate,
        isExporting: exportMutation.isPending,
        refetch,
    };
}
