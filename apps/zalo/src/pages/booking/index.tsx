import React, { useState, useEffect, useMemo } from 'react';
import { Page, Box, Text, Button, DatePicker, Icon, Grid, Header, useSnackbar } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useBookingStore } from '../../stores/bookingStore';
import {
  getStaffBySalon,
  getAvailableSlots,
  type Staff,
  type TimeSlot,
} from '../../services/staff.service';
import { createBooking } from '../../services/booking.service';
import { PageLoading } from '../../components/shared';
import { STAFF_POSITIONS, BOOKING_CONFIG } from '../../config';

type BookingStep = 'services' | 'staff' | 'datetime' | 'confirm';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const {
    salon,
    selectedServices,
    selectedStaff,
    selectedDate,
    selectedTimeSlot,
    note,
    totalDuration,
    totalAmount,
    setStaff,
    setDate,
    setTimeSlot,
    setNote,
    reset,
  } = useBookingStore();

  const [step, setStep] = useState<BookingStep>('services');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!salon || selectedServices.length === 0) {
      navigate('/salons');
      return;
    }
    fetchStaff();
  }, [navigate, salon, selectedServices.length]);

  useEffect(() => {
    if (selectedDate && salon) {
      fetchTimeSlots();
    }
  }, [salon?.id, selectedDate, selectedStaff?.id, totalDuration]);

  const fetchStaff = async () => {
    if (!salon) return;
    try {
      setLoading(true);
      const data = await getStaffBySalon(salon.id);
      setStaffList(data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (!salon || !selectedDate) return;
    try {
      setLoading(true);
      const data = await getAvailableSlots(
        salon.id,
        selectedDate,
        totalDuration,
        selectedStaff?.id
      );
      setTimeSlots(data);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter time slots: mark past slots as unavailable if selected date is today
  const filteredTimeSlots = useMemo(() => {
    if (!selectedDate) return timeSlots;
    const isToday = dayjs(selectedDate).isSame(dayjs(), 'day');
    if (!isToday) return timeSlots;

    const nowPlusBuffer = dayjs().add(BOOKING_CONFIG.minAdvanceHours, 'hour');
    return timeSlots.map(slot => {
      const [h, m] = slot.time.split(':').map(Number);
      const slotTime = dayjs(selectedDate).hour(h).minute(m);
      if (slotTime.isBefore(nowPlusBuffer)) {
        return { ...slot, available: false };
      }
      return slot;
    });
  }, [timeSlots, selectedDate]);

  const depositAmount = Math.round(totalAmount * 0.25);

  const handleSubmit = async () => {
    if (!salon || !selectedDate || !selectedTimeSlot) return;

    try {
      setSubmitting(true);
      const cleanNote = note.trim();
      await createBooking({
        salonId: salon.id,
        ...(selectedStaff?.id ? { staffId: selectedStaff.id } : {}),
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        serviceIds: selectedServices.map(s => s.id),
        ...(cleanNote ? { note: cleanNote } : {}),
      });

      reset();
      openSnackbar({
        text: `Đặt lịch thành công! Phí đặt cọc: ${formatPrice(depositAmount)}. Vui lòng vào Lịch hẹn để thanh toán.`,
        type: 'success',
        duration: 5000,
      });
      navigate('/my-bookings', { replace: true });
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể tạo lịch hẹn. Vui lòng thử lại.';
      openSnackbar({
        text: message,
        type: 'error',
        duration: 3500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const minDate = dayjs().startOf('day').toDate();
  const maxDate = dayjs().add(BOOKING_CONFIG.maxAdvanceDays, 'day').toDate();

  if (!salon || selectedServices.length === 0) {
    return null;
  }

  return (
    <Page
      style={{ background: 'var(--brand-background)', paddingBottom: 120 }}
    >
      <Header title="HOÀN TẤT ĐẶT LỊCH" onBackClick={() => navigate(-1)} />
      <Box style={{ height: 44 }} />
      {/* Progress Steps - Vintage Styled */}
      <Box
        p={6}
        pb={8}
        style={{
          position: 'sticky',
          top: 44,
          zIndex: 10,
          background: 'var(--brand-secondary)',
          borderBottom: '1px solid rgba(165, 124, 82, 0.2)',
        }}
      >
        <Box flex justifyContent="space-between" alignItems="center" style={{ padding: '0 10px' }}>
          {(['services', 'staff', 'datetime', 'confirm'] as BookingStep[]).map((s, i) => (
            <Box key={s} flex alignItems="center" style={{ flex: i < 3 ? 1 : 'none' }}>
              <Box
                flex
                alignItems="center"
                justifyContent="center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 14,
                  background:
                    step === s
                      ? 'var(--brand-primary)'
                      : i < ['services', 'staff', 'datetime', 'confirm'].indexOf(step)
                        ? 'var(--brand-primary)'
                        : 'rgba(255,255,255,0.1)',
                  color: 'var(--brand-background)',
                  border: step === s ? '3px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                {i < ['services', 'staff', 'datetime', 'confirm'].indexOf(step) ? (
                  <Icon icon="zi-check" style={{ fontSize: 18, color: 'var(--brand-background)' }} />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: 900, color: step === s ? 'var(--brand-background)' : 'rgba(255,255,255,0.5)' }}>
                    {i + 1}
                  </Text>
                )}
              </Box>
              {i < 3 && (
                <Box
                  style={{
                    flex: 1,
                    height: 2,
                    margin: '0 8px',
                    background:
                      i < ['services', 'staff', 'datetime', 'confirm'].indexOf(step)
                        ? 'var(--brand-primary)'
                        : 'rgba(255,255,255,0.1)',
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
        <Box flex justifyContent="space-between" mt={4}>
          {['DỊCH VỤ', 'STYLIST', 'LỊCH HẸN', 'XÁC NHẬN'].map((label, i) => (
            <Text 
              key={label} 
              style={{ 
                fontSize: 8, 
                fontWeight: 800, 
                letterSpacing: 1,
                color: i <= ['services', 'staff', 'datetime', 'confirm'].indexOf(step) ? 'var(--brand-primary)' : 'rgba(255,255,255,0.3)'
              }}
            >
              {label}
            </Text>
          ))}
        </Box>
      </Box>

      {/* Step Content - Vintage Styled */}
      <Box p={4}>
        {/* Step 1: Selected Services Summary */}
        {step === 'services' && (
          <Box className="animate-fade-in" pb={10}>
            <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)', letterSpacing: 1 }}>DỊCH VỤ ĐÃ CHỌN</Text>
            <Box mt={4}>
              {selectedServices.map(service => (
                <Box
                  key={service.id}
                  p={4}
                  mt={3}
                  flex
                  justifyContent="space-between"
                  alignItems="center"
                  style={{
                    background: 'var(--brand-background)',
                    borderRadius: 24,
                    border: '1px solid var(--brand-border)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
                  }}
                >
                  <Box>
                    <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{service.name}</Text>
                    <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                      {service.duration} PHÚT
                    </Text>
                  </Box>
                  <Text
                    style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-primary)' }}
                  >
                    {formatPrice(service.price)}
                  </Text>
                </Box>
              ))}
            </Box>
            <Box
              p={6}
              mt={4}
              style={{
                background: 'var(--brand-muted)',
                borderRadius: 32,
                border: '1px solid var(--brand-border)'
              }}
            >
              <Box flex justifyContent="space-between" alignItems="center">
                <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-secondary)', textTransform: 'uppercase', opacity: 0.6 }}>TỔNG THỜI GIAN</Text>
                <Text style={{ fontSize: 15, fontWeight: 900, color: 'var(--brand-secondary)' }}>{totalDuration} PHÚT</Text>
              </Box>
              <Box flex justifyContent="space-between" alignItems="center" mt={4} pt={4} style={{ borderTop: '1px dashed var(--brand-border)' }}>
                <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-secondary)', textTransform: 'uppercase', opacity: 0.6 }}>TỔNG TẠM TÍNH</Text>
                <Text
                  style={{ fontSize: 24, fontWeight: 900, color: 'var(--brand-primary)' }}
                >
                  {formatPrice(totalAmount)}
                </Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 2: Select Staff */}
        {step === 'staff' && (
          <Box className="animate-fade-in" pb={10}>
            <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)', letterSpacing: 1 }}>CHỌN STYLIST</Text>

            {/* Skip option */}
            <Box
              p={4}
              mt={4}
              style={{
                background: !selectedStaff ? 'rgba(165, 124, 82, 0.05)' : 'var(--brand-background)',
                borderRadius: 32,
                border: `2px solid ${
                  !selectedStaff
                    ? 'var(--brand-primary)'
                    : 'var(--brand-border)'
                }`,
                boxShadow: !selectedStaff ? '0 8px 24px -4px rgba(165, 124, 82, 0.2)' : 'none',
              }}
              onClick={() => setStaff(null)}
            >
              <Box flex alignItems="center" style={{ gap: 16 }}>
                <Box
                  flex
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 24,
                    background: 'var(--brand-muted)',
                    border: '1px solid var(--brand-border)'
                  }}
                >
                  <Icon icon="zi-more-horiz" style={{ color: 'var(--brand-primary)' }} />
                </Box>
                <Box>
                  <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>ĐỂ SALON TỰ CHỌN</Text>
                  <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                    CHÚNG TÔI SẼ CHỌN STYLIST PHÙ HỢP NHẤT
                  </Text>
                </Box>
              </Box>
            </Box>

            {loading ? (
              <PageLoading />
            ) : (
              <Box mt={3}>
                {staffList.map(member => (
                  <Box
                    key={member.id}
                    p={4}
                    mt={3}
                    style={{
                      background: selectedStaff?.id === member.id ? 'rgba(165, 124, 82, 0.05)' : 'var(--brand-background)',
                      borderRadius: 32,
                      border: `2px solid ${
                        selectedStaff?.id === member.id
                          ? 'var(--brand-primary)'
                          : 'var(--brand-border)'
                      }`,
                      boxShadow: selectedStaff?.id === member.id ? '0 8px 24px -4px rgba(165, 124, 82, 0.2)' : 'none',
                    }}
                    onClick={() => setStaff(member)}
                  >
                    <Box flex alignItems="center" style={{ gap: 16 }}>
                      <Box style={{ width: 56, height: 56, borderRadius: 24, overflow: 'hidden', border: '1px solid var(--brand-border)' }}>
                        <img
                          src={member.user.avatar || '/assets/images/default-avatar.jpg'}
                          alt={member.user.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.4)' }}
                        />
                      </Box>
                      <Box style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{member.user.name}</Text>
                        <Text
                          style={{ fontSize: 9, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: 1 }}
                        >
                          {STAFF_POSITIONS[member.position as keyof typeof STAFF_POSITIONS]}
                        </Text>
                        <Box flex alignItems="center" mt={1} style={{ gap: 6, opacity: 0.6 }}>
                          <Icon icon="zi-star" style={{ color: 'var(--brand-primary)', fontSize: 12 }} />
                          <Text style={{ fontSize: 10, fontWeight: 800 }}>{member.rating.toFixed(1)}</Text>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 'datetime' && (
          <Box className="animate-fade-in" pb={10}>
            <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)', letterSpacing: 1 }}>CHỌN LỊCH HẸN</Text>

            {/* Date Picker Section */}
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
              <Box flex alignItems="center" style={{ gap: 8, marginBottom: 16 }}>
                 <Icon icon="zi-calendar" style={{ color: 'var(--brand-primary)', fontSize: 16 }} />
                 <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)' }}>CHỌN NGÀY</Text>
              </Box>
              <Box>
                <DatePicker
                  value={selectedDate ? new Date(selectedDate) : undefined}
                  onChange={date => setDate(dayjs(date).format('YYYY-MM-DD'))}
                  startDate={minDate}
                  endDate={maxDate}
                  title="CHỌN NGÀY HẸN"
                />
              </Box>
            </Box>

            {/* Time Slots Section */}
            {selectedDate && (
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
                <Box flex alignItems="center" style={{ gap: 8, marginBottom: 16 }}>
                   <Icon icon="zi-clock-1" style={{ color: 'var(--brand-primary)', fontSize: 16 }} />
                   <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)' }}>CHỌN GIỜ</Text>
                </Box>
                <Box>
                  {loading ? (
                    <PageLoading />
                  ) : timeSlots.length === 0 ? (
                    <Box p={4} style={{ textAlign: 'center' }}>
                      <Text style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                        KHÔNG CÓ KHUNG GIỜ TRỐNG
                      </Text>
                    </Box>
                  ) : (
                    <Grid columnCount={4} columnSpace="10px" rowSpace="10px">
                      {filteredTimeSlots.map(slot => (
                        <Box
                          key={slot.time}
                          p={3}
                          style={{
                            textAlign: 'center',
                            borderRadius: 14,
                            background: !slot.available
                              ? 'var(--brand-muted)'
                              : selectedTimeSlot === slot.time
                                ? 'var(--brand-primary)'
                                : 'var(--brand-background)',
                            border: `1px solid ${selectedTimeSlot === slot.time ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
                            color: !slot.available
                              ? 'rgba(0,0,0,0.1)'
                              : selectedTimeSlot === slot.time
                                ? 'var(--brand-background)'
                                : 'var(--brand-secondary)',
                            fontWeight: 900,
                            opacity: slot.available ? 1 : 0.5,
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => slot.available && setTimeSlot(slot.time)}
                        >
                          <Text style={{ fontSize: 11, color: 'inherit', fontWeight: 900 }}>
                            {slot.time}
                          </Text>
                        </Box>
                      ))}
                    </Grid>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && (
          <Box className="animate-fade-in" pb={10}>
            <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)', letterSpacing: 1 }}>XÁC NHẬN ĐẶT LỊCH</Text>

            {/* Summary Box */}
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
              <Box flex alignItems="center" style={{ gap: 16 }}>
                <Icon icon="zi-location" style={{ color: 'var(--brand-primary)' }} />
                <Box>
                  <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                    SALON
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: 900, color: 'var(--brand-secondary)' }}>{salon.name}</Text>
                </Box>
              </Box>

              <Box flex alignItems="center" mt={4} style={{ gap: 16 }}>
                <Icon icon="zi-calendar" style={{ color: 'var(--brand-primary)' }} />
                <Box>
                  <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                    LỊCH HẸN
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: 900, color: 'var(--brand-secondary)' }}>
                    {dayjs(selectedDate).format('DD/MM/YYYY')} · {selectedTimeSlot}
                  </Text>
                </Box>
              </Box>

              <Box flex alignItems="center" mt={4} style={{ gap: 16 }}>
                <Icon icon="zi-user" style={{ color: 'var(--brand-primary)' }} />
                <Box>
                  <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                    STYLIST
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: 900, color: 'var(--brand-secondary)' }}>{selectedStaff ? selectedStaff.user.name : 'ĐỂ SALON TỰ CHỌN'}</Text>
                </Box>
              </Box>

              <Box
                mt={6}
                pt={6}
                style={{ borderTop: '1px dashed var(--brand-border)' }}
              >
                <Text style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)', opacity: 0.6 }}>CHI TIẾT DỊCH VỤ:</Text>
                {selectedServices.map(service => (
                  <Box key={service.id} flex justifyContent="space-between" mt={3}>
                    <Text style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>
                      {service.name}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: 900, color: 'var(--brand-secondary)' }}>{formatPrice(service.price)}</Text>
                  </Box>
                ))}
                <Box
                  flex
                  justifyContent="space-between"
                  mt={4}
                  pt={4}
                  style={{ borderTop: '1px solid var(--brand-border)' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>TỔNG CỘNG</Text>
                  <Text
                    style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-primary)' }}
                  >
                    {formatPrice(totalAmount)}
                  </Text>
                </Box>
                
                {/* Deposit Badge - Vintage Style */}
                <Box
                  flex
                  justifyContent="space-between"
                  alignItems="center"
                  mt={4}
                  p={4}
                  style={{
                    background: 'rgba(165, 124, 82, 0.05)',
                    borderRadius: 24,
                    border: '1px solid rgba(165, 124, 82, 0.2)',
                  }}
                >
                  <Box>
                    <Text style={{ fontSize: 12, fontWeight: 900, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>PHÍ ĐẶT CỌC (25%)</Text>
                    <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>THANH TOÁN SAU KHI ĐẶT</Text>
                  </Box>
                  <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-primary)' }}>
                    {formatPrice(depositAmount)}
                  </Text>
                </Box>
              </Box>
            </Box>

            {/* Note Section */}
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
              <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)' }}>GHI CHÚ (NẾU CÓ)</Text>
              <Box mt={3}>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn cắt kiểu undercut..."
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
            </Box>
          </Box>
        )}
      </Box>

      {/* Bottom Navigation - Fixed Vintage Bar */}
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
        <Box flex style={{ gap: 12 }}>
          {step !== 'services' && (
            <Button
              fullWidth
              variant="secondary"
              onClick={() => {
                const steps: BookingStep[] = ['services', 'staff', 'datetime', 'confirm'];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1]);
                }
              }}
              style={{ height: 64, borderRadius: 32, fontWeight: 900, letterSpacing: 2, background: 'rgba(255,255,255,0.05)', color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)' }}
            >
              QUAY LẠI
            </Button>
          )}
          <Button
            fullWidth
            loading={submitting}
            disabled={(step === 'datetime' && (!selectedDate || !selectedTimeSlot)) || submitting}
            onClick={() => {
              if (step === 'confirm') {
                handleSubmit();
              } else {
                const steps: BookingStep[] = ['services', 'staff', 'datetime', 'confirm'];
                const currentIndex = steps.indexOf(step);
                if (currentIndex < steps.length - 1) {
                  setStep(steps[currentIndex + 1]);
                }
              }
            }}
            style={{ height: 64, borderRadius: 32, fontWeight: 900, letterSpacing: 2, background: 'var(--brand-primary)', color: 'var(--brand-background)', border: 'none' }}
          >
            {step === 'confirm' ? 'XÁC NHẬN ĐẶT LỊCH' : 'TIẾP TỤC'}
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default BookingPage;
