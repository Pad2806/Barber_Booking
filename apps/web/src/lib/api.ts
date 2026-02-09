import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  ward?: string;
  phone: string;
  openTime: string;
  closeTime: string;
  workingDays: string[];
  logo?: string;
  coverImage?: string;
  images: string[];
  rating?: number;
  totalReviews?: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: string;
  image?: string;
  salonId: string;
}

export interface Staff {
  id: string;
  position: string;
  bio?: string;
  rating: number;
  totalReviews: number;
  salonId: string;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  salon?: {
    id: string;
    name: string;
    slug?: string;
  };
}

export interface Booking {
  id: string;
  bookingCode: string;
  date: string;
  timeSlot: string;
  endTime: string;
  totalDuration: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  note?: string;
  salon: Salon;
  staff?: Staff;
  services: Array<{
    id: string;
    service: Service;
    price: number;
    duration: number;
  }>;
  createdAt: string;
}

export interface AdminBookingDetail extends Booking {
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  };
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  reply?: string;
  repliedAt?: string;
  isVisible: boolean;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    avatar?: string;
  };
  salon: {
    id: string;
    name: string;
  };
  staff?: {
    id: string;
    name: string;
  };
}

// Salon APIs
export const salonApi = {
  getAll: async (params?: { city?: string; search?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<PaginatedResponse<Salon>>('/salons', { params });
    return response.data;
  },
  getBySlug: async (slug: string) => {
    const response = await apiClient.get<Salon>(`/salons/${slug}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<Salon>(`/salons/id/${id}`);
    return response.data;
  },
};

// Service APIs
export const serviceApi = {
  getBySalon: async (salonId: string) => {
    const response = await apiClient.get<Service[]>('/services', { params: { salonId } });
    return response.data;
  },
};

// Staff APIs
export const staffApi = {
  getBySalon: async (salonId: string) => {
    const response = await apiClient.get<Staff[]>('/staff', { params: { salonId } });
    return response.data;
  },
  getAvailableSlots: async (salonId: string, date: string, duration: number, staffId?: string) => {
    const response = await apiClient.get<{ time: string; available: boolean }[]>('/staff/available-slots', {
      params: { salonId, date, duration, staffId },
    });
    return response.data;
  },
};

// Booking APIs
export const bookingApi = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<PaginatedResponse<Booking>>('/bookings', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    return response.data;
  },
  create: async (data: {
    salonId: string;
    staffId?: string;
    date: string;
    timeSlot: string;
    serviceIds: string[];
    note?: string;
  }) => {
    const response = await apiClient.post<Booking>('/bookings', data);
    return response.data;
  },
  cancel: async (id: string, reason?: string) => {
    const response = await apiClient.delete<Booking>(`/bookings/${id}`, { data: { reason } });
    return response.data;
  },
};

// Payment APIs
export const paymentApi = {
  generateQR: async (bookingId: string) => {
    const response = await apiClient.post<{
      qrCode: string;
      qrContent: string;
      amount: number;
      bankCode: string;
      bankAccount: string;
      bankName: string;
    }>('/payments/create-qr', { bookingId });
    return response.data;
  },
  getStatus: async (bookingId: string) => {
    const response = await apiClient.get(`/payments/${bookingId}/status`);
    return response.data;
  },
};

// Admin APIs
export interface DashboardStats {
  totalUsers: number;
  totalSalons: number;
  totalBookings: number;
  todayBookings: number;
  monthBookings: number;
  bookingGrowth: number;
  monthRevenue: number;
  revenueGrowth: number;
  pendingBookings: number;
  recentBookings: Booking[];
}

export interface BookingStats {
  totalBookings: number;
  byStatus: Record<string, number>;
  dailyBookings: Array<{ date: string; count: number }>;
}

export interface RevenueStats {
  totalRevenue: number;
  averageOrderValue: number;
  dailyRevenue: Array<{ date: string; amount: number }>;
}

export const adminApi = {
  getDashboardStats: async () => {
    const response = await apiClient.get<DashboardStats>('/admin/dashboard');
    return response.data;
  },
  getBookingStats: async (period: 'week' | 'month' | 'year' = 'month') => {
    const response = await apiClient.get<BookingStats>('/admin/bookings/stats', { params: { period } });
    return response.data;
  },
  getRevenueStats: async (period: 'week' | 'month' | 'year' = 'month') => {
    const response = await apiClient.get<RevenueStats>('/admin/revenue/stats', { params: { period } });
    return response.data;
  },
  getAllBookings: async (params?: {
    skip?: number;
    take?: number;
    status?: string;
    salonId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get<PaginatedResponse<Booking>>('/admin/bookings', { params });
    return response.data;
  },
  getBookingById: async (bookingId: string) => {
    const response = await apiClient.get<AdminBookingDetail>(`/bookings/${bookingId}`);
    return response.data;
  },
  updateBookingStatus: async (bookingId: string, status: string) => {
    const response = await apiClient.patch<Booking>(`/admin/bookings/${bookingId}/status`, { status });
    return response.data;
  },
  getAllStaff: async (params?: { skip?: number; take?: number; salonId?: string; search?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Staff>>('/admin/staff', { params });
    return response.data;
  },
  getStaffById: async (staffId: string) => {
    const response = await apiClient.get<Staff>(`/staff/${staffId}`);
    return response.data;
  },
  createStaff: async (data: any) => {
    const response = await apiClient.post<Staff>('/users/staff', data);
    return response.data;
  },
  updateStaff: async (staffId: string, data: any) => {
    const response = await apiClient.patch<Staff>(`/users/${staffId}/staff`, data);
    return response.data;
  },
  deleteStaff: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },
  getAllServices: async (params?: { skip?: number; take?: number; salonId?: string; category?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Service>>('/admin/services', { params });
    return response.data;
  },
  getAllSalons: async (params?: { skip?: number; take?: number; city?: string; isActive?: boolean }) => {
    const response = await apiClient.get<PaginatedResponse<Salon>>('/admin/salons', { params });
    return response.data;
  },
  getAllReviews: async (params?: { skip?: number; take?: number; salonId?: string; rating?: number }) => {
    const response = await apiClient.get<PaginatedResponse<Review>>('/admin/reviews', { params });
    return response.data;
  },
  createService: async (data: { name: string; description?: string | null; price: number; duration: number; category: string; isActive?: boolean }) => {
    const response = await apiClient.post<Service>('/services', data);
    return response.data;
  },
  updateService: async (id: string, data: Partial<{ name: string; description: string; price: number; duration: number; category: string }>) => {
    const response = await apiClient.patch<Service>(`/services/${id}`, data);
    return response.data;
  },
  deleteService: async (id: string) => {
    await apiClient.delete(`/services/${id}`);
  },
};

export default apiClient;
