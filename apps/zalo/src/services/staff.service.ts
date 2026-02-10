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
  const response = await apiClient.get<Staff[]>(`/staff/salon/${salonId}`);
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
  // Note: Current API exposes staff-based availability:
  // GET /staff/:id/available-slots?date=YYYY-MM-DD
  // It does not currently take salonId/duration into account.

  const fetchStaffSlots = async (id: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/staff/${id}/available-slots`, {
      params: { date },
    });
    return response.data;
  };

  let times: string[] = [];

  if (staffId) {
    times = await fetchStaffSlots(staffId);
  } else {
    const staffList = await getStaffBySalon(salonId);
    const slotLists = await Promise.all(
      staffList.map((member) => fetchStaffSlots(member.id).catch(() => [])),
    );
    times = Array.from(new Set(slotLists.flat()));
  }

  // Keep signature stable; duration currently unused by API.
  void duration;

  times.sort(); // HH:mm lexical sort works
  return times.map((time) => ({ time, available: true }));
};
