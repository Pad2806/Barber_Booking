import { Role, StaffPosition } from './types';

// ============== PERMISSION DEFINITIONS ==============

/**
 * All permissions in the system.
 * Convention: RESOURCE_ACTION
 */
export enum Permission {
    // Dashboard
    VIEW_DASHBOARD = 'VIEW_DASHBOARD',

    // Bookings
    VIEW_ALL_BOOKINGS = 'VIEW_ALL_BOOKINGS',
    VIEW_OWN_BOOKINGS = 'VIEW_OWN_BOOKINGS',
    MANAGE_BOOKINGS = 'MANAGE_BOOKINGS',

    // Staff
    VIEW_STAFF = 'VIEW_STAFF',
    MANAGE_STAFF = 'MANAGE_STAFF',

    // Services
    VIEW_SERVICES = 'VIEW_SERVICES',
    MANAGE_SERVICES = 'MANAGE_SERVICES',

    // Salons (branches)
    VIEW_SALONS = 'VIEW_SALONS',
    MANAGE_SALONS = 'MANAGE_SALONS',

    // Reviews
    VIEW_REVIEWS = 'VIEW_REVIEWS',
    REPLY_REVIEWS = 'REPLY_REVIEWS',

    // Revenue / Reports
    VIEW_REVENUE = 'VIEW_REVENUE',

    // Users management
    VIEW_USERS = 'VIEW_USERS',
    MANAGE_USERS = 'MANAGE_USERS',

    // System settings
    MANAGE_SETTINGS = 'MANAGE_SETTINGS',

    // Scheduling
    MANAGE_SCHEDULE = 'MANAGE_SCHEDULE',

    // Cashier-specific
    MANAGE_CHECKOUT = 'MANAGE_CHECKOUT',
    MANAGE_WALK_IN = 'MANAGE_WALK_IN',
    VIEW_ONLINE_BOOKINGS = 'VIEW_ONLINE_BOOKINGS',

    // Barber-specific
    VIEW_OWN_SCHEDULE = 'VIEW_OWN_SCHEDULE',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.SUPER_ADMIN]: Object.values(Permission), // all permissions

    [Role.SALON_OWNER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ALL_BOOKINGS,
        Permission.MANAGE_BOOKINGS,
        Permission.VIEW_STAFF,
        Permission.MANAGE_STAFF,
        Permission.VIEW_SERVICES,
        Permission.MANAGE_SERVICES,
        Permission.VIEW_SALONS,
        Permission.VIEW_REVIEWS,
        Permission.REPLY_REVIEWS,
        Permission.VIEW_REVENUE,
    ],

    [Role.MANAGER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ALL_BOOKINGS,
        Permission.MANAGE_BOOKINGS,
        Permission.VIEW_STAFF,
        Permission.MANAGE_STAFF,
        Permission.VIEW_SERVICES,
        Permission.MANAGE_SERVICES,
        Permission.VIEW_REVIEWS,
        Permission.REPLY_REVIEWS,
        Permission.VIEW_REVENUE,
        Permission.MANAGE_SCHEDULE,
    ],

    [Role.BARBER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_OWN_BOOKINGS,
        Permission.VIEW_OWN_SCHEDULE,
    ],

    [Role.CASHIER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ALL_BOOKINGS,
        Permission.MANAGE_BOOKINGS,
        Permission.MANAGE_CHECKOUT,
        Permission.MANAGE_WALK_IN,
        Permission.VIEW_ONLINE_BOOKINGS,
        Permission.VIEW_REVENUE,
    ],

    [Role.SKINNER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_OWN_BOOKINGS,
        Permission.VIEW_OWN_SCHEDULE,
    ],

    [Role.STAFF]: [],

    [Role.CUSTOMER]: [],
};

// ============== STAFF POSITION → PERMISSIONS MAPPING ==============

/**
 * For Role.STAFF, permissions are further determined by StaffPosition.
 */
const STAFF_POSITION_PERMISSIONS: Record<StaffPosition, Permission[]> = {
    [StaffPosition.MANAGER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ALL_BOOKINGS,
        Permission.MANAGE_BOOKINGS,
        Permission.VIEW_STAFF,
        Permission.MANAGE_STAFF,
        Permission.VIEW_SERVICES,
        Permission.MANAGE_SERVICES,
        Permission.VIEW_REVIEWS,
        Permission.REPLY_REVIEWS,
        Permission.VIEW_REVENUE,
    ],

    [StaffPosition.RECEPTIONIST]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ALL_BOOKINGS,
        Permission.MANAGE_BOOKINGS,
        Permission.VIEW_REVIEWS,
        Permission.REPLY_REVIEWS,
    ],

    [StaffPosition.STYLIST]: [
        Permission.VIEW_OWN_BOOKINGS,
    ],

    [StaffPosition.BARBER]: [
        Permission.VIEW_OWN_BOOKINGS,
    ],

    [StaffPosition.SENIOR_STYLIST]: [
        Permission.VIEW_OWN_BOOKINGS,
    ],

    [StaffPosition.MASTER_STYLIST]: [
        Permission.VIEW_OWN_BOOKINGS,
    ],

    [StaffPosition.SKINNER]: [
        Permission.VIEW_OWN_BOOKINGS,
    ],

    [StaffPosition.CASHIER]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ALL_BOOKINGS,
        Permission.MANAGE_BOOKINGS,
    ],
};

// ============== HELPER FUNCTIONS ==============

/**
 * Get all permissions for a user based on their role and optionally staff position.
 * This is the SINGLE SOURCE OF TRUTH for permission resolution.
 */
export function getUserPermissions(
    role: Role,
    staffPosition?: StaffPosition | string | null,
): Permission[] {
    if (role === Role.STAFF && staffPosition) {
        return STAFF_POSITION_PERMISSIONS[staffPosition as StaffPosition] || [];
    }
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a user has a specific permission.
 */
export function hasPermission(
    role: Role,
    permission: Permission,
    staffPosition?: StaffPosition | string | null,
): boolean {
    const perms = getUserPermissions(role, staffPosition);
    return perms.includes(permission);
}

// ============== MULTI-ROLE RBAC FUNCTIONS ==============

/**
 * Get all permissions for a user with MULTIPLE roles.
 * Returns the UNION of permissions from all assigned roles.
 */
export function getUserMultiRolePermissions(roles: Role[]): Permission[] {
    const allPerms = new Set<Permission>();
    for (const role of roles) {
        const perms = ROLE_PERMISSIONS[role] || [];
        perms.forEach(p => allPerms.add(p));
    }
    return Array.from(allPerms);
}

/**
 * Check if a user with multiple roles has a specific permission.
 */
export function hasMultiRolePermission(
    roles: Role[],
    permission: Permission,
): boolean {
    return getUserMultiRolePermissions(roles).includes(permission);
}

/**
 * Check if a user with multiple roles has ANY of the given permissions.
 */
export function hasAnyMultiRolePermission(
    roles: Role[],
    permissions: Permission[],
): boolean {
    const userPerms = getUserMultiRolePermissions(roles);
    return permissions.some(p => userPerms.includes(p));
}

/**
 * Check if a user has ANY of the given permissions.
 */
export function hasAnyPermission(
    role: Role,
    permissions: Permission[],
    staffPosition?: StaffPosition | string | null,
): boolean {
    const userPerms = getUserPermissions(role, staffPosition);
    return permissions.some(p => userPerms.includes(p));
}

// ============== ADMIN MENU CONFIGURATION (Legacy) ==============

/**
 * @deprecated Use DASHBOARD_MENU_ITEMS instead.
 * Kept for backward compatibility during migration.
 */
export const ADMIN_MENU_ITEMS = [
    { key: 'dashboard', href: '/admin', label: 'Dashboard', permission: Permission.VIEW_DASHBOARD },
    { key: 'bookings', href: '/admin/bookings', label: 'Đặt lịch', permission: Permission.VIEW_ALL_BOOKINGS },
    { key: 'staff', href: '/admin/staff', label: 'Nhân viên', permission: Permission.VIEW_STAFF },
    { key: 'leave-requests', href: '/admin/leave-requests', label: 'Duyệt nghỉ phép', permission: Permission.VIEW_STAFF },
    { key: 'schedule', href: '/admin/schedule', label: 'Lịch làm', permission: Permission.MANAGE_SCHEDULE },
    { key: 'services', href: '/admin/services', label: 'Dịch vụ', permission: Permission.VIEW_SERVICES },
    { key: 'salons', href: '/admin/salons', label: 'Chi nhánh', permission: Permission.VIEW_SALONS },
    { key: 'customers', href: '/admin/customers', label: 'Khách hàng', permission: Permission.VIEW_USERS },
    { key: 'reviews', href: '/admin/reviews', label: 'Đánh giá', permission: Permission.VIEW_REVIEWS },
    { key: 'branch-revenue', href: '/admin/branch-revenue', label: 'Doanh thu CN', permission: Permission.VIEW_REVENUE },
    { key: 'roles', href: '/admin/roles', label: 'Phân quyền', permission: Permission.MANAGE_STAFF },
    { key: 'settings', href: '/admin/settings', label: 'Cài đặt', permission: Permission.MANAGE_SETTINGS },
] as const;

// ============== UNIFIED DASHBOARD MENU CONFIGURATION ==============

/**
 * Each menu item must specify BOTH:
 *  - permission: the capability needed
 *  - roles: which roles are allowed to see this item in the sidebar
 *
 * Visibility = user has the permission AND user has at least one matching role.
 * SUPER_ADMIN always sees everything.
 */
export const DASHBOARD_MENU_ITEMS = [
    // ── Barber / Skinner section ──
    { key: 'my-schedule', href: '/dashboard/my-schedule', label: 'Lịch làm việc', permission: Permission.VIEW_OWN_SCHEDULE, section: 'barber', roles: [Role.BARBER, Role.SKINNER] },
    { key: 'my-bookings', href: '/dashboard/my-bookings', label: 'Lịch phân công', permission: Permission.VIEW_OWN_BOOKINGS, section: 'barber', roles: [Role.BARBER, Role.SKINNER] },

    // ── Cashier section ──
    { key: 'online-bookings', href: '/dashboard/online-bookings', label: 'Duyệt Online', permission: Permission.VIEW_ONLINE_BOOKINGS, section: 'cashier', roles: [Role.CASHIER] },
    { key: 'walk-in', href: '/dashboard/walk-in', label: 'Khách vãng lai', permission: Permission.MANAGE_WALK_IN, section: 'cashier', roles: [Role.CASHIER] },
    { key: 'appointments', href: '/dashboard/appointments', label: 'Lịch hẹn', permission: Permission.VIEW_ALL_BOOKINGS, section: 'cashier', roles: [Role.CASHIER] },
    { key: 'checkout', href: '/dashboard/checkout', label: 'Thanh toán', permission: Permission.MANAGE_CHECKOUT, section: 'cashier', roles: [Role.CASHIER] },
    { key: 'cashier-revenue', href: '/dashboard/revenue', label: 'Doanh thu', permission: Permission.VIEW_REVENUE, section: 'cashier', roles: [Role.CASHIER] },

    // ── Management section (Manager only) ──
    { key: 'dashboard', href: '/dashboard', label: 'Tổng quan', permission: Permission.VIEW_DASHBOARD, section: 'management', roles: [Role.MANAGER] },
    { key: 'bookings', href: '/dashboard/bookings', label: 'Đặt lịch', permission: Permission.VIEW_ALL_BOOKINGS, section: 'management', roles: [Role.MANAGER] },
    { key: 'staff', href: '/dashboard/staff', label: 'Nhân viên', permission: Permission.VIEW_STAFF, section: 'management', roles: [Role.MANAGER] },
    { key: 'leave-requests', href: '/dashboard/leave-requests', label: 'Nghỉ phép', permission: Permission.VIEW_STAFF, section: 'management', roles: [Role.MANAGER] },
    { key: 'schedule', href: '/dashboard/schedule', label: 'Lịch làm', permission: Permission.MANAGE_SCHEDULE, section: 'management', roles: [Role.MANAGER] },
    { key: 'services', href: '/dashboard/services', label: 'Dịch vụ', permission: Permission.VIEW_SERVICES, section: 'management', roles: [Role.MANAGER] },
    { key: 'reviews', href: '/dashboard/reviews', label: 'Đánh giá', permission: Permission.VIEW_REVIEWS, section: 'management', roles: [Role.MANAGER] },
    { key: 'revenue', href: '/dashboard/revenue', label: 'Doanh thu', permission: Permission.VIEW_REVENUE, section: 'management', roles: [Role.MANAGER] },

    // ── Admin section (SUPER_ADMIN only) ──
    { key: 'admin-dashboard', href: '/dashboard', label: 'Tổng quan', permission: Permission.VIEW_DASHBOARD, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'admin-bookings', href: '/dashboard/bookings', label: 'Đặt lịch', permission: Permission.VIEW_ALL_BOOKINGS, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'admin-staff', href: '/dashboard/staff', label: 'Nhân viên', permission: Permission.VIEW_STAFF, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'admin-leave', href: '/dashboard/leave-requests', label: 'Nghỉ phép', permission: Permission.VIEW_STAFF, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'admin-schedule', href: '/dashboard/schedule', label: 'Lịch làm', permission: Permission.MANAGE_SCHEDULE, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'admin-services', href: '/dashboard/services', label: 'Dịch vụ', permission: Permission.VIEW_SERVICES, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'admin-reviews', href: '/dashboard/reviews', label: 'Đánh giá', permission: Permission.VIEW_REVIEWS, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'admin-revenue', href: '/dashboard/revenue', label: 'Doanh thu', permission: Permission.VIEW_REVENUE, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'salons', href: '/dashboard/salons', label: 'Chi nhánh', permission: Permission.MANAGE_SALONS, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'customers', href: '/dashboard/customers', label: 'Khách hàng', permission: Permission.MANAGE_USERS, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'roles', href: '/dashboard/roles', label: 'Phân quyền', permission: Permission.MANAGE_USERS, section: 'admin', roles: [Role.SUPER_ADMIN] },
    { key: 'settings', href: '/dashboard/settings', label: 'Cài đặt', permission: Permission.MANAGE_SETTINGS, section: 'admin', roles: [Role.SUPER_ADMIN] },
] as const;

/**
 * Filter DASHBOARD_MENU_ITEMS for a user based on their roles.
 * An item is visible when:
 *  1. User has the required permission (from their roles union), AND
 *  2. User has at least one role listed in the item's 'roles' array.
 *
 * This prevents cross-section leaking (e.g. Manager seeing Cashier items).
 */
export function getVisibleDashboardMenuItems(userRoles: Role[]) {
    const perms = getUserMultiRolePermissions(userRoles);
    return DASHBOARD_MENU_ITEMS.filter(item =>
        perms.includes(item.permission as Permission) &&
        item.roles.some(r => userRoles.includes(r)),
    );
}

/**
 * Route → Permission mapping for middleware validation.
 * Maps pathname prefix → required permission.
 */
export const ROUTE_PERMISSION_MAP: Record<string, Permission> = {
    '/admin/settings': Permission.MANAGE_SETTINGS,
    '/admin/branch-revenue': Permission.VIEW_REVENUE,
    '/admin/roles': Permission.MANAGE_USERS,
    '/admin/salons': Permission.MANAGE_SALONS,
    '/admin/staff': Permission.VIEW_STAFF,
    '/admin/services': Permission.VIEW_SERVICES,
    '/admin/reviews': Permission.VIEW_REVIEWS,
    '/admin/customers': Permission.VIEW_USERS,
    '/admin/bookings': Permission.VIEW_ALL_BOOKINGS,
    '/admin': Permission.VIEW_DASHBOARD,
};

/**
 * DASHBOARD_ROUTE_PERMISSION_MAP — for /dashboard/* route protection in middleware.
 */
export const DASHBOARD_ROUTE_PERMISSION_MAP: Record<string, Permission> = {
    '/dashboard/settings': Permission.MANAGE_SETTINGS,
    '/dashboard/roles': Permission.MANAGE_USERS,
    '/dashboard/salons': Permission.MANAGE_SALONS,
    '/dashboard/customers': Permission.VIEW_USERS,
    '/dashboard/staff': Permission.VIEW_STAFF,
    '/dashboard/leave-requests': Permission.VIEW_STAFF,
    '/dashboard/schedule': Permission.MANAGE_SCHEDULE,
    '/dashboard/services': Permission.VIEW_SERVICES,
    '/dashboard/reviews': Permission.VIEW_REVIEWS,
    '/dashboard/revenue': Permission.VIEW_REVENUE,
    '/dashboard/bookings': Permission.VIEW_ALL_BOOKINGS,
    '/dashboard/appointments': Permission.VIEW_ALL_BOOKINGS,
    '/dashboard/checkout': Permission.MANAGE_CHECKOUT,
    '/dashboard/walk-in': Permission.MANAGE_WALK_IN,
    '/dashboard/online-bookings': Permission.VIEW_ONLINE_BOOKINGS,
    '/dashboard/my-schedule': Permission.VIEW_OWN_SCHEDULE,
    '/dashboard/my-bookings': Permission.VIEW_OWN_BOOKINGS,
    '/dashboard': Permission.VIEW_DASHBOARD,
};

// ============== ROLE DISPLAY INFO ==============

export const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
    [Role.SUPER_ADMIN]: { label: 'Super Admin', color: 'bg-red-500' },
    [Role.SALON_OWNER]: { label: 'Chủ Salon', color: 'bg-blue-500' },
    [Role.MANAGER]: { label: 'Quản lý', color: 'bg-indigo-500' },
    [Role.BARBER]: { label: 'Barber', color: 'bg-amber-500' },
    [Role.CASHIER]: { label: 'Thu ngân', color: 'bg-emerald-500' },
    [Role.SKINNER]: { label: 'Skinner', color: 'bg-cyan-500' },
    [Role.STAFF]: { label: 'Nhân viên', color: 'bg-green-500' },
    [Role.CUSTOMER]: { label: 'Khách hàng', color: 'bg-gray-500' },
};
