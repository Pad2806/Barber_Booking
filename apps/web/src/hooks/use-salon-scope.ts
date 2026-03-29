import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';

export type SalonScopeRole = 'SUPER_ADMIN' | 'SALARY_OWNER' | 'MANAGER' | 'CASHIER' | 'BARBER' | 'SKINNER' | 'CUSTOMER' | null;

export interface SalonScope {
  /** salonId mà user thuộc về (null nếu là SUPER_ADMIN hoặc chưa gán chi nhánh) */
  salonId: string | null;
  /** true nếu là SUPER_ADMIN — có thể thấy dữ liệu toàn hệ thống */
  isSuperAdmin: boolean;
  /** true nếu là SALON_OWNER */
  isSalonOwner: boolean;
  /** true nếu là MANAGER */
  isManager: boolean;
  /** true nếu là CASHIER */
  isCashier: boolean;
  /** true nếu là BARBER hoặc SKINNER */
  isBarber: boolean;
  /** true nếu isSuperAdmin || isSalonOwner — có thể xem all-branch data */
  isGlobalAdmin: boolean;
  /** Tất cả roles của user */
  roles: string[];
  /** true khi đang load */
  isLoading: boolean;
  /** user object đầy đủ từ /users/me */
  me: any;
}

/**
 * Hook cung cấp thông tin scope chi nhánh của user hiện tại.
 * Dùng hook này để quyết định nên gọi adminApi hay managerApi.
 *
 * @example
 * const { isSuperAdmin, isManager, salonId } = useSalonScope();
 * const data = isSuperAdmin
 *   ? await adminApi.getAllStaff()
 *   : await managerApi.getStaff();
 */
export function useSalonScope(): SalonScope {
  const { data: session, status } = useSession();

  const { data: me, isLoading: isLoadingMe } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
    enabled: status === 'authenticated',
    staleTime: 60_000, // cache 1 phút
    retry: false,
    refetchOnWindowFocus: false,
  });

  return useMemo(() => {
    const isLoading = status === 'loading' || (status === 'authenticated' && isLoadingMe);

    if (!me) {
      return {
        salonId: null,
        isSuperAdmin: false,
        isSalonOwner: false,
        isManager: false,
        isCashier: false,
        isBarber: false,
        isGlobalAdmin: false,
        roles: [],
        isLoading,
        me: null,
      };
    }

    // Lấy roles từ UserRole table (multi-role support)
    const roles: string[] = (me as any).roles?.length
      ? (me as any).roles
      : [me.role].filter(Boolean);

    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isSalonOwner = roles.includes('SALON_OWNER');
    const isManager = roles.includes('MANAGER');
    const isCashier = roles.includes('CASHIER');
    const isBarber = roles.includes('BARBER') || roles.includes('SKINNER');
    const isGlobalAdmin = isSuperAdmin || isSalonOwner;

    // Lấy salonId từ staff record (nguồn sự thật cho MANAGER/BARBER/CASHIER)
    const salonId: string | null = (me as any).staff?.salonId ?? null;

    return {
      salonId,
      isSuperAdmin,
      isSalonOwner,
      isManager,
      isCashier,
      isBarber,
      isGlobalAdmin,
      roles,
      isLoading,
      me,
    };
  }, [me, status, isLoadingMe]);
}
