import apiClient, { type PaginatedResponse } from './api';
import type { Service } from './service.service';
import type { Staff } from './staff.service';
import type { Salon } from './salon.service';

export type BookingStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VIETQR';

export interface BookingService {
  id: string;
  serviceId: string;
  service: Service;
  price: number;
  duration: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  salonId: string;
  salon: Salon;
  staffId?: string;
  staff?: Staff;
  date: string;
  timeSlot: string;
  endTime: string;
  services: BookingService[];
  totalDuration: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  note?: string;
  cancelReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingDto {
  salonId: string;
  staffId?: string;
  date: string;
  timeSlot: string;
  serviceIds: string[];
  note?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

// Get my bookings
export const getMyBookings = async (filters?: BookingFilters): Promise<PaginatedResponse<Booking>> => {
  const response = await apiClient.get<PaginatedResponse<Booking>>('/bookings', {
    params: filters,
  });
  return response.data;
};

// Get booking by ID
export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await apiClient.get<Booking>(`/bookings/${id}`);
  return response.data;
};

// Create booking
export const createBooking = async (data: CreateBookingDto): Promise<Booking> => {
  const response = await apiClient.post<Booking>('/bookings', data);
  return response.data;
};

// Cancel booking
export const cancelBooking = async (id: string, reason?: string): Promise<Booking> => {
  const response = await apiClient.delete<Booking>(`/bookings/${id}`, {
    data: { reason },
  });
  return response.data;
};

// Get available time slots for booking
export const getAvailableTimeSlots = async (
  salonId: string,
  date: string,
  duration: number,
  staffId?: string
): Promise<{ time: string; available: boolean }[]> => {
  const response = await apiClient.get('/bookings/available-slots', {
    params: { salonId, date, duration, staffId },
  });
  return response.data;
};
