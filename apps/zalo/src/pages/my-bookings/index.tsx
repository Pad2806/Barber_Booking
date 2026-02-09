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
      mt={3}
      style={{
        background: 'var(--zaui-light-header-background-color, #fff)',
        borderRadius: 16,
        border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
      }}
      onClick={() => navigate(`/booking-detail?id=${booking.id}`)}
    >
      <Box flex justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Text bold>{booking.salon.name}</Text>
          <Text size="xxSmall" style={{ opacity: 0.65 }}>
            {booking.bookingCode}
          </Text>
        </Box>
        <StatusBadge status={booking.status as keyof typeof BOOKING_STATUS} size="sm" />
      </Box>

      <Box flex alignItems="center" style={{ gap: 8, opacity: 0.8 }}>
        <Icon icon="zi-calendar" />
        <Text size="small">
          {dayjs(booking.date).format('DD/MM/YYYY')} lúc {booking.timeSlot}
        </Text>
      </Box>

      <Box flex alignItems="center" mt={2} style={{ gap: 8, opacity: 0.8 }}>
        <Icon icon="zi-star" />
        <Text size="small">{booking.services.map(s => s.service.name).join(', ')}</Text>
      </Box>

      <Box
        flex
        justifyContent="space-between"
        alignItems="center"
        mt={3}
        pt={3}
        style={{ borderTop: '1px solid var(--zaui-light-header-divider, #e9ebed)' }}
      >
        <Box flex alignItems="center" style={{ gap: 6, opacity: 0.75 }}>
          <Icon icon="zi-clock-1" />
          <Text size="small">{booking.totalDuration} phút</Text>
        </Box>
        <Text bold style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}>
          {formatPrice(booking.totalAmount)}
        </Text>
      </Box>
    </Box>
  );

  if (loading) {
    return <PageLoading />;
  }

  return (
    <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
      <Header title="Lịch hẹn" showBackIcon={false} />
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.Tab key="upcoming" label="Sắp tới">
          <Box p={4}>
            {filterBookings('upcoming').length === 0 ? (
              <EmptyState
                icon="zi-calendar"
                title="Chưa có lịch hẹn"
                description="Đặt lịch ngay để trải nghiệm dịch vụ"
                action={<Button onClick={() => navigate('/salons')}>Đặt lịch ngay</Button>}
              />
            ) : (
              filterBookings('upcoming').map(renderBookingCard)
            )}
          </Box>
        </Tabs.Tab>

        <Tabs.Tab key="history" label="Lịch sử">
          <Box p={4}>
            {filterBookings('history').length === 0 ? (
              <EmptyState
                icon="zi-inbox"
                title="Chưa có lịch sử"
                description="Các lịch hẹn đã hoàn thành sẽ hiển thị ở đây"
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
