import React, { useEffect, useState } from 'react';
import { Page, Box, Text, Button, Icon, Header, Spinner } from 'zmp-ui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getBookingById, type Booking } from '../../services/booking.service';
import {
  generatePaymentQR,
  type QRCodeResponse,
  pollPaymentStatus,
  type Payment,
} from '../../services/payment.service';
import { PageLoading, ErrorState, ShareButton, FollowOAPrompt } from '../../components/shared';
import { BOOKING_CONFIG } from '../../config';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [qrData, setQrData] = useState<QRCodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(BOOKING_CONFIG.paymentTimeoutMinutes * 60);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchData();
    }
  }, [bookingId]);

  useEffect(() => {
    if (!qrData || isPaid) return;

    // Start polling for payment status
    const stopPolling = pollPaymentStatus(
      bookingId!,
      (payment: Payment) => {
        if (payment.status === 'PAID') {
          setIsPaid(true);
          setTimeout(() => {
            navigate(`/booking-confirm?id=${bookingId}`);
          }, 2000);
        }
      },
      3000
    );

    return () => stopPolling();
  }, [qrData, bookingId, isPaid]);

  useEffect(() => {
    if (!qrData || isPaid) return;

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrData, isPaid]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bookingData = await getBookingById(bookingId!);
      setBooking(bookingData);

      if (bookingData.paymentStatus !== 'PAID') {
        const qr = await generatePaymentQR(bookingId!);
        setQrData(qr);
      } else {
        setIsPaid(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    return <ErrorState message={error || 'Không tìm thấy đặt lịch'} />;
  }

  if (isPaid) {
    return (
      <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
        <Header title="Thanh toán" onBackClick={() => navigate(-1)} />
        <Box
          p={6}
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ minHeight: 'calc(100vh - 56px)' }}
        >
          <Box
            flex
            alignItems="center"
            justifyContent="center"
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              background: 'rgba(52, 183, 100, 0.15)',
              marginBottom: 16,
            }}
          >
            <Icon icon="zi-check" />
          </Box>
          <Text.Title size="large" style={{ textAlign: 'center' }}>
            Thanh toán thành công!
          </Text.Title>
          <Text
            size="small"
            style={{ opacity: 0.7, textAlign: 'center', marginTop: 6, marginBottom: 16 }}
          >
            Cảm ơn bạn đã thanh toán. Đang chuyển đến trang xác nhận...
          </Text>

          {/* Follow OA Prompt */}
          <Box style={{ width: '100%', maxWidth: 420, marginBottom: 12 }}>
            <FollowOAPrompt variant="banner" />
          </Box>

          {/* Share Option */}
          {booking && (
            <ShareButton
              type="booking"
              data={{
                bookingCode: booking.bookingCode,
                salonName: booking.salon.name,
                date: dayjs(booking.date).format('DD/MM/YYYY'),
                time: booking.timeSlot,
                services: booking.services.map(s => s.service.name),
              }}
              variant="button"
              label="Chia sẻ với bạn bè"
            />
          )}
        </Box>
      </Page>
    );
  }

  return (
    <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
      <Header title="Thanh toán" onBackClick={() => navigate(-1)} />

      <Box p={4}>
        <Text size="xxSmall" style={{ opacity: 0.7 }}>
          Mã đặt lịch: {booking.bookingCode}
        </Text>
      </Box>

      {/* QR Code */}
      <Box p={4}>
        <Box
          p={6}
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
          }}
        >
          {/* Amount */}
          <Box style={{ textAlign: 'center', marginBottom: 16 }}>
            <Text size="xxSmall" style={{ opacity: 0.7 }}>
              Số tiền thanh toán
            </Text>
            <Text.Title style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}>
              {formatPrice(booking.totalAmount)}
            </Text.Title>
          </Box>

          {/* QR Code Image */}
          {qrData && (
            <Box flex justifyContent="center" style={{ marginBottom: 16 }}>
              <Box
                p={4}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
                }}
              >
                <img
                  src={qrData.qrCode}
                  alt="QR Code"
                  style={{ width: 224, height: 224, display: 'block' }}
                />
              </Box>
            </Box>
          )}

          {/* Bank Info */}
          {qrData && (
            <Box
              p={4}
              style={{
                background: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
                borderRadius: 16,
              }}
            >
              <Box flex justifyContent="space-between" alignItems="center" style={{ gap: 12 }}>
                <Text size="xxSmall" style={{ opacity: 0.7 }}>
                  Ngân hàng
                </Text>
                <Text bold size="small">
                  {qrData.bankName}
                </Text>
              </Box>
              <Box
                flex
                justifyContent="space-between"
                alignItems="center"
                mt={2}
                style={{ gap: 12 }}
              >
                <Text size="xxSmall" style={{ opacity: 0.7 }}>
                  Số tài khoản
                </Text>
                <Text bold size="small">
                  {qrData.bankAccount}
                </Text>
              </Box>
              <Box
                flex
                justifyContent="space-between"
                alignItems="center"
                mt={2}
                style={{ gap: 12 }}
              >
                <Text size="xxSmall" style={{ opacity: 0.7 }}>
                  Nội dung CK
                </Text>
                <Text
                  bold
                  size="small"
                  style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}
                >
                  {booking.bookingCode}
                </Text>
              </Box>
            </Box>
          )}

          {/* Timer */}
          <Box style={{ textAlign: 'center', marginTop: 16 }}>
            <Text size="xxSmall" style={{ opacity: 0.7 }}>
              Thời gian còn lại
            </Text>
            <Text.Title
              style={{
                marginTop: 4,
                color:
                  timeLeft < 60
                    ? 'rgb(220, 0, 0)'
                    : 'var(--zaui-light-color-primary, var(--brand-accent))',
              }}
            >
              {formatTime(timeLeft)}
            </Text.Title>
          </Box>

          {/* Checking Status */}
          <Box flex alignItems="center" justifyContent="center" mt={2} style={{ gap: 10 }}>
            <Spinner visible />
            <Text size="small" style={{ opacity: 0.7 }}>
              Đang chờ xác nhận thanh toán...
            </Text>
          </Box>
        </Box>

        {/* Instructions */}
        <Box
          p={4}
          mt={4}
          style={{
            background: 'rgba(0, 97, 193, 0.08)',
            borderRadius: 16,
            border: '1px solid rgba(0, 97, 193, 0.14)',
          }}
        >
          <Box flex alignItems="center" style={{ gap: 8, marginBottom: 8 }}>
            <Icon icon="zi-file" />
            <Text bold size="small">
              Hướng dẫn thanh toán
            </Text>
          </Box>
          <Text size="small">1. Mở app ngân hàng của bạn</Text>
          <Text size="small">2. Quét mã QR phía trên</Text>
          <Text size="small">3. Kiểm tra thông tin và xác nhận chuyển khoản</Text>
          <Text size="small">4. Hệ thống sẽ tự động xác nhận sau khi nhận được tiền</Text>
        </Box>

        {/* Pay Later Option */}
        <Box mt={4}>
          <Button
            fullWidth
            variant="secondary"
            type="neutral"
            onClick={() => navigate(`/booking-confirm?id=${bookingId}`)}
          >
            Thanh toán sau tại salon
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default PaymentPage;
