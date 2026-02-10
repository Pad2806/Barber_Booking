import apiClient from './api';

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  category: string;
  image?: string;
  isActive: boolean;
  order: number;
  salonId: string;
}

export interface ServicesByCategory {
  category: string;
  categoryLabel: string;
  services: Service[];
}

// Get services by salon
export const getServicesBySalon = async (salonId: string): Promise<Service[]> => {
  const response = await apiClient.get<Service[]>(`/services/salon/${salonId}`);
  return response.data;
};

// Get service by ID
export const getServiceById = async (id: string): Promise<Service> => {
  const response = await apiClient.get<Service>(`/services/${id}`);
  return response.data;
};

// Group services by category
export const groupServicesByCategory = (
  services: Service[],
  categoryLabels: Record<string, { label: string; icon: string }>
): ServicesByCategory[] => {
  const grouped: Record<string, Service[]> = {};

  services.forEach((service) => {
    if (!grouped[service.category]) {
      grouped[service.category] = [];
    }
    grouped[service.category].push(service);
  });

  return Object.entries(grouped).map(([category, services]) => ({
    category,
    categoryLabel: categoryLabels[category]?.label || category,
    services: services.sort((a, b) => a.order - b.order),
  }));
};
