import api from './api';
import type { Salon } from './salon.service';

export interface FavoriteSalon extends Salon {
    createdAt: string;
}

export const getFavorites = async (params?: { page?: number; limit?: number }) => {
    return api.get<{ data: Salon[]; meta: any }>('/favorites', { params });
};

export const addToFavorites = async (salonId: string) => {
    return api.post(`/favorites/${salonId}`);
};

export const removeFromFavorites = async (salonId: string) => {
    return api.delete(`/favorites/${salonId}`);
};

export const checkIsFavorite = async (salonId: string) => {
    return api.get<{ isFavorite: boolean }>(`/favorites/check/${salonId}`);
};
