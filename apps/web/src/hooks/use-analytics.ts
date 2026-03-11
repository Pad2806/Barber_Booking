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

    const serviceAnalytics = (salonId?: string) => useQuery({
        queryKey: ['admin', 'analytics', 'services', salonId],
        queryFn: () => adminApi.getServiceAnalytics(salonId),
    });

    const staffAnalytics = (staffId: string) => useQuery({
        queryKey: ['admin', 'analytics', 'staff', staffId],
        queryFn: () => adminApi.getStaffAnalytics(staffId),
        enabled: !!staffId,
    });

    return {
        dashboardStats: dashboardStats.data,
        isDashboardLoading: dashboardStats.isLoading,
        branchAnalytics: branchAnalytics.data,
        isBranchLoading: branchAnalytics.isLoading,
        serviceAnalytics,
        staffAnalytics,
        refreshDashboard: dashboardStats.refetch,
        refreshBranches: branchAnalytics.refetch,
    };
}
