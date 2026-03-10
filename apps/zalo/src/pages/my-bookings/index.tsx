import React, { useEffect, useState } from 'react';
import { Page, Box, Text, Tabs, Icon, Button, Header } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getMyBookings, type Booking } from '../../services/booking.service';
import { PageLoading, EmptyState, StatusBadge } from '../../components/shared';
import { BOOKING_STATUS } from '../../config';

const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('upcoming');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getMyBookings();
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const filterBookings = (type: string) => {
    const now = dayjs();
    return bookings.filter(booking => {
      const bookingDate = dayjs(booking.date);
      if (type === 'upcoming') {
        return (
          (bookingDate.isAfter(now, 'day') ||
            (bookingDate.isSame(now, 'day') && booking.timeSlot > now.format('HH:mm'))) &&
          !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)
        );
      } else {
        return (
          bookingDate.isBefore(now, 'day') ||
          ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)
        );
      }
    });
  };

  const renderBookingCard = (booking: Booking) => (
    <Box
      key={booking.id}
      p={4}
      mt={4}
      style={{
        background: 'var(--brand-background)',
        borderRadius: 32,
        border: '1px solid var(--brand-border)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
      }}
      onClick={() => navigate(`/booking-detail?id=${booking.id}`)}
    >
      <Box flex justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{booking.salon.name}</Text>
          <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', opacity: 0.6 }}>
            ID: {booking.bookingCode}
          </Text>
        </Box>
        <StatusBadge status={booking.status as keyof typeof BOOKING_STATUS} size="sm" />
      </Box>

      <Box flex alignItems="center" style={{ gap: 8, opacity: 0.7 }}>
        <Icon icon="zi-calendar" style={{ color: 'var(--brand-primary)', fontSize: 14 }} />
        <Text style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
          {dayjs(booking.date).format('DD/MM/YYYY')} · {booking.timeSlot}
        </Text>
      </Box>

      <Box flex alignItems="center" mt={2} style={{ gap: 8, opacity: 0.7 }}>
        <Icon icon="zi-star" style={{ color: 'var(--brand-primary)', fontSize: 14 }} />
        <Text style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{booking.services.map(s => s.service.name).join(', ')}</Text>
      </Box>

      <Box
        flex
        justifyContent="space-between"
        alignItems="center"
        mt={4}
        pt={4}
        style={{ borderTop: '1px dashed var(--brand-border)' }}
      >
        <Box flex alignItems="center" style={{ gap: 6, opacity: 0.5 }}>
          <Icon icon="zi-clock-1" style={{ fontSize: 12 }} />
          <Text style={{ fontSize: 10, fontWeight: 800 }}>{booking.totalDuration} PHÚT</Text>
        </Box>
        <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-primary)' }}>
          {formatPrice(booking.totalAmount)}
        </Text>
      </Box>
    </Box>
  );

  if (loading) {
    return <PageLoading />;
  }

  return (
    <Page style={{ background: 'var(--brand-background)' }}>
      <Header title="LỊCH HẸN CỦA TÔI" showBackIcon={false} />
      <Box style={{ height: 44 }} />
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.Tab key="upcoming" label="SẮP TỚI">
          <Box p={4} pb={10}>
            {filterBookings('upcoming').length === 0 ? (
              <EmptyState
                icon="zi-calendar"
                title="CHƯA CÓ LỊCH HẸN"
                description="ĐẶT LỊCH NGAY ĐỂ TRẢI NGHIỆM DỊCH VỤ"
                action={<Button style={{ height: 48, borderRadius: 24, background: 'var(--brand-primary)', color: 'var(--brand-background)', fontWeight: 900, letterSpacing: 1 }} onClick={() => navigate('/salons')}>ĐẶT LỊCH NGAY</Button>}
              />
            ) : (
              filterBookings('upcoming').map(renderBookingCard)
            )}
          </Box>
        </Tabs.Tab>

        <Tabs.Tab key="history" label="LỊCH SỬ">
          <Box p={4} pb={10}>
            {filterBookings('history').length === 0 ? (
              <EmptyState
                icon="zi-inbox"
                title="CHƯA CÓ LỊCH SỬ"
                description="CÁC LỊCH HẸN ĐÃ HOÀN THÀNH SẼ HIỂN THỊ Ở ĐÂY"
              />
            ) : (
              filterBookings('history').map(renderBookingCard)
            )}
          </Box>
        </Tabs.Tab>
      </Tabs>
    </Page>
  );
};

export default MyBookingsPage;
