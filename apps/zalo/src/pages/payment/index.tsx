import React, { useEffect, useState } from 'react';
import { Page, Box, Text, Button, Icon, Header, Spinner } from 'zmp-ui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getBookingById, type Booking } from '../../services/booking.service';
import {
  generatePaymentQR,
  getPaymentByBooking,
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
        try {
          // Try to create a new payment with QR
          const qr = await generatePaymentQR(bookingId!);
          setQrData(qr);
        } catch (createErr: any) {
          // If payment already exists, fetch it instead
          const existingPayment = await getPaymentByBooking(bookingId!);
          if (existingPayment) {
            setQrData(existingPayment as any);
          } else {
            throw createErr;
          }
        }
      } else {
        setIsPaid(true);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message);
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
      <Page style={{ background: 'var(--brand-background)' }}>
        <Header title="THANH TOÁN" onBackClick={() => navigate(-1)} />
        <Box style={{ height: 44 }} />
        <Box
          p={8}
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ minHeight: 'calc(100vh - 100px)', textAlign: 'center' }}
        >
          <Box
            flex
            alignItems="center"
            justifyContent="center"
            style={{
              width: 100,
              height: 100,
              borderRadius: 32,
              background: 'var(--brand-secondary)',
              border: '2px solid var(--brand-primary)',
              marginBottom: 32,
              boxShadow: '0 16px 32px rgba(165, 124, 82, 0.2)'
            }}
          >
            <Icon icon="zi-check" style={{ color: 'var(--brand-primary)', fontSize: 40 }} />
          </Box>
          <Text style={{ fontSize: 28, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase', letterSpacing: -1 }}>THANH TOÁN THÀNH CÔNG</Text>
          <Box mt={4} mb={8}>
            <Text style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>
              CẢM ƠN QUÝ KHÁCH ĐÃ TIN TƯỞNG SỬ DỤNG DỊCH VỤ. ĐANG CHUYỂN HƯỚNG...
            </Text>
          </Box>

          <Box style={{ width: '100%', maxWidth: 420, marginBottom: 24 }}>
            <FollowOAPrompt variant="banner" />
          </Box>

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
              label="CHIA SẺ VỚI BẠN BÈ"
            />
          )}
        </Box>
      </Page>
    );
  }

  return (
    <Page style={{ background: 'var(--brand-background)' }}>
      <Header title="THANH TOÁN" onBackClick={() => navigate(-1)} />
      <Box style={{ height: 44 }} />

      <Box p={4} flex justifyContent="center">
        <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: 2 }}>
          MÃ ĐẶT LỊCH: <span style={{ color: 'var(--brand-secondary)' }}>{booking.bookingCode}</span>
        </Text>
      </Box>

      {/* QR Code Section - Premium Vintage */}
      <Box p={4}>
        <Box
          p={6}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
            boxShadow: '0 16px 32px rgba(0,0,0,0.05)'
          }}
        >
          {/* Amount Box */}
          <Box 
            p={6}
            mb={6}
            style={{ 
                background: 'var(--brand-secondary)', 
                borderRadius: 24, 
                textAlign: 'center',
                border: '1px solid var(--brand-primary)'
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: 2 }}>SỐ TIỀN ĐẶT CỌC (50%)</Text>
            <Text style={{ fontSize: 32, fontWeight: 900, color: 'var(--brand-background)', marginTop: 4 }}>
              {formatPrice(Math.round(booking.totalAmount * 0.5))}
            </Text>
          </Box>

          {/* QR Code Area */}
          {qrData && (
            <Box flex justifyContent="center" mb={6}>
              <Box
                p={4}
                style={{
                  background: '#fff',
                  borderRadius: 24,
                  border: '1px solid var(--brand-border)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
                }}
              >
                <img
                  src={qrData.qrCodeUrl || qrData.qrCode}
                  alt="QR Code"
                  style={{ width: 220, height: 220, display: 'block' }}
                />
              </Box>
            </Box>
          )}

          {/* Bank Info Cards */}
          {qrData && (
            <Box 
              p={5}
              style={{
                background: 'var(--brand-muted)',
                borderRadius: 24,
                border: '1px solid var(--brand-border)'
              }}
            >
              <Box flex justifyContent="space-between" alignItems="center" mb={4}>
                <Text style={{ fontSize: 9, fontWeight: 800, opacity: 0.4, textTransform: 'uppercase' }}>NGÂN HÀNG</Text>
                <Text style={{ fontSize: 13, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{qrData.bankName || qrData.bankCode || 'N/A'}</Text>
              </Box>
              <Box flex justifyContent="space-between" alignItems="center" mb={4}>
                <Text style={{ fontSize: 9, fontWeight: 800, opacity: 0.4, textTransform: 'uppercase' }}>SỐ TÀI KHOẢN</Text>
                <Text style={{ fontSize: 13, fontWeight: 900, color: 'var(--brand-secondary)' }}>{qrData.bankAccount}</Text>
              </Box>
              <Box flex justifyContent="space-between" alignItems="center">
                <Text style={{ fontSize: 9, fontWeight: 800, opacity: 0.4, textTransform: 'uppercase' }}>NỘI DUNG CK</Text>
                <Text style={{ fontSize: 13, fontWeight: 900, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>{booking.bookingCode}</Text>
              </Box>
            </Box>
          )}

          {/* Timer Section */}
          <Box style={{ textAlign: 'center', marginTop: 24 }}>
            <Text style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>THỜI GIAN CÒN LẠI</Text>
            <Text style={{ 
                fontSize: 24, 
                fontWeight: 900, 
                marginTop: 4,
                color: timeLeft < 60 ? '#ef4444' : 'var(--brand-secondary)'
            }}>
              {formatTime(timeLeft)}
            </Text>
          </Box>

          {/* Status Bar */}
          <Box flex alignItems="center" justifyContent="center" mt={4} style={{ gap: 12 }}>
            <Spinner visible />
            <Text style={{ fontSize: 11, fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>ĐANG CHỜ XÁC NHẬN...</Text>
          </Box>
        </Box>

        {/* Instructions - Vintage Note */}
        <Box
          p={6}
          mt={4}
          style={{
            background: 'rgba(165, 124, 82, 0.05)',
            borderRadius: 32,
            border: '1px solid var(--brand-primary)',
          }}
        >
          <Box flex alignItems="center" style={{ gap: 10, marginBottom: 12 }}>
            <Icon icon="zi-info-circle-solid" style={{ color: 'var(--brand-primary)', fontSize: 20 }} />
            <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)' }}>HƯỚNG DẪN</Text>
          </Box>
          <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>1. MỞ ỨNG DỤNG NGÂN HÀNG CỦA QUÝ KHÁCH</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>2. QUÉT MÃ QR HOẶC CHUYỂN KHOẢN ĐÚNG NỘI DUNG</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>3. XÁC NHẬN CHUYỂN KHOẢN ĐỂ HOÀN TẤT ĐẶT LỊCH</Text>
          </Box>
        </Box>

        {/* Actions */}
        <Box mt={6} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            fullWidth
            type="neutral"
            onClick={() => navigate(`/booking-confirm?id=${bookingId}`)}
            style={{ 
                height: 56, 
                borderRadius: 28, 
                border: '1px solid var(--brand-primary)', 
                background: 'transparent',
                color: 'var(--brand-primary)', 
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: 1
            }}
          >
            THANH TOÁN SAU TẠI SALON
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default PaymentPage;
