import React, { useState, useEffect } from 'react';
import { Page, Box, Text, Header, List, Icon, Spinner } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAsRead, type Notification } from '../../services/notifications-api.service';
import dayjs from 'dayjs';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await getNotifications();
            setNotifications(res.data.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        try {
            await markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const getIconAndColor = (type: string) => {
        switch (type) {
            case 'BOOKING_CREATED':
            case 'BOOKING_CONFIRMED':
                return { icon: 'zi-calendar-check-solid', color: 'success' };
            case 'BOOKING_CANCELLED':
                return { icon: 'zi-calendar-solid', color: 'error' };
            case 'BOOKING_REMINDER':
                return { icon: 'zi-clock-2-solid', color: 'warning' };
            case 'PROMOTION':
                return { icon: 'zi-star-solid', color: 'warning' };
            default:
                return { icon: 'zi-notif', color: 'neutral' };
        }
    };

    const getColorHex = (type: string) => {
        switch (type) {
            case 'success': return '#34b764';
            case 'warning': return '#fcc02a';
            case 'error': return '#ef4444';
            default: return '#1a1a2e';
        }
    }

    return (
        <Page style={{ background: '#f5f5f5' }}>
            <Header title="Thông báo" showBackIcon onBackClick={() => navigate(-1)} />
            <Box style={{ height: 44 }} />
            
            {loading ? (
                <Box p={4} flex justifyContent="center" alignItems="center" style={{ height: '80vh' }}>
                    <Spinner visible />
                </Box>
            ) : (
                <Box p={2}>
                    {notifications.length > 0 ? (
                        <List>
                            {notifications.map((notification) => {
                                const { icon, color } = getIconAndColor(notification.type);
                                return (
                                <Box 
                                    key={notification.id}
                                    mt={2}
                                    p={3}
                                    style={{
                                        background: notification.isRead ? '#fff' : '#eefffa',
                                        borderRadius: 8,
                                        borderLeft: `4px solid ${getColorHex(color)}`
                                    }}
                                    onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                                >
                                    <Box flex flexDirection="row" justifyContent="space-between">
                                        <Box flex flexDirection="row" alignItems="center">
                                            <Icon icon={icon as any} style={{ color: getColorHex(color), marginRight: 12 }} />
                                            <Text.Title size="small" style={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}>
                                                {notification.title}
                                            </Text.Title>
                                        </Box>
                                        <Text size="xxSmall" style={{ opacity: 0.5 }}>
                                            {dayjs(notification.createdAt).format('HH:mm DD/MM')}
                                        </Text>
                                    </Box>
                                    <Text size="xSmall" style={{ marginTop: 8, marginLeft: 36, opacity: 0.8 }}>
                                        {notification.message}
                                    </Text>
                                </Box>
                                );
                            })}
                        </List>
                    ) : (
                        <Box p={6} flex flexDirection="column" alignItems="center" justifyContent="center" style={{ minHeight: '60vh' }}>
                            <Icon icon="zi-notif" size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <Text size="small" style={{ opacity: 0.5 }}>Không có thông báo mới</Text>
                        </Box>
                    )}
                </Box>
            )}
        </Page>
    );
};

export default NotificationsPage;
