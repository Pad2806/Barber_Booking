import apiClient from './api';

export interface Staff {
  id: string;
  position: string;
  bio?: string;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  userId: string;
  salonId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
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

export interface TimeSlot {
  time: string;
  available: boolean;
}

// Get staff by salon
export const getStaffBySalon = async (salonId: string): Promise<Staff[]> => {
  const response = await apiClient.get<Staff[]>(`/staff`, {
    params: { salonId },
  });
  return response.data;
};

// Get staff by ID
export const getStaffById = async (id: string): Promise<Staff> => {
  const response = await apiClient.get<Staff>(`/staff/${id}`);
  return response.data;
};

// Get staff schedule
export const getStaffSchedule = async (staffId: string): Promise<StaffSchedule[]> => {
  const response = await apiClient.get<StaffSchedule[]>(`/staff/${staffId}/schedule`);
  return response.data;
};

// Get available time slots
export const getAvailableSlots = async (
  salonId: string,
  date: string,
  duration: number,
  staffId?: string
): Promise<TimeSlot[]> => {
  const response = await apiClient.get<TimeSlot[]>(`/staff/available-slots`, {
    params: { salonId, date, duration, staffId },
  });
  return response.data;
};
