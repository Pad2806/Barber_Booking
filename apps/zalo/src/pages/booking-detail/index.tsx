import React, { useEffect, useState } from 'react';
import { Page, Box, Text, Button, Modal, Icon, Grid, Header } from 'zmp-ui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getBookingById, cancelBooking, type Booking } from '../../services/booking.service';
import { PageLoading, ErrorState, StatusBadge, ShareButton } from '../../components/shared';
import { STAFF_POSITIONS } from '../../config';

const BookingDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [_cancelling, setCancelling] = useState(false);

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

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await cancelBooking(bookingId!, cancelReason);
      setShowCancelModal(false);
      fetchBooking();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const canCancel = () => {
    if (!booking) return false;
    return ['PENDING', 'CONFIRMED'].includes(booking.status);
  };

  const canPay = () => {
    if (!booking) return false;
    return !['CANCELLED', 'NO_SHOW'].includes(booking.status) && booking.paymentStatus !== 'PAID';
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error || !booking) {
    return <ErrorState message={error || 'Không tìm thấy đặt lịch'} />;
  }

  return (
    <Page
      style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)', paddingBottom: 120 }}
    >
      <Header title="Chi tiết đặt lịch" onBackClick={() => navigate(-1)} />

      <Box p={4}>
        <Box flex justifyContent="space-between" alignItems="center" style={{ gap: 12 }}>
          <Box>
            <Text size="xxSmall" style={{ opacity: 0.7 }}>
              Mã đặt lịch
            </Text>
            <Text bold>{booking.bookingCode}</Text>
          </Box>
          <Box flex alignItems="center" style={{ gap: 8 }}>
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
            <StatusBadge status={booking.status as any} />
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box p={4}>
        {/* Salon Info */}
        <Box
          p={4}
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
          }}
        >
          <Box flex alignItems="center" style={{ gap: 12 }}>
            <Box style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden' }}>
              <img
                src={booking.salon.logo || '/assets/images/default-salon.jpg'}
                alt={booking.salon.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Box>
              <Text bold>{booking.salon.name}</Text>
              <Box flex alignItems="center" mt={1} style={{ gap: 6, opacity: 0.75 }}>
                <Icon icon="zi-location" />
                <Text size="small">{booking.salon.address}</Text>
              </Box>
              <Box flex alignItems="center" mt={1} style={{ gap: 6, opacity: 0.75 }}>
                <Icon icon="zi-call" />
                <Text size="small">{booking.salon.phone}</Text>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Booking Info */}
        <Box
          p={4}
          mt={4}
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
          }}
        >
          <Text bold>Thông tin lịch hẹn</Text>

          <Box mt={3}>
            <Grid columnCount={2} columnSpace="12px" rowSpace="12px">
              <Box>
                <Text size="xxSmall" style={{ opacity: 0.7 }}>
                  Ngày
                </Text>
                <Text bold>{dayjs(booking.date).format('DD/MM/YYYY')}</Text>
              </Box>
              <Box>
                <Text size="xxSmall" style={{ opacity: 0.7 }}>
                  Giờ
                </Text>
                <Text bold>
                  {booking.timeSlot} - {booking.endTime}
                </Text>
              </Box>
            </Grid>
          </Box>

          {booking.staff && (
            <Box mt={3}>
              <Text size="xxSmall" style={{ opacity: 0.7 }}>
                Stylist
              </Text>
              <Box flex alignItems="center" mt={2} style={{ gap: 10 }}>
                <Box style={{ width: 40, height: 40, borderRadius: 999, overflow: 'hidden' }}>
                  <img
                    src={booking.staff.user.avatar || '/assets/images/default-avatar.jpg'}
                    alt={booking.staff.user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Box>
                  <Text bold>{booking.staff.user.name}</Text>
                  <Text size="xxSmall" style={{ opacity: 0.6 }}>
                    {STAFF_POSITIONS[booking.staff.position as keyof typeof STAFF_POSITIONS]}
                  </Text>
                </Box>
              </Box>
            </Box>
          )}

          {booking.note && (
            <Box mt={3}>
              <Text size="xxSmall" style={{ opacity: 0.7 }}>
                Ghi chú
              </Text>
              <Text size="small">{booking.note}</Text>
            </Box>
          )}
        </Box>

        {/* Services */}
        <Box
          p={4}
          mt={4}
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
          }}
        >
          <Text bold>Dịch vụ</Text>
          <Box mt={3}>
            {booking.services.map(bs => (
              <Box
                key={bs.id}
                flex
                justifyContent="space-between"
                alignItems="center"
                pt={2}
                pb={2}
                style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
              >
                <Box>
                  <Text bold size="small">
                    {bs.service.name}
                  </Text>
                  <Text size="xxSmall" style={{ opacity: 0.65 }}>
                    {bs.duration} phút
                  </Text>
                </Box>
                <Text bold size="small">
                  {formatPrice(bs.price)}
                </Text>
              </Box>
            ))}
          </Box>
          <Box
            flex
            justifyContent="space-between"
            alignItems="center"
            mt={3}
            pt={3}
            style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}
          >
            <Text bold>Tổng cộng</Text>
            <Text bold style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}>
              {formatPrice(booking.totalAmount)}
            </Text>
          </Box>
        </Box>

        {/* Payment Status */}
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
                Thanh toán
              </Text>
              <Box flex alignItems="center" mt={1} style={{ gap: 8 }}>
                <Icon icon={booking.paymentStatus === 'PAID' ? 'zi-check' : 'zi-clock-1'} />
                <Text bold>
                  {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Text>
              </Box>
            </Box>
            {canPay() && (
              <Button size="small" onClick={() => navigate(`/payment?bookingId=${booking.id}`)}>
                Thanh toán
              </Button>
            )}
          </Box>
        </Box>

        {/* Cancellation Info */}
        {booking.status === 'CANCELLED' && (
          <Box
            p={4}
            mt={4}
            style={{
              background: 'rgba(220, 0, 0, 0.08)',
              borderRadius: 16,
              border: '1px solid rgba(220, 0, 0, 0.14)',
            }}
          >
            <Text bold style={{ color: 'rgb(220, 0, 0)' }}>
              Đã hủy
            </Text>
            {booking.cancelReason && (
              <Text size="small" style={{ marginTop: 6, color: 'rgb(220, 0, 0)' }}>
                Lý do: {booking.cancelReason}
              </Text>
            )}
            {booking.cancelledAt && (
              <Text size="xxSmall" style={{ marginTop: 6, opacity: 0.7 }}>
                Hủy lúc: {dayjs(booking.cancelledAt).format('DD/MM/YYYY HH:mm')}
              </Text>
            )}
          </Box>
        )}
      </Box>

      {/* Bottom Actions */}
      {canCancel() && (
        <Box
          className="safe-area-bottom"
          p={4}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderTop: '1px solid var(--zaui-light-header-divider, #e9ebed)',
          }}
        >
          <Button fullWidth type="danger" onClick={() => setShowCancelModal(true)}>
            Hủy lịch hẹn
          </Button>
        </Box>
      )}

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        title="Hủy lịch hẹn"
        onClose={() => setShowCancelModal(false)}
        actions={[
          {
            text: 'Đóng',
            close: true,
          },
          {
            text: 'Xác nhận hủy',
            close: false,
            danger: true,
            onClick: handleCancel,
          },
        ]}
      >
        <Box p={4}>
          <Text size="small" style={{ opacity: 0.75, marginBottom: 12 }}>
            Bạn có chắc muốn hủy lịch hẹn này?
          </Text>
          <textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Lý do hủy (không bắt buộc)"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--zaui-light-input-border-color, #b9bdc1)',
              background: 'var(--zaui-light-input-background-color, #fff)',
              resize: 'none',
              fontFamily: 'inherit',
            }}
            rows={3}
          />
        </Box>
      </Modal>
    </Page>
  );
};

export default BookingDetailPage;
