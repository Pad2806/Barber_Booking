import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return '-';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    return '-';
  }
}

// Booking status
export const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'bg-indigo-100 text-indigo-800' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  NO_SHOW: { label: 'Không đến', color: 'bg-gray-100 text-gray-800' },
};

// Payment status
export const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  UNPAID: { label: 'Chưa thanh toán', color: 'bg-gray-100 text-gray-800' },
  PENDING: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-red-100 text-red-800' },
};

// Service categories
export const SERVICE_CATEGORIES: Record<string, { label: string; icon: string }> = {
  HAIRCUT: { label: 'Cắt tóc', icon: '✂️' },
  HAIR_STYLING: { label: 'Uốn/Duỗi', icon: '💇' },
  HAIR_COLORING: { label: 'Nhuộm', icon: '🎨' },
  HAIR_TREATMENT: { label: 'Dưỡng tóc', icon: '✨' },
  SHAVE: { label: 'Cạo râu', icon: '🪒' },
  FACIAL: { label: 'Chăm sóc da', icon: '🧴' },
  COMBO: { label: 'Combo', icon: '📦' },
  OTHER: { label: 'Khác', icon: '💈' },
};

// Staff positions
export const STAFF_POSITIONS: Record<string, string> = {
  STYLIST: 'Stylist',
  SENIOR_STYLIST: 'Senior Stylist',
  MASTER_STYLIST: 'Master Stylist',
  SKINNER: 'Skinner',
  MANAGER: 'Quản lý',
};
