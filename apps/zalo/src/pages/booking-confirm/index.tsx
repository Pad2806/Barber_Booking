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
    <Page style={{ background: 'var(--brand-background)' }}>
      {/* Success Header - Deep Mahogany */}
      <Box
        p={10}
        style={{
          textAlign: 'center',
          color: 'var(--brand-background)',
          background: 'var(--brand-secondary)',
          borderBottom: '1px solid rgba(165, 124, 82, 0.2)'
        }}
      >
        <Box
          flex
          alignItems="center"
          justifyContent="center"
          style={{
            width: 88,
            height: 88,
            margin: '0 auto 20px',
            borderRadius: 32,
            background: 'rgba(165, 124, 82, 0.1)',
            border: '2px solid var(--brand-primary)',
            boxShadow: '0 16px 32px -8px rgba(0,0,0,0.3)'
          }}
        >
          <Icon icon="zi-check" style={{ color: 'var(--brand-primary)', fontSize: 40 }} />
        </Box>
        <Text style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1, color: 'var(--brand-background)' }}>
          ĐẶT LỊCH THÀNH CÔNG!
        </Text>
        <Box mt={1}>
           <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic' }}>
            MÃ ĐẶT LỊCH: <span style={{ color: 'var(--brand-background)' }}>{booking.bookingCode}</span>
          </Text>
        </Box>
      </Box>

      {/* Booking Details - Premium Card */}
      <Box p={4} style={{ marginTop: -32 }}>
        <Box
          p={6}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 40,
            border: '1px solid var(--brand-border)',
            boxShadow: '0 16px 32px -8px rgba(0,0,0,0.1)'
          }}
        >
          <Box
            flex
            justifyContent="space-between"
            alignItems="center"
            pb={4}
            style={{ borderBottom: '1px dashed var(--brand-border)' }}
          >
            <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)' }}>THÔNG TIN ĐẶT LỊCH</Text>
            <StatusBadge status={booking.status} />
          </Box>

          <Box flex alignItems="center" mt={6} style={{ gap: 16 }}>
            <Box style={{ background: 'var(--brand-muted)', width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Icon icon="zi-location" style={{ color: 'var(--brand-primary)' }} />
            </Box>
            <Box>
              <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>CHỌN SALON</Text>
              <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{booking.salon.name}</Text>
            </Box>
          </Box>

          <Box flex alignItems="center" mt={4} style={{ gap: 16 }}>
            <Box style={{ background: 'var(--brand-muted)', width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Icon icon="zi-calendar" style={{ color: 'var(--brand-primary)' }} />
            </Box>
            <Box>
              <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>NGÀY & GIỜ HẸN</Text>
              <Text style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-secondary)' }}>
                {dayjs(booking.date).format('DD/MM/YYYY')} <span style={{ color: 'var(--brand-primary)' }}>LÚC {booking.timeSlot}</span>
              </Text>
            </Box>
          </Box>

          {booking.staff && (
            <Box flex alignItems="center" mt={4} style={{ gap: 16 }}>
               <Box style={{ background: 'var(--brand-muted)', width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Icon icon="zi-user" style={{ color: 'var(--brand-primary)' }} />
              </Box>
              <Box>
                <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>NGƯỜI THỰC HIỆN</Text>
                <Text style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{booking.staff.user.name}</Text>
              </Box>
            </Box>
          )}

          <Box
            mt={6}
            pt={4}
            style={{ borderTop: '1px dashed var(--brand-border)' }}
          >
            <Text style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-primary)', marginBottom: 8, letterSpacing: 1 }}>DỊCH VỤ STYLING:</Text>
            {booking.services.map(bs => (
              <Box
                key={bs.id}
                flex
                justifyContent="space-between"
                alignItems="center"
                mt={2}
              >
                <Box>
                  <Text style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{bs.service.name}</Text>
                  <Text style={{ fontSize: 9, fontWeight: 700, fontStyle: 'italic', opacity: 0.4 }}>{bs.duration} PHÚT</Text>
                </Box>
                <Text style={{ fontSize: 14, fontWeight: 900, color: 'var(--brand-secondary)' }}>
                  {formatPrice(bs.price)}
                </Text>
              </Box>
            ))}
            <Box
              flex
              justifyContent="space-between"
              mt={4}
              pt={4}
              style={{ borderTop: '1px solid var(--brand-border)' }}
            >
              <Text style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }}>TỔNG CỘNG</Text>
              <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-primary)' }}>
                {formatPrice(booking.totalAmount)}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Payment Info - Vintage Style */}
        <Box
          p={6}
          mt={4}
          style={{
            background: 'var(--brand-muted)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
          }}
        >
          <Box flex justifyContent="space-between" alignItems="center" style={{ gap: 12 }}>
            <Box>
              <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>TRẠNG THÁI THANH TOÁN</Text>
              <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>
                {booking.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
              </Text>
            </Box>
            {booking.paymentStatus !== 'PAID' && (
              <Button 
                onClick={() => navigate(`/payment?bookingId=${booking.id}`)}
                style={{ borderRadius: 20, background: 'var(--brand-primary)', color: 'var(--brand-background)', fontWeight: 900, fontSize: 11, padding: '0 24px' }}
              >
                THANH TOÁN
              </Button>
            )}
          </Box>
        </Box>

        {/* Notes */}
        <Box
          p={6}
          mt={4}
          style={{
            background: 'rgba(165, 124, 82, 0.05)',
            border: '1px solid var(--brand-primary)',
            borderRadius: 32,
          }}
        >
          <Box flex alignItems="center" style={{ gap: 10 }}>
            <Icon icon="zi-warning" style={{ color: 'var(--brand-primary)', fontSize: 20 }} />
            <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)' }}>
              LƯU Ý QUAN TRỌNG
            </Text>
          </Box>
          <Box mt={4} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>• VUI LÒNG ĐẾN TRƯỚC GIỜ HẸN 10 PHÚT</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>• NẾU CẦN HỦY LỊCH, VUI LÒNG BÁO TRƯỚC 2 GIỜ</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>• LIÊN HỆ SALON: {booking.salon.phone}</Text>
          </Box>
        </Box>

        {/* Follow OA Prompt */}
        <Box mt={4}>
          <FollowOAPrompt variant="card" />
        </Box>

        {/* Share Section */}
        <Box
          p={6}
          mt={4}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
          }}
        >
          <Box flex alignItems="center" justifyContent="space-between" style={{ gap: 16 }}>
            <Box>
                <Text style={{ fontSize: 14, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>CHIA SẺ LỊCH HẸN</Text>
              <Text style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', marginTop: 2 }}>
                GỬI CHO BẠN BÈ ĐỂ HẸN CÙNG ĐI
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
      <Box p={4} pb={10} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Button 
            fullWidth 
            onClick={() => navigate('/my-bookings')}
            style={{ 
                height: 56, 
                borderRadius: 28, 
                background: 'var(--brand-primary)', 
                color: 'var(--brand-background)', 
                fontWeight: 900, 
                fontSize: 13,
                letterSpacing: 1
            }}
        >
          XEM LỊCH HẸN CỦA TÔI
        </Button>
        <Button 
            fullWidth 
            type="neutral"
            onClick={() => navigate('/')}
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
          VỀ TRANG CHỦ
        </Button>
      </Box>
    </Page>
  );
};

export default BookingConfirmPage;
