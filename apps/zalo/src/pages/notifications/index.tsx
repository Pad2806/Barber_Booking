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
        <Page style={{ background: 'var(--brand-background)' }}>
            <Header title="THÔNG BÁO" showBackIcon onBackClick={() => navigate(-1)} />
            <Box style={{ height: 44 }} />
            
            {loading ? (
                <Box p={4} flex justifyContent="center" alignItems="center" style={{ height: '80vh' }}>
                    <Spinner visible />
                </Box>
            ) : (
                <Box p={4}>
                    {notifications.length > 0 ? (
                        <>
                            {notifications.map((notification) => {
                                const { icon, color } = getIconAndColor(notification.type);
                                return (
                                <Box 
                                    key={notification.id}
                                    mb={3}
                                    p={5}
                                    style={{
                                        background: notification.isRead ? 'var(--brand-background)' : 'rgba(165, 124, 82, 0.05)',
                                        borderRadius: 24,
                                        border: notification.isRead ? '1px solid var(--brand-border)' : '1px solid var(--brand-primary)',
                                        boxShadow: notification.isRead ? 'none' : '0 8px 16px rgba(165, 124, 82, 0.1)',
                                        opacity: notification.isRead ? 0.7 : 1
                                    }}
                                    onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                                >
                                    <Box flex flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box flex flexDirection="row" alignItems="center" style={{ gap: 12 }}>
                                            <Box 
                                                flex 
                                                alignItems="center" 
                                                justifyContent="center"
                                                style={{ 
                                                    width: 40, 
                                                    height: 40, 
                                                    borderRadius: 14, 
                                                    background: 'var(--brand-background)',
                                                    border: `1px solid ${getColorHex(color)}`
                                                }}
                                            >
                                                <Icon icon={icon as any} style={{ color: getColorHex(color), fontSize: 18 }} />
                                            </Box>
                                            <Text style={{ fontSize: 14, fontWeight: notification.isRead ? 700 : 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>
                                                {notification.title}
                                            </Text>
                                        </Box>
                                        <Text style={{ fontSize: 9, fontWeight: 800, opacity: 0.4 }}>
                                            {dayjs(notification.createdAt).format('HH:mm DD/MM')}
                                        </Text>
                                    </Box>
                                    <Text style={{ marginTop: 12, marginLeft: 52, fontSize: 13, fontWeight: 600, opacity: 0.7, lineHeight: '1.4' }}>
                                        {notification.message}
                                    </Text>
                                </Box>
                                );
                            })}
                        </>
                    ) : (
                        <Box p={8} flex flexDirection="column" alignItems="center" justifyContent="center" style={{ minHeight: '70vh', textAlign: 'center' }}>
                            <Box 
                                flex 
                                alignItems="center" 
                                justifyContent="center" 
                                style={{ 
                                    width: 100, 
                                    height: 100, 
                                    borderRadius: 32, 
                                    background: 'var(--brand-muted)',
                                    marginBottom: 24
                                }}
                            >
                                <Icon icon="zi-notif" style={{ opacity: 0.2, fontSize: 48, color: 'var(--brand-secondary)' }} />
                            </Box>
                            <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>KHÔNG CÓ THÔNG BÁO</Text>
                            <Text style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, marginTop: 8 }}>QUÝ KHÁCH CHƯA CÓ THÔNG BÁO NÀO</Text>
                        </Box>
                    )}
                </Box>
            )}
        </Page>
    );
};

export default NotificationsPage;
