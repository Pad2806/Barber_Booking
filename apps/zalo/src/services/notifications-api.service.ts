import api from './api';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}

export const getNotifications = async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    return api.get<{ data: Notification[]; meta: any }>('/notifications', { params });
};

export const getUnreadCount = async () => {
    return api.get<number>('/notifications/unread-count');
};

export const markAsRead = async (id: string) => {
    return api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
    return api.patch('/notifications/read-all');
};

export const deleteNotification = async (id: string) => {
    return api.delete(`/notifications/${id}`);
};

export const deleteAllNotifications = async () => {
    return api.delete('/notifications');
};
