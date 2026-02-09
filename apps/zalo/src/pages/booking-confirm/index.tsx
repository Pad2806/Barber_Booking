import React, { useEffect, useState } from 'react';
import { Page, Box, Text, Button, Icon } from 'zmp-ui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getBookingById, type Booking } from '../../services/booking.service';
import {
  PageLoading,
  ErrorState,
  StatusBadge,
  ShareButton,
  FollowOAPrompt,
} from '../../components/shared';

const BookingConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const data = await getBookingById(bookingId!);
      setBooking(data);
    } catch (err: any) {
      setError(err.message);
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

  if (loading) {
    return <PageLoading />;
  }

  if (error || !booking) {
    return <ErrorState message={error || 'Không tìm thấy đặt lịch'} onRetry={fetchBooking} />;
  }

  return (
    <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
      {/* Success Header */}
      <Box
        p={8}
        style={{
          textAlign: 'center',
          color: '#fff',
          background:
            'linear-gradient(135deg, var(--zaui-light-input-status-success-icon-color, #34b764), #1b9d51)',
        }}
      >
        <Box
          flex
          alignItems="center"
          justifyContent="center"
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 16px',
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.18)',
          }}
        >
          <Icon icon="zi-check" />
        </Box>
        <Text.Title size="large" style={{ color: '#fff' }}>
          Đặt lịch thành công!
        </Text.Title>
        <Text size="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Mã đặt lịch:{' '}
          <Text bold style={{ color: '#fff' }}>
            {booking.bookingCode}
          </Text>
        </Text>
      </Box>

      {/* Booking Details */}
      <Box p={4} style={{ marginTop: -24 }}>
        <Box
          p={4}
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
          }}
        >
          <Box
            flex
            justifyContent="space-between"
            alignItems="center"
            pb={4}
            style={{ borderBottom: '1px solid var(--zaui-light-header-divider, #e9ebed)' }}
          >
            <Text bold>Thông tin đặt lịch</Text>
            <StatusBadge status={booking.status} />
          </Box>

          <Box flex alignItems="center" mt={4} style={{ gap: 12 }}>
            <Icon icon="zi-location" />
            <Box>
              <Text size="xxSmall" style={{ opacity: 0.7 }}>
                Salon
              </Text>
              <Text bold>{booking.salon.name}</Text>
              <Text size="xxSmall" style={{ opacity: 0.6 }}>
                {booking.salon.address}
              </Text>
            </Box>
          </Box>

          <Box flex alignItems="center" mt={4} style={{ gap: 12 }}>
            <Icon icon="zi-calendar" />
            <Box>
              <Text size="xxSmall" style={{ opacity: 0.7 }}>
                Ngày & giờ
              </Text>
              <Text bold>
                {dayjs(booking.date).format('DD/MM/YYYY')} lúc {booking.timeSlot}
              </Text>
            </Box>
          </Box>

          {booking.staff && (
            <Box flex alignItems="center" mt={4} style={{ gap: 12 }}>
              <Icon icon="zi-user" />
              <Box>
                <Text size="xxSmall" style={{ opacity: 0.7 }}>
                  Stylist
                </Text>
                <Text bold>{booking.staff.user.name}</Text>
              </Box>
            </Box>
          )}

          <Box
            mt={4}
            pt={4}
            style={{ borderTop: '1px solid var(--zaui-light-header-divider, #e9ebed)' }}
          >
            <Text bold>Dịch vụ đã đặt:</Text>
            {booking.services.map(bs => (
              <Box
                key={bs.id}
                flex
                justifyContent="space-between"
                alignItems="center"
                mt={3}
                pb={3}
                style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
              >
                <Box>
                  <Text size="small">{bs.service.name}</Text>
                  <Text size="xxSmall" style={{ opacity: 0.6 }}>
                    {bs.duration} phút
                  </Text>
                </Box>
                <Text bold size="small">
                  {formatPrice(bs.price)}
                </Text>
              </Box>
            ))}
            <Box
              flex
              justifyContent="space-between"
              mt={4}
              pt={3}
              style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}
            >
              <Text bold>Tổng cộng</Text>
              <Text bold style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}>
                {formatPrice(booking.totalAmount)}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Payment Info */}
        <Box
          p={4}
          mt={4}
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
          }}
        >
          <Box flex justifyContent="space-between" alignItems="center" style={{ gap: 12 }}>
            <Box>
              <Text size="xxSmall" style={{ opacity: 0.7 }}>
                Trạng thái thanh toán
              </Text>
              <Text bold>
                {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </Box>
            {booking.paymentStatus !== 'PAID' && (
              <Button onClick={() => navigate(`/payment?bookingId=${booking.id}`)}>
                Thanh toán
              </Button>
            )}
          </Box>
        </Box>

        {/* Notes */}
        <Box
          p={4}
          mt={4}
          style={{
            background: 'rgba(0, 97, 193, 0.08)',
            borderRadius: 16,
            border: '1px solid rgba(0, 97, 193, 0.14)',
          }}
        >
          <Box flex alignItems="center" style={{ gap: 8 }}>
            <Icon icon="zi-warning" />
            <Text bold size="small">
              Lưu ý
            </Text>
          </Box>
          <Box mt={2}>
            <Text size="small">• Vui lòng đến trước giờ hẹn 10 phút</Text>
            <Text size="small">• Nếu cần hủy lịch, vui lòng báo trước 2 giờ</Text>
            <Text size="small">• Liên hệ salon: {booking.salon.phone}</Text>
          </Box>
        </Box>

        {/* Follow OA Prompt */}
        <Box mt={4}>
          <FollowOAPrompt variant="card" />
        </Box>

        {/* Share Section */}
        <Box
          p={4}
          mt={4}
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
          }}
        >
          <Box flex alignItems="center" justifyContent="space-between" style={{ gap: 12 }}>
            <Box>
              <Text bold>Chia sẻ lịch hẹn</Text>
              <Text size="small" style={{ opacity: 0.7 }}>
                Gửi cho bạn bè để hẹn cùng đi
              </Text>
            </Box>
            <ShareButton
              type="booking"
              data={{
                bookingCode: booking.bookingCode,
                salonName: booking.salon.name,
                date: dayjs(booking.date).format('DD/MM/YYYY'),
                time: booking.timeSlot,
                services: booking.services.map(s => s.service.name),
              }}
              variant="icon"
            />
          </Box>
        </Box>
      </Box>

      {/* Bottom Actions */}
      <Box p={4}>
        <Button fullWidth onClick={() => navigate('/my-bookings')}>
          Xem lịch hẹn của tôi
        </Button>
        <Box mt={3}>
          <Button fullWidth variant="secondary" type="neutral" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default BookingConfirmPage;
