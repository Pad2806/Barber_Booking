// API Configuration
const isProd = import.meta.env.PROD;

const apiBaseUrlFromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';

// Notes:
// - In dev, the Nest API defaults to PORT=4000 and sets global prefix to /api.
// - When testing on a phone, `localhost` points to the phone itself; set VITE_API_BASE_URL
//   to your computer's LAN IP (e.g. http://192.168.1.10:4000/api).
export const API_BASE_URL = apiBaseUrlFromEnv
  ? apiBaseUrlFromEnv
  : isProd
    ? 'https://api.reetro.vn/api'
    : 'http://localhost:4000/api';

// Zalo App Configuration
// Note: Vite exposes env vars via import.meta.env.
// If you need to override these locally, add them to apps/zalo/.env as VITE_ZALO_APP_ID / VITE_ZALO_OA_ID.
export const ZALO_APP_ID = (import.meta.env.VITE_ZALO_APP_ID as string | undefined) || '';
export const ZALO_OA_ID = (import.meta.env.VITE_ZALO_OA_ID as string | undefined) || '';

// Brand Configuration (for Zalo Mini App)
export const BRAND_CONFIG = {
  name: 'ReetroBarberShop',
  appName: 'ReetroBarberShop',
  tagline: 'Phong cách - Đẳng cấp - Chất lượng',
  phone: '1900 xxxx xx',
  logoUrl: 'https://reetro.vn/logo.png', // Update with actual logo URL
  zaloOAId: ZALO_OA_ID,
  colors: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#e94560',
  },
} as const;

// Legacy BRAND export (for backward compatibility)
export const BRAND = BRAND_CONFIG;

// Booking Configuration
export const BOOKING_CONFIG = {
  minAdvanceHours: 1, // Đặt lịch trước ít nhất 1 giờ
  maxAdvanceDays: 30, // Đặt lịch trước tối đa 30 ngày
  slotDurationMinutes: 30, // Mỗi slot 30 phút
  paymentTimeoutMinutes: 15, // Timeout thanh toán 15 phút
} as const;

// Booking Status Labels
export const BOOKING_STATUS = {
  PENDING: { label: 'Chờ xác nhận', color: 'yellow' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'blue' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'indigo' },
  COMPLETED: { label: 'Hoàn thành', color: 'green' },
  CANCELLED: { label: 'Đã hủy', color: 'red' },
  NO_SHOW: { label: 'Không đến', color: 'gray' },
} as const;

// Service Categories Labels
export const SERVICE_CATEGORIES = {
  HAIRCUT: { label: 'Cắt tóc', icon: 'zi-star' },
  HAIR_STYLING: { label: 'Uốn/Duỗi', icon: 'zi-retry' },
  HAIR_COLORING: { label: 'Nhuộm', icon: 'zi-camera' },
  HAIR_TREATMENT: { label: 'Dưỡng tóc', icon: 'zi-upload' },
  SHAVE: { label: 'Cạo râu', icon: 'zi-check' },
  FACIAL: { label: 'Chăm sóc da', icon: 'zi-user' },
  COMBO: { label: 'Combo', icon: 'zi-more-horiz' },
  OTHER: { label: 'Khác', icon: 'zi-more-horiz' },
} as const;

// Staff Positions Labels
export const STAFF_POSITIONS = {
  STYLIST: 'Stylist',
  SENIOR_STYLIST: 'Senior Stylist',
  MASTER_STYLIST: 'Master Stylist',
  SKINNER: 'Skinner',
  MANAGER: 'Quản lý',
} as const;
