import axios from 'axios';
import {
  PaginatedResponse,
  Salon,
  Service,
  Staff,
  Booking,
  BookingQueryDto,
  AdminBookingDetail,
  Review,
  DashboardStats,
  BookingStats,
  RevenueStats,
  StaffShift,
  UploadFolder,
  User
} from './types';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export * from './types';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async config => {
    if (typeof window !== 'undefined') {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Salon APIs
export const salonApi = {
  getAll: async (params?: { city?: string; search?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<PaginatedResponse<Salon>>('/salons', { params });
    return response.data;
  },
  getBySlug: async (slug: string) => {
    const response = await apiClient.get<Salon>(`/salons/slug/${slug}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<Salon>(`/salons/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post<Salon>('/salons', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.patch<Salon>(`/salons/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/salons/${id}`);
    return response.data;
  },
};

// Service APIs
export const serviceApi = {
  getAll: async (params?: { category?: string; search?: string; page?: number; limit?: number; sortBy?: string }) => {
    const response = await apiClient.get<PaginatedResponse<Service>>('/services', { params });
    return response.data;
  },
  getBySalon: async (salonId: string) => {
    const response = await apiClient.get<Service[]>(`/services/salon/${salonId}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<Service>(`/services/${id}`);
    return response.data;
  },
  getAnalytics: async (salonId: string) => {
    const response = await apiClient.get('/services/analytics', { params: { salonId } });
    return response.data;
  },
};

// Staff APIs
export const staffApi = {
  getBySalon: async (salonId: string) => {
    const response = await apiClient.get<Staff[]>(`/staff/salon/${salonId}`);
    return response.data;
  },
  getTop: async (limit: number = 10) => {
    const response = await apiClient.get<Staff[]>('/staff/top', { params: { limit } });
    return response.data;
  },
  getAvailableSlots: async (salonId: string, date: string, duration: number, staffId?: string) => {
    if (staffId) {
      const response = await apiClient.get<string[]>(`/staff/${staffId}/available-slots`, {
        params: { date, salonId, duration },
      });
      return response.data.map(time => ({ time, available: true }));
    }

    // "Any Stylist" selected: fetch slots for all barbers and merge them
    const staffList = await apiClient.get<Staff[]>(`/staff/salon/${salonId}`).then(res => res.data);
    const barbers = staffList.filter(s =>
      ['STYLIST', 'SENIOR_STYLIST', 'MASTER_STYLIST'].includes(s.position.toUpperCase())
    );

    const promises = barbers.map(b =>
      apiClient
        .get<string[]>(`/staff/${b.id}/available-slots`, { params: { date, salonId, duration } })
        .then(res => res.data)
        .catch(() => [] as string[])
    );

    const results = await Promise.all(promises);
    const allSlots = new Set<string>();

    results.forEach(slots => {
      if (Array.isArray(slots)) {
        slots.forEach(slot => allSlots.add(slot));
      }
    });

    return Array.from(allSlots)
      .sort()
      .map(time => ({ time, available: true }));
  },
  getSchedules: async (date?: string) => {
    const response = await apiClient.get<StaffShift[]>('/staff/my-schedules', { params: { date } });
    return response.data;
  },
  getSalonSchedules: async (salonId: string, date?: string) => {
    const response = await apiClient.get<StaffShift[]>('/staff/salon-schedules', { params: { salonId, date } });
    return response.data;
  },
  assignShift: async (data: {
    staffId: string;
    salonId: string;
    date: string;
    shiftStart: string;
    shiftEnd: string;
  }) => {
    const response = await apiClient.post<StaffShift>('/staff/assign-shift', data);
    return response.data;
  },
  removeShift: async (id: string) => {
    const response = await apiClient.delete(`/staff/remove-shift/${id}`);
    return response.data;
  },

  // --- STAFF DASHBOARD APIS ---
  getDashboardStats: async () => {
    const response = await apiClient.get('/staff/me/dashboard');
    return response.data;
  },
  getTodaySchedule: async (date: string) => {
    const response = await apiClient.get('/staff/me/schedule', { params: { date } });
    return response.data;
  },
  getWeeklyCustomers: async () => {
    const response = await apiClient.get('/staff/me/weekly-customers');
    return response.data;
  },
  updateBookingStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/staff/me/bookings/${id}/status`, { status });
    return response.data;
  },
  addCustomerNote: async (customerId: string, content: string) => {
    const response = await apiClient.post(`/staff/me/customers/${customerId}/notes`, { content });
    return response.data;
  },
  getCustomerHistory: async (customerId: string) => {
    const response = await apiClient.get(`/staff/me/customers/${customerId}/history`);
    return response.data;
  },
  registerDayOff: async (date: string, reason?: string) => {
    const response = await apiClient.post('/staff/me/day-off', { date, reason });
    return response.data;
  },

  // --- STAFF PROFILE & ACHIEVEMENTS ---
  getProfile: async (staffId: string) => {
    const response = await apiClient.get(`/staff/${staffId}/profile`);
    return response.data;
  },
  updateProfile: async (staffId: string, data: {
    bio?: string;
    longDescription?: string;
    specialties?: string[];
    experience?: number;
    gallery?: string[];
  }) => {
    const response = await apiClient.patch(`/staff/${staffId}`, data);
    return response.data;
  },
  addAchievement: async (staffId: string, data: { title: string; year?: number; description?: string; icon?: string }) => {
    const response = await apiClient.post(`/staff/${staffId}/achievements`, data);
    return response.data;
  },
  updateAchievement: async (achievementId: string, data: { title?: string; year?: number; description?: string; icon?: string }) => {
    const response = await apiClient.patch(`/staff/achievements/${achievementId}`, data);
    return response.data;
  },
  deleteAchievement: async (achievementId: string) => {
    const response = await apiClient.delete(`/staff/achievements/${achievementId}`);
    return response.data;
  },
};

export const managerApi = {
  getDashboardStats: async () => {
    const response = await apiClient.get('/manager/dashboard');
    return response.data;
  },
  getStaff: async (params?: any) => {
    const response = await apiClient.get('/manager/staff', { params });
    return response.data;
  },
  getStaffById: async (staffId: string) => {
    const response = await apiClient.get(`/manager/staff/${staffId}`);
    return response.data;
  },
  getStaffPerformance: async (staffId: string) => {
    const response = await apiClient.get(`/manager/staff/${staffId}/performance`);
    return response.data;
  },
  rateStaff: async (staffId: string, data: any) => {
    const response = await apiClient.post(`/manager/staff/${staffId}/performance`, data);
    return response.data;
  },
  getLeaveRequests: async () => {
    const response = await apiClient.get('/manager/leave-requests');
    return response.data;
  },
  approveLeave: async (id: string, data: { status: string; reason?: string }) => {
    const response = await apiClient.patch(`/manager/leave-requests/${id}/status`, data);
    return response.data;
  },
  getBookings: async (params: any) => {
    const response = await apiClient.get('/manager/bookings', { params });
    return response.data;
  },
  getServices: async () => {
    const response = await apiClient.get('/manager/services');
    return response.data;
  },
  rescheduleBooking: async (id: string, data: any) => {
    const response = await apiClient.patch(`/manager/bookings/${id}/reschedule`, data);
    return response.data;
  },
  getRevenueReport: async (period: string = 'month') => {
    const response = await apiClient.get('/manager/reports/revenue', { params: { period } });
    return response.data;
  },
  getReviews: async () => {
    const response = await apiClient.get('/manager/reviews');
    return response.data;
  },
  replyToReview: async (id: string, reply: string) => {
    const response = await apiClient.post(`/manager/reviews/${id}/reply`, { reply });
    return response.data;
  },
  getSchedules: async (date?: string, startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/manager/schedules', { params: { date, startDate, endDate } });
    return response.data;
  },
  createShift: async (data: any) => {
    const response = await apiClient.post('/manager/schedules', data);
    return response.data;
  },
  bulkCreateShifts: async (data: { staffIds: string[]; dates: string[]; type: string }) => {
    const response = await apiClient.post('/manager/schedules/bulk', data);
    return response.data;
  },
  updateShift: async (id: string, data: any) => {
    const response = await apiClient.patch(`/manager/schedules/${id}`, data);
    return response.data;
  },
  deleteShift: async (id: string) => {
    const response = await apiClient.delete(`/manager/schedules/${id}`);
    return response.data;
  },
  createStaff: async (data: any) => {
    const response = await apiClient.post('/manager/staff', data);
    return response.data;
  },
  updateStaff: async (id: string, data: any) => {
    const response = await apiClient.patch(`/manager/staff/${id}`, data);
    return response.data;
  },
  deleteStaff: async (id: string) => {
    const response = await apiClient.delete(`/manager/staff/${id}`);
    return response.data;
  },
  updateBookingStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/manager/bookings/${id}/status`, { status });
    return response.data;
  },
  bulkUpdateBookingStatus: async (ids: string[], status: string) => {
    const response = await apiClient.patch('/manager/bookings/bulk-status', { ids, status });
    return response.data;
  },
  exportBookings: async (params: any) => {
    const response = await apiClient.get('/manager/bookings/export', { params, responseType: 'blob' });
    return response.data;
  },
};

export const cashierApi = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await apiClient.get('/cashier/dashboard');
    return response.data;
  },

  // Online Bookings
  getPendingBookings: async () => {
    const response = await apiClient.get('/cashier/bookings/pending');
    return response.data;
  },
  approveBooking: async (id: string, data: { staffId?: string; timeSlot?: string; date?: string }) => {
    const response = await apiClient.patch(`/cashier/bookings/${id}/approve`, data);
    return response.data;
  },
  rejectBooking: async (id: string, reason: string) => {
    const response = await apiClient.patch(`/cashier/bookings/${id}/reject`, { reason });
    return response.data;
  },

  // Bookings
  getBookings: async (params: { date?: string; status?: string; search?: string }) => {
    const response = await apiClient.get('/cashier/bookings', { params });
    return response.data;
  },
  getBookingDetail: async (id: string) => {
    const response = await apiClient.get(`/cashier/bookings/${id}`);
    return response.data;
  },
  getCheckoutEligibleBookings: async () => {
    const response = await apiClient.get('/cashier/bookings/checkout-eligible');
    return response.data;
  },

  // Walk-in
  createWalkinBooking: async (data: {
    customerName: string;
    phone?: string;
    serviceIds: string[];
    staffId?: string;
    note?: string;
  }) => {
    const response = await apiClient.post('/cashier/bookings/walk-in', data);
    return response.data;
  },

  // Services
  addServices: async (id: string, serviceIds: string[]) => {
    const response = await apiClient.patch(`/cashier/bookings/${id}/add-services`, { serviceIds });
    return response.data;
  },

  // Checkout
  checkout: async (id: string, method: string) => {
    const response = await apiClient.post(`/cashier/bookings/${id}/checkout`, { method });
    return response.data;
  },

  // Status
  updateBookingStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/cashier/bookings/${id}/status`, { status });
    return response.data;
  },

  // Revenue
  getRevenue: async () => {
    const response = await apiClient.get('/cashier/revenue');
    return response.data;
  },

  // Payment History
  getPaymentHistory: async (date?: string) => {
    const response = await apiClient.get('/cashier/payment-history', { params: { date } });
    return response.data;
  },

  // Queue
  getQueue: async () => {
    const response = await apiClient.get('/cashier/queue');
    return response.data;
  },
  addToQueue: async (data: { customerName: string; phone?: string; serviceId?: string; staffId?: string }) => {
    const response = await apiClient.post('/cashier/queue', data);
    return response.data;
  },
  updateQueueStatus: async (id: string, data: { status: string; staffId?: string }) => {
    const response = await apiClient.patch(`/cashier/queue/${id}/status`, data);
    return response.data;
  },

  // Barbers
  getAvailableBarbers: async (date: string, timeSlot: string) => {
    const response = await apiClient.get('/cashier/barbers/available', { params: { date, timeSlot } });
    return response.data;
  },

  // Customers
  searchCustomers: async (query: string) => {
    const response = await apiClient.get('/cashier/customers/search', { params: { q: query } });
    return response.data;
  },
};

// Booking APIs
export const bookingApi = {
  getAll: async (params?: BookingQueryDto) => {
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
    const response = await apiClient.patch<Booking>(`/bookings/${id}/cancel`, { reason });
    return response.data;
  },
  getMy: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get<PaginatedResponse<Booking>>('/bookings/my-bookings', {
      params,
    });
    return response.data;
  },
};

// Payment APIs
export const paymentApi = {
  generateQR: async (bookingId: string) => {
    const response = await apiClient.post<{
      id: string;
      qrCodeUrl: string;
      qrContent: string;
      amount: number;
      bankCode: string;
      bankAccount: string;
      bankName: string;
    }>('/payments', { bookingId, method: 'VIETQR' });

    return {
      ...response.data,
      qrCode: response.data.qrCodeUrl || '',
    };
  },
  getStatus: async (bookingId: string) => {
    const response = await apiClient.get<{
      isFullyPaid: boolean;
      depositPaid: number;
    }>(`/payments/booking/${bookingId}/summary`);

    if (response.data && response.data.depositPaid > 0) {
      return { paymentStatus: 'PAID' };
    }
    return { paymentStatus: 'PENDING' };
  },
  getSummary: async (bookingId: string) => {
    const response = await apiClient.get<{
      totalAmount: number;
      depositPaid: number;
      finalPaid: number;
      totalPaid: number;
      remaining: number;
      isFullyPaid: boolean;
      payments: any[];
    }>(`/payments/booking/${bookingId}/summary`);
    return response.data;
  },
  checkout: async (bookingId: string, method: string) => {
    const response = await apiClient.post(`/payments/booking/${bookingId}/checkout`, { method });
    return response.data;
  },
  confirm: async (paymentId: string) => {
    const response = await apiClient.post(`/payments/${paymentId}/confirm`);
    return response.data;
  },
};



export const adminApi = {
  getDashboardStats: async () => {
    const response = await apiClient.get<DashboardStats>('/admin/dashboard');
    return response.data;
  },
  getAllUsers: async (params?: {
    skip?: number;
    take?: number;
    role?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },
  getUserById: async (userId: string) => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },
  getBookingStats: async (period: 'week' | 'month' | 'year' = 'month') => {
    const response = await apiClient.get<BookingStats>('/admin/bookings/stats', {
      params: { period },
    });
    return response.data;
  },
  getRevenueStats: async (period: 'week' | 'month' | 'year' = 'month') => {
    const response = await apiClient.get<RevenueStats>('/admin/revenue/stats', {
      params: { period },
    });
    return response.data;
  },
  getAllBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    salonId?: string;
    staffId?: string;
    serviceId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get<PaginatedResponse<Booking>>('/admin/bookings', { params });
    return response.data;
  },
  bulkUpdateBookingStatus: async (ids: string[], status: string) => {
    const response = await apiClient.patch('/admin/bookings/bulk-status', { ids, status });
    return response.data;
  },
  exportBookings: async (params?: any) => {
    const response = await apiClient.get('/admin/bookings/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  getBranchAnalytics: async () => {
    const response = await apiClient.get('/admin/analytics/branches');
    return response.data;
  },
  getServiceAnalytics: async (salonId?: string) => {
    const response = await apiClient.get('/admin/analytics/services', { params: { salonId } });
    return response.data;
  },
  getBarberRanking: async (limit: number = 10) => {
    const response = await apiClient.get<any[]>('/admin/analytics/barbers/ranking', { params: { limit } });
    return response.data;
  },
  getBarberOfTheMonth: async () => {
    const response = await apiClient.get<any>('/admin/analytics/barbers/of-the-month');
    return response.data;
  },
  getBarberHistory: async (limit: number = 6) => {
    const response = await apiClient.get<any[]>('/admin/analytics/barbers/history', { params: { limit } });
    return response.data;
  },
  getRatingDistribution: async () => {
    const response = await apiClient.get<Array<{ star: number; count: number }>>('/admin/analytics/ratings/distribution');
    return response.data;
  },
  getBarberAverages: async () => {
    const response = await apiClient.get<Array<{ id: string; name: string; averageRating: number }>>('/admin/analytics/barbers/averages');
    return response.data;
  },
  getStaffAnalytics: async (staffId: string) => {
    const response = await apiClient.get(`/admin/staff/${staffId}/analytics`);
    return response.data;
  },
  registerStaffLeave: async (staffId: string, data: { startDate: Date; endDate: Date; reason?: string }) => {
    const response = await apiClient.post(`/admin/staff/${staffId}/leaves`, data);
    return response.data;
  },
  getStaffLeaves: async (staffId: string) => {
    const response = await apiClient.get(`/admin/staff/${staffId}/leaves`);
    return response.data;
  },
  getGlobalLeaveRequests: async (params?: { status?: string; search?: string; salonId?: string }) => {
    const response = await apiClient.get<any[]>('/admin/leave-requests', { params });
    return response.data;
  },
  approveGlobalLeave: async (id: string, data: { status: string; reason?: string }) => {
    const response = await apiClient.patch(`/admin/leave-requests/${id}/status`, data);
    return response.data;
  },
  getSchedules: async (salonId: string, date?: string, startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/admin/schedules', { params: { salonId, date, startDate, endDate } });
    return response.data;
  },
  createSchedule: async (data: any) => {
    const response = await apiClient.post('/admin/schedules', data);
    return response.data;
  },
  updateSchedule: async (id: string, data: any) => {
    const response = await apiClient.patch(`/admin/schedules/${id}`, data);
    return response.data;
  },
  deleteSchedule: async (id: string) => {
    const response = await apiClient.delete(`/admin/schedules/${id}`);
    return response.data;
  },
  bulkCreateSchedules: async (data: { salonId: string; staffIds: string[]; dates: string[]; type: string }) => {
    const response = await apiClient.post('/admin/schedules/bulk', data);
    return response.data;
  },
  getBookingById: async (bookingId: string) => {
    const response = await apiClient.get<AdminBookingDetail>(`/bookings/${bookingId}`);
    return response.data;
  },
  updateBookingStatus: async (bookingId: string, status: string) => {
    const response = await apiClient.patch<Booking>(`/admin/bookings/${bookingId}/status`, {
      status,
    });
    return response.data;
  },
  addServiceToBooking: async (bookingId: string, serviceIds: string[]) => {
    const response = await apiClient.patch<Booking>(`/bookings/${bookingId}/add-service`, {
      serviceIds,
    });
    return response.data;
  },
  getAllStaff: async (params?: {
    page?: number;
    limit?: number;
    salonId?: string;
    minRating?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get<PaginatedResponse<Staff>>('/admin/staff', { params });
    return response.data;
  },
  getStaffById: async (staffId: string) => {
    const response = await apiClient.get<Staff>(`/admin/staff/${staffId}`);
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
  getAllServices: async (params?: {
    page?: number;
    limit?: number;
    salonId?: string;
    category?: string;
    isActive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get<PaginatedResponse<Service>>('/admin/services', { params });
    return response.data;
  },
  getAllSalons: async (params?: {
    page?: number;
    limit?: number;
    city?: string;
    isActive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get<PaginatedResponse<Salon>>('/admin/salons', { params });
    return response.data;
  },
  getAllReviews: async (params?: {
    page?: number;
    limit?: number;
    salonId?: string;
    rating?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get<PaginatedResponse<Review>>('/admin/reviews', { params });
    return response.data;
  },
  createService: async (data: any) => {
    const response = await apiClient.post<Service>('/services', data);
    return response.data;
  },
  bulkCreateService: async (data: any) => {
    const response = await apiClient.post('/services/bulk', data);
    return response.data;
  },
  updateService: async (id: string, data: any) => {
    const response = await apiClient.patch<Service>(`/services/${id}`, data);
    return response.data;
  },
  deleteService: async (id: string) => {
    await apiClient.delete(`/services/${id}`);
  },
  replyReview: async (reviewId: string, reply: string) => {
    const response = await apiClient.patch(`/reviews/${reviewId}/reply`, { reply });
    return response.data;
  },
  deleteReview: async (id: string) => {
    await apiClient.delete(`/reviews/${id}`);
  },
  getSettings: async () => {
    const response = await apiClient.get<Record<string, any>>('/admin/settings');
    return response.data;
  },
  updateSettings: async (data: Record<string, any>) => {
    const response = await apiClient.patch<Record<string, any>>('/admin/settings', data);
    return response.data;
  },
  getBranchRevenue: async (params?: { period?: string; search?: string }) => {
    const response = await apiClient.get<any>('/admin/branch-revenue', { params });
    return response.data;
  },
  getBranchRevenueDetail: async (salonId: string, params?: { period?: string }) => {
    const response = await apiClient.get<any>(`/admin/branch-revenue/${salonId}`, { params });
    return response.data;
  },
};

// Review APIs
export const reviewApi = {
  create: async (data: { bookingId: string; rating: number; staffRating?: number; comment?: string; images?: string[] }) => {
    const response = await apiClient.post<Review>('/reviews', data);
    return response.data;
  },
  getBySalon: async (
    salonId: string,
    params?: {
      skip?: number;
      take?: number;
      minRating?: number;
      rating?: number;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => {
    const response = await apiClient.get<PaginatedResponse<Review>>(`/reviews/salon/${salonId}`, { params });
    return response.data;
  },
};

// Upload APIs
export const uploadApi = {
  uploadImage: async (file: File, folder: UploadFolder = 'avatars') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string; publicId: string }>(
      `/upload?folder=${folder}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  uploadMultiple: async (files: File[], folder: UploadFolder = 'avatars') => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await apiClient.post<Array<{ url: string; publicId: string }>>(
      `/upload/multiple?folder=${folder}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  uploadVideo: async (file: File, folder: UploadFolder = 'services') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string; publicId: string }>(
      `/upload/video?folder=${folder}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
    );
    return response.data;
  },
};

// Users APIs
export const usersApi = {
  getMe: async () => {
    const response = await apiClient.get<User & { staff?: Staff }>('/users/me');
    return response.data;
  },
};

// Public Settings API (no auth required)
export const settingsApi = {
  getPublic: async () => {
    const response = await apiClient.get<Record<string, any>>('/settings/public');
    return response.data;
  },
};

// Notification API
export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getAll: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const response = await apiClient.get<{ data: NotificationItem[]; meta: any }>('/notifications', { params });
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },
};

// User Roles (RBAC) APIs
export const userRoleApi = {
  getUserRoles: async (userId: string) => {
    const response = await apiClient.get(`/admin/users/${userId}/roles`);
    return response.data;
  },
  updateUserRoles: async (userId: string, roles: { role: string; salonId?: string | null }[]) => {
    const response = await apiClient.patch(`/admin/users/${userId}/roles`, { roles });
    return response.data;
  },
};

export default apiClient;
