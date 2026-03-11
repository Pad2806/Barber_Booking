'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

export function useAnalytics() {
    const dashboardStats = useQuery({
        queryKey: ['admin', 'dashboard', 'stats'],
        queryFn: () => adminApi.getDashboardStats(),
    });

    const branchAnalytics = useQuery({
        queryKey: ['admin', 'analytics', 'branches'],
        queryFn: () => adminApi.getBranchAnalytics(),
    });

    return {
        dashboardStats: dashboardStats.data,
        isDashboardLoading: dashboardStats.isLoading,
        branchAnalytics: branchAnalytics.data,
        isBranchLoading: branchAnalytics.isLoading,
        refreshDashboard: dashboardStats.refetch,
        refreshBranches: branchAnalytics.refetch,
    };
}

export function useServiceAnalytics(salonId?: string) {
    return useQuery({
        queryKey: ['admin', 'analytics', 'services', salonId],
        queryFn: () => adminApi.getServiceAnalytics(salonId),
    });
}

export function useStaffAnalytics(staffId: string) {
    return useQuery({
        queryKey: ['admin', 'analytics', 'staff', staffId],
        queryFn: () => adminApi.getStaffAnalytics(staffId),
        enabled: !!staffId,
    });
}
