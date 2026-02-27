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
}

// ============== ROLE → PERMISSIONS MAPPING ==============

/**
 * Base permissions by Role.
 * Role hierarchy is NOT implicit. Each role explicitly lists what it can do.
 */
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

    [Role.STAFF]: [], // Staff permissions depend on position, see below

    [Role.CUSTOMER]: [], // No admin permissions
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

    [StaffPosition.SENIOR_STYLIST]: [
        Permission.VIEW_OWN_BOOKINGS,
    ],

    [StaffPosition.MASTER_STYLIST]: [
        Permission.VIEW_OWN_BOOKINGS,
    ],

    [StaffPosition.SKINNER]: [
        Permission.VIEW_OWN_BOOKINGS,
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

// ============== ADMIN MENU CONFIGURATION ==============

/**
 * Admin menu items with required permissions.
 * Used by BOTH backend (to validate routes) and frontend (to render menus).
 */
export const ADMIN_MENU_ITEMS = [
    { key: 'dashboard', href: '/admin', label: 'Dashboard', permission: Permission.VIEW_DASHBOARD },
    { key: 'bookings', href: '/admin/bookings', label: 'Đặt lịch', permission: Permission.VIEW_ALL_BOOKINGS },
    { key: 'staff', href: '/admin/staff', label: 'Nhân viên', permission: Permission.VIEW_STAFF },
    { key: 'services', href: '/admin/services', label: 'Dịch vụ', permission: Permission.VIEW_SERVICES },
    { key: 'salons', href: '/admin/salons', label: 'Chi nhánh', permission: Permission.VIEW_SALONS },
    { key: 'reviews', href: '/admin/reviews', label: 'Đánh giá', permission: Permission.VIEW_REVIEWS },
    { key: 'settings', href: '/admin/settings', label: 'Cài đặt', permission: Permission.MANAGE_SETTINGS },
] as const;

/**
 * Route → Permission mapping for middleware validation.
 * Maps pathname prefix → required permission.
 */
export const ROUTE_PERMISSION_MAP: Record<string, Permission> = {
    '/admin/settings': Permission.MANAGE_SETTINGS,
    '/admin/salons': Permission.VIEW_SALONS,
    '/admin/staff': Permission.VIEW_STAFF,
    '/admin/services': Permission.VIEW_SERVICES,
    '/admin/reviews': Permission.VIEW_REVIEWS,
    '/admin/bookings': Permission.VIEW_ALL_BOOKINGS,
    '/admin': Permission.VIEW_DASHBOARD,
};

// ============== ROLE DISPLAY INFO ==============

export const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
    [Role.SUPER_ADMIN]: { label: 'Super Admin', color: 'bg-red-500' },
    [Role.SALON_OWNER]: { label: 'Chủ Salon', color: 'bg-blue-500' },
    [Role.STAFF]: { label: 'Nhân viên', color: 'bg-green-500' },
    [Role.CUSTOMER]: { label: 'Khách hàng', color: 'bg-gray-500' },
};
