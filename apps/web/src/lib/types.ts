import type { User as SharedUser } from '@reetro/shared';

// Re-export User with a clean name
export type User = SharedUser;

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        lastPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        averageRating?: number;
        distribution?: Record<number, number>;
    };
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
    isActive: boolean;
    averageRating?: number;
    _count?: {
        reviews: number;
        staff: number;
        bookings: number;
    };
}

export interface Service {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
    category: string;
    image?: string;
    videoUrl?: string;
    gallery?: string[];
    salonId: string;
    isActive: boolean;
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
    schedules?: StaffSchedule[];
    _count?: {
        bookings: number;
    };
}

export interface StaffSchedule {
    id: string;
    staffId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOff: boolean;
}

export interface StaffShift {
    id: string;
    staffId: string;
    salonId: string;
    date: string;
    shiftStart: string;
    shiftEnd: string;
    staff?: {
        id: string;
        user: {
            name: string;
            avatar?: string;
        };
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
    payments?: Array<{
        id: string;
        amount: number;
        method: string;
        type: string;
        status: string;
        paidAt?: string;
    }>;
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
    updatedAt: string;
    review?: Review;
}

export interface BookingQueryDto {
    page?: number;
    limit?: number;
    status?: string;
    salonId?: string;
    staffId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
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
    staffRating?: number;
    comment?: string;
    images?: string[];
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

// Admin Dashboard Types
export interface DashboardStats {
    todayBookings: number;
    todayBookingsGrowth: number;
    todayRevenue: number;
    todayRevenueGrowth: number;
    monthRevenue: number;
    monthRevenueGrowth: number;
    totalCustomers: number;
    customerGrowth: number;
    totalStaff: number;
    totalSalons: number;
    totalBookings: number;
    pendingBookings: number;
    monthBookings: number;
    bookingGrowth: number;
    recentBookings: Booking[];
    topServices: TopService[];
    activityFeed: ActivityItem[];
}

export interface TopService {
    name: string;
    category: string;
    count: number;
}

export interface ActivityItem {
    type: 'BOOKING' | 'REVIEW' | 'USER';
    title: string;
    description: string;
    time: string;
    status?: string;
    rating?: number;
}

export interface BookingStats {
    totalBookings: number;
    byStatus: Record<string, number>;
    dailyBookings: Array<{ date: string; count: number }>;
    timeline: Array<{
        date: string;
        count: number;
        completed: number;
        cancelled: number;
    }>;
}

export interface RevenueStats {
    totalRevenue: number;
    averageOrderValue: number;
    dailyRevenue: Array<{ date: string; amount: number }>;
    timeline: Array<{
        date: string;
        amount: number;
        count: number;
    }>;
}

export type UploadFolder = 'avatars' | 'salons' | 'services' | 'reviews';
