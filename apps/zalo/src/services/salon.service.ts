import apiClient, { type PaginatedResponse } from './api';

export interface Salon {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email?: string;
  openTime: string;
  closeTime: string;
  workingDays: string[];
  logo?: string;
  coverImage?: string;
  images: string[];
  isActive: boolean;
  rating?: number;
  totalReviews?: number;
}

export interface SalonFilters {
  city?: string;
  district?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Get all salons
export const getSalons = async (filters?: SalonFilters): Promise<PaginatedResponse<Salon>> => {
  const response = await apiClient.get<PaginatedResponse<Salon>>('/salons', {
    params: filters,
  });
  return response.data;
};

// Get salon by slug
export const getSalonBySlug = async (slug: string): Promise<Salon> => {
  const response = await apiClient.get<Salon>(`/salons/${slug}`);
  return response.data;
};

// Get salon by ID
export const getSalonById = async (id: string): Promise<Salon> => {
  const response = await apiClient.get<Salon>(`/salons/id/${id}`);
  return response.data;
};

// Get nearby salons
export const getNearbySalons = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<Salon[]> => {
  const response = await apiClient.get<Salon[]>('/salons/nearby', {
    params: { latitude, longitude, radius: radiusKm },
  });
  return response.data;
};
