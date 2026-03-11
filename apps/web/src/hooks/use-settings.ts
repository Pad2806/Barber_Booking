'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useSettings() {
    const queryClient = useQueryClient();
    const [localSettings, setLocalSettings] = useState<Record<string, any>>({});

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin', 'settings'],
        queryFn: () => adminApi.getSettings(),
    });

    useEffect(() => {
        if (data) {
            setLocalSettings(data);
        }
    }, [data]);

    const updateMutation = useMutation({
        mutationFn: (newSettings: Record<string, any>) => adminApi.updateSettings(newSettings),
        onSuccess: () => {
            toast.success('Cập nhật cài đặt thành công');
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Không thể lưu cài đặt');
        },
    });

    const updateField = (key: string, value: any) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
    };

    const saveSettings = () => {
        updateMutation.mutate(localSettings);
    };

    return {
        settings: localSettings,
        isLoading,
        isSaving: updateMutation.isPending,
        updateField,
        saveSettings,
        refresh: refetch,
    };
}
