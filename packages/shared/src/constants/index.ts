// App Constants
export const APP_NAME = 'ReetroBarberShop';
export const APP_DESCRIPTION = 'Đặt lịch cắt tóc chuyên nghiệp';

// Time Constants
export const DEFAULT_OPEN_TIME = '08:30';
export const DEFAULT_CLOSE_TIME = '20:30';
export const TIME_SLOT_DURATION = 30; // minutes
export const BOOKING_CODE_PREFIX = 'RB';

// Pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

// Working Days
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_NAMES_VI: Record<string, string> = {
  Mon: 'Thứ 2',
  Tue: 'Thứ 3',
  Wed: 'Thứ 4',
  Thu: 'Thứ 5',
  Fri: 'Thứ 6',
  Sat: 'Thứ 7',
  Sun: 'Chủ nhật',
};

// Service Categories Labels
export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  HAIRCUT: 'Cắt tóc',
  HAIR_STYLING: 'Uốn/Duỗi',
  HAIR_COLORING: 'Nhuộm',
  HAIR_TREATMENT: 'Dưỡng tóc',
  SHAVE: 'Cạo râu',
  FACIAL: 'Chăm sóc da',
  COMBO: 'Combo',
  OTHER: 'Khác',
};

// Staff Position Labels
export const STAFF_POSITION_LABELS: Record<string, string> = {
  STYLIST: 'Stylist',
  SENIOR_STYLIST: 'Senior Stylist',
  MASTER_STYLIST: 'Master Stylist',
  SKINNER: 'Skinner',
  MANAGER: 'Quản lý',
};

// Booking Status Labels
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

// Payment Status Labels
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Đang chờ',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
};

// Role Labels
export const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên',
  SALON_OWNER: 'Chủ salon',
  SUPER_ADMIN: 'Quản trị viên',
};

// API Paths
export const API_PATHS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    GOOGLE: '/auth/google',
    FACEBOOK: '/auth/facebook',
    ZALO: '/auth/zalo',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  SALONS: '/salons',
  SERVICES: '/services',
  STAFF: '/staff',
  BOOKINGS: '/bookings',
  PAYMENTS: '/payments',
  REVIEWS: '/reviews',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    REPORTS: '/admin/reports',
  },
} as const;

// VietQR Banks
export const VIETQR_BANKS = [
  { code: '970422', name: 'MB Bank', shortName: 'MB' },
  { code: '970415', name: 'VietinBank', shortName: 'CTG' },
  { code: '970436', name: 'Vietcombank', shortName: 'VCB' },
  { code: '970418', name: 'BIDV', shortName: 'BIDV' },
  { code: '970405', name: 'Agribank', shortName: 'AGR' },
  { code: '970407', name: 'Techcombank', shortName: 'TCB' },
  { code: '970423', name: 'TPBank', shortName: 'TPB' },
  { code: '970432', name: 'VPBank', shortName: 'VPB' },
  { code: '970448', name: 'OCB', shortName: 'OCB' },
  { code: '970443', name: 'SHB', shortName: 'SHB' },
] as const;
