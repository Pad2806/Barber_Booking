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
      style={{ background: 'var(--brand-background)', paddingBottom: 120 }}
    >
      <Header title="CHI TIẾT LỊCH HẸN" onBackClick={() => navigate(-1)} />
      <Box style={{ height: 44 }} />

      <Box p={6}>
        <Box flex justifyContent="space-between" alignItems="center" style={{ gap: 12 }}>
          <Box>
            <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
              MÃ ĐẶT LỊCH
            </Text>
            <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-secondary)' }}>{booking.bookingCode}</Text>
          </Box>
          <Box flex alignItems="center" style={{ gap: 12 }}>
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
      <Box p={4} mt={-4}>
        {/* Salon Info */}
        <Box
          p={6}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
          }}
        >
          <Box flex alignItems="center" style={{ gap: 16 }}>
            <Box style={{ width: 64, height: 64, borderRadius: 24, overflow: 'hidden', border: '1px solid var(--brand-border)' }}>
              <img
                src={booking.salon.logo || '/assets/images/default-salon.jpg'}
                alt={booking.salon.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.2)' }}
              />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{booking.salon.name}</Text>
              <Box flex alignItems="center" mt={1} style={{ gap: 6, opacity: 0.6 }}>
                <Icon icon="zi-location" style={{ fontSize: 13 }} />
                <Text style={{ fontSize: 12, fontWeight: 700 }}>{booking.salon.address}</Text>
              </Box>
              <Box flex alignItems="center" mt={1} style={{ gap: 6, opacity: 0.6 }}>
                <Icon icon="zi-call" style={{ fontSize: 13 }} />
                <Text style={{ fontSize: 12, fontWeight: 700 }}>{booking.salon.phone}</Text>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Booking Info */}
        <Box
          p={6}
          mt={4}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)', letterSpacing: 1 }}>THÔNG TIN LỊCH HẸN</Text>

          <Box mt={4}>
            <Grid columnCount={2} columnSpace="12px" rowSpace="12px">
              <Box>
                <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                  NGÀY
                </Text>
                <Text style={{ fontSize: 15, fontWeight: 900 }}>{dayjs(booking.date).format('DD/MM/YYYY')}</Text>
              </Box>
              <Box>
                <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                  GIỜ
                </Text>
                <Text style={{ fontSize: 15, fontWeight: 900 }}>
                  {booking.timeSlot} - {booking.endTime}
                </Text>
              </Box>
            </Grid>
          </Box>

          {booking.staff && (
            <Box mt={4} pt={4} style={{ borderTop: '1px dashed var(--brand-border)' }}>
              <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                STYLIST
              </Text>
              <Box flex alignItems="center" mt={3} style={{ gap: 12 }}>
                <Box style={{ width: 48, height: 48, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--brand-border)' }}>
                  <img
                    src={booking.staff.user.avatar || '/assets/images/default-avatar.jpg'}
                    alt={booking.staff.user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.3)' }}
                  />
                </Box>
                <Box>
                  <Text style={{ fontSize: 15, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{booking.staff.user.name}</Text>
                  <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {STAFF_POSITIONS[booking.staff.position as keyof typeof STAFF_POSITIONS]}
                  </Text>
                </Box>
              </Box>
            </Box>
          )}

          {booking.note && (
            <Box mt={4} p={4} style={{ background: 'rgba(165, 124, 82, 0.05)', borderRadius: 24, border: '1px solid rgba(165, 124, 82, 0.1)' }}>
              <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, marginBottom: 4 }}>
                GHI CHÚ
              </Text>
              <Text style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic' }}>{booking.note}</Text>
            </Box>
          )}
        </Box>

        {/* Services */}
        <Box
          p={6}
          mt={4}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)', letterSpacing: 1 }}>DỊCH VỤ</Text>
          <Box mt={4}>
            {booking.services.map(bs => (
              <Box
                key={bs.id}
                flex
                justifyContent="space-between"
                alignItems="center"
                pt={3}
                pb={3}
                style={{ borderBottom: '1px dashed var(--brand-border)' }}
              >
                <Box>
                  <Text style={{ fontSize: 14, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>
                    {bs.service.name}
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                    {bs.duration} PHÚT
                  </Text>
                </Box>
                <Text style={{ fontSize: 14, fontWeight: 900, color: 'var(--brand-secondary)' }}>
                  {formatPrice(bs.price)}
                </Text>
              </Box>
            ))}
          </Box>
          <Box
            flex
            justifyContent="space-between"
            alignItems="center"
            mt={4}
            pt={4}
          >
            <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>TỔNG CỘNG</Text>
            <Text style={{ fontSize: 20, fontWeight: 900, color: 'var(--brand-primary)' }}>
              {formatPrice(booking.totalAmount)}
            </Text>
          </Box>
        </Box>

        {/* Payment Status */}
        <Box
          p={6}
          mt={4}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
          }}
        >
          <Box flex justifyContent="space-between" alignItems="center" style={{ gap: 12 }}>
            <Box>
              <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                THANH TOÁN
              </Text>
              <Box flex alignItems="center" mt={1} style={{ gap: 8 }}>
                <Icon icon={booking.paymentStatus === 'PAID' ? 'zi-check' : 'zi-clock-1'} style={{ color: booking.paymentStatus === 'PAID' ? '#10b981' : 'var(--brand-primary)', fontSize: 16 }} />
                <Text style={{ fontSize: 13, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>
                  {booking.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                </Text>
              </Box>
            </Box>
            {canPay() && (
              <Button style={{ height: 32, padding: '0 16px', borderRadius: 16, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }} onClick={() => navigate(`/payment?bookingId=${booking.id}`)}>
                THANH TOÁN
              </Button>
            )}
          </Box>
        </Box>

        {/* Cancellation Info */}
        {booking.status === 'CANCELLED' && (
          <Box
            p={6}
            mt={4}
            style={{
              background: 'rgba(233, 69, 96, 0.05)',
              borderRadius: 32,
              border: '1px solid rgba(233, 69, 96, 0.2)',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: 900, color: '#e94560', textTransform: 'uppercase' }}>
              ĐÃ HỦY LỊCH
            </Text>
            {booking.cancelReason && (
              <Text style={{ fontSize: 11, fontWeight: 700, fontStyle: 'italic', marginTop: 8, color: '#e94560' }}>
                LÝ DO: {booking.cancelReason}
              </Text>
            )}
            {booking.cancelledAt && (
              <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', marginTop: 8, opacity: 0.4 }}>
                HỦY LÚC: {dayjs(booking.cancelledAt).format('DD/MM/YYYY HH:mm')}
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
            background: 'var(--brand-secondary)',
            borderTop: '1px solid rgba(165, 124, 82, 0.2)',
            boxShadow: '0 -16px 32px rgba(0,0,0,0.2)',
            zIndex: 100
          }}
        >
          <Button
            fullWidth
            onClick={() => setShowCancelModal(true)}
            style={{ height: 60, borderRadius: 30, background: '#e94560', color: '#fff', fontWeight: 900, letterSpacing: 2, border: 'none' }}
          >
            HỦY LỊCH HẸN
          </Button>
        </Box>
      )}

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        title="HỦY LỊCH HẸN"
        onClose={() => setShowCancelModal(false)}
        actions={[
          {
            text: 'ĐÓNG',
            close: true,
          },
          {
            text: 'XÁC NHẬN HỦY',
            close: false,
            danger: true,
            onClick: handleCancel,
          },
        ]}
      >
        <Box p={6}>
          <Text style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, marginBottom: 16 }}>
            Bạn có chắc chắn muốn hủy lịch hẹn này không? Hành động này không thể hoàn tác.
          </Text>
          <textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Lý do hủy (không bắt buộc)..."
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 24,
              border: '1px solid var(--brand-border)',
              background: 'var(--brand-muted)',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              outline: 'none',
              color: 'var(--brand-secondary)'
            }}
            rows={3}
          />
        </Box>
      </Modal>
    </Page>
  );
};

export default BookingDetailPage;
