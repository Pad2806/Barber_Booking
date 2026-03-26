'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salonApi, userRoleApi } from '@/lib/api';
import { Role, Permission, getUserMultiRolePermissions, ROLE_DISPLAY } from '@reetro/shared';
import {
  Shield, Users, Store, Check, X, ChevronDown, ChevronUp, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import apiClient from '@/lib/api';

// Assignable roles (exclude CUSTOMER and SUPER_ADMIN)
const ASSIGNABLE_ROLES = [
  { value: Role.BARBER, label: '💈 Barber', desc: 'Cắt tóc, quản lý lịch cá nhân' },
  { value: Role.CASHIER, label: '💰 Thu ngân', desc: 'Xem booking, thanh toán' },
  { value: Role.SKINNER, label: '🧴 Skinner', desc: 'Chăm sóc da, lịch cá nhân' },
  { value: Role.MANAGER, label: '📊 Quản lý', desc: 'Quản lý nhân viên, doanh thu' },
  { value: Role.SALON_OWNER, label: '🏪 Chủ salon', desc: 'Toàn quyền chi nhánh' },
];

const PERMISSION_LABELS: Record<string, string> = {
  VIEW_DASHBOARD: 'Xem Dashboard',
  VIEW_ALL_BOOKINGS: 'Xem tất cả booking',
  VIEW_OWN_BOOKINGS: 'Xem booking cá nhân',
  MANAGE_BOOKINGS: 'Quản lý booking',
  VIEW_STAFF: 'Xem nhân viên',
  MANAGE_STAFF: 'Quản lý nhân viên',
  VIEW_SERVICES: 'Xem dịch vụ',
  MANAGE_SERVICES: 'Quản lý dịch vụ',
  VIEW_SALONS: 'Xem chi nhánh',
  MANAGE_SALONS: 'Quản lý chi nhánh',
  VIEW_REVIEWS: 'Xem đánh giá',
  REPLY_REVIEWS: 'Trả lời đánh giá',
  VIEW_REVENUE: 'Xem doanh thu',
  VIEW_USERS: 'Xem khách hàng',
  MANAGE_USERS: 'Quản lý users',
  MANAGE_SETTINGS: 'Quản lý cài đặt',
  MANAGE_SCHEDULE: 'Quản lý lịch làm',
};

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showPerms, setShowPerms] = useState<string | null>(null);

  // Fetch all staff members
  const { data: staffData, isLoading } = useQuery({
    queryKey: ['admin-staff-roles'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/staff', { params: { limit: 100 } });
      return res.data;
    },
  });

  // Fetch all salons for branch-scoped roles
  const { data: salonsData } = useQuery({
    queryKey: ['admin-salons-for-roles'],
    queryFn: () => salonApi.getAll({ limit: 50 }),
  });

  const staffList = staffData?.data || staffData?.items || [];
  const salons = salonsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Phân quyền nhân viên</h1>
          <p className="text-sm text-slate-500">Gán nhiều vai trò cho từng nhân viên — quyền sẽ được cộng dồn</p>
        </div>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-slate-500 mb-2">Vai trò có thể gán:</p>
        <div className="flex flex-wrap gap-2">
          {ASSIGNABLE_ROLES.map(r => (
            <div key={r.value} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-xs">
              <span>{r.label}</span>
              <span className="text-slate-400">—</span>
              <span className="text-slate-400">{r.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Staff List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Đang tải...</div>
      ) : (
        <div className="space-y-2">
          {staffList.map((staff: any) => (
            <StaffRoleCard
              key={staff.id}
              staff={staff}
              salons={salons}
              isExpanded={expandedUserId === staff.userId}
              onToggleExpand={() =>
                setExpandedUserId(expandedUserId === staff.userId ? null : staff.userId)
              }
              showPerms={showPerms === staff.userId}
              onTogglePerms={() =>
                setShowPerms(showPerms === staff.userId ? null : staff.userId)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StaffRoleCard({
  staff,
  salons,
  isExpanded,
  onToggleExpand,
  showPerms,
  onTogglePerms,
}: {
  staff: any;
  salons: any[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  showPerms: boolean;
  onTogglePerms: () => void;
}) {
  const queryClient = useQueryClient();

  // Fetch current roles for this user
  const { data: currentRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', staff.userId],
    queryFn: () => userRoleApi.getUserRoles(staff.userId),
    enabled: isExpanded,
  });

  const updateMutation = useMutation({
    mutationFn: (roles: { role: string; salonId?: string | null }[]) =>
      userRoleApi.updateUserRoles(staff.userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', staff.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-staff-roles'] });
    },
  });

  const roles: any[] = currentRoles || [];
  const roleValues = roles.map((r: any) => r.role);

  const toggleRole = (roleValue: string) => {
    let newRoles: { role: string; salonId?: string | null }[];
    if (roleValues.includes(roleValue)) {
      // Remove this role
      newRoles = roles
        .filter((r: any) => r.role !== roleValue)
        .map((r: any) => ({ role: r.role, salonId: r.salonId }));
    } else {
      // Add this role
      newRoles = [
        ...roles.map((r: any) => ({ role: r.role, salonId: r.salonId })),
        { role: roleValue, salonId: null },
      ];
    }
    // Ensure at least one role
    if (newRoles.length === 0) {
      newRoles = [{ role: 'CUSTOMER', salonId: null }];
    }
    updateMutation.mutate(newRoles);
  };

  // Compute final permissions from all roles
  const finalPermissions = getUserMultiRolePermissions(roleValues as Role[]);

  return (
    <Card className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
      {/* Collapsed Header */}
      <button
        type="button"
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
        onClick={onToggleExpand}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{staff.user?.name || 'N/A'}</p>
          <p className="text-xs text-slate-400">{staff.user?.email || staff.user?.phone}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {(staff.user?.role ? [staff.user.role] : []).map((r: string) => {
            const display = ROLE_DISPLAY[r];
            return display ? (
              <span key={r} className={`px-2 py-0.5 text-[10px] font-bold text-white rounded ${display.color}`}>
                {display.label}
              </span>
            ) : null;
          })}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-4">
          {rolesLoading ? (
            <p className="text-xs text-slate-400">Đang tải vai trò...</p>
          ) : (
            <>
              {/* Role Toggles */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Vai trò:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ASSIGNABLE_ROLES.map(r => {
                    const isActive = roleValues.includes(r.value);
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => toggleRole(r.value)}
                        disabled={updateMutation.isPending}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                          isActive
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-slate-100 bg-white hover:border-slate-200'
                        } ${updateMutation.isPending ? 'opacity-50' : ''}`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{r.label}</p>
                          <p className="text-[10px] text-slate-400">{r.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View Permissions Button */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={onTogglePerms}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  {showPerms ? 'Ẩn quyền' : `Xem quyền (${finalPermissions.length})`}
                </Button>
                {updateMutation.isPending && (
                  <span className="text-[10px] text-slate-400 animate-pulse">Đang lưu...</span>
                )}
              </div>

              {/* Permissions List */}
              {showPerms && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-slate-500 mb-2">
                    Quyền từ {roleValues.length} vai trò (cộng dồn):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {finalPermissions.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded-md border border-emerald-200">
                        {PERMISSION_LABELS[p] || p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
