import React, { useState, useEffect } from 'react';
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

  const handleSubmit = async () => {
    if (!salon || !selectedDate || !selectedTimeSlot) return;

    try {
      setSubmitting(true);
      const cleanNote = note.trim();
      const booking = await createBooking({
        salonId: salon.id,
        ...(selectedStaff?.id ? { staffId: selectedStaff.id } : {}),
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        serviceIds: selectedServices.map(s => s.id),
        ...(cleanNote ? { note: cleanNote } : {}),
      });

      reset();
      navigate(`/booking-confirm?id=${booking.id}`);
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

  const minDate = dayjs().add(BOOKING_CONFIG.minAdvanceHours, 'hour').toDate();
  const maxDate = dayjs().add(BOOKING_CONFIG.maxAdvanceDays, 'day').toDate();

  if (!salon || selectedServices.length === 0) {
    return null;
  }

  return (
    <Page
      style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)', paddingBottom: 120 }}
    >
      <Header title="Đặt lịch" onBackClick={() => navigate(-1)} />
      {/* Progress Steps */}
      <Box
        p={4}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--zaui-light-header-background-color, #fff)',
          borderBottom: '1px solid var(--zaui-light-header-divider, #e9ebed)',
        }}
      >
        <Box flex justifyContent="space-between" alignItems="center">
          {(['services', 'staff', 'datetime', 'confirm'] as BookingStep[]).map((s, i) => (
            <Box key={s} flex alignItems="center">
              <Box
                flex
                alignItems="center"
                justifyContent="center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background:
                    step === s
                      ? 'var(--zaui-light-color-primary, var(--brand-accent))'
                      : i < ['services', 'staff', 'datetime', 'confirm'].indexOf(step)
                        ? 'var(--zaui-light-input-status-success-icon-color, #34b764)'
                        : 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {i < ['services', 'staff', 'datetime', 'confirm'].indexOf(step) ? (
                  <Icon icon="zi-check" />
                ) : (
                  <Text size="xxSmall" style={{ color: '#fff' }}>
                    {i + 1}
                  </Text>
                )}
              </Box>
              {i < 3 && (
                <Box
                  style={{
                    width: 28,
                    height: 2,
                    background:
                      i < ['services', 'staff', 'datetime', 'confirm'].indexOf(step)
                        ? 'var(--zaui-light-input-status-success-icon-color, #34b764)'
                        : 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
        <Box flex justifyContent="space-between" mt={2}>
          {['Dịch vụ', 'Stylist', 'Ngày giờ', 'Xác nhận'].map(label => (
            <Text key={label} size="xxSmall" style={{ opacity: 0.7 }}>
              {label}
            </Text>
          ))}
        </Box>
      </Box>

      {/* Step Content */}
      <Box p={4}>
        {/* Step 1: Selected Services Summary */}
        {step === 'services' && (
          <Box className="animate-fade-in">
            <Text.Title size="normal">Dịch vụ đã chọn</Text.Title>
            <Box mt={3}>
              {selectedServices.map(service => (
                <Box
                  key={service.id}
                  p={4}
                  mt={2}
                  flex
                  justifyContent="space-between"
                  alignItems="center"
                  style={{
                    background: 'var(--zaui-light-header-background-color, #fff)',
                    borderRadius: 16,
                    border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
                  }}
                >
                  <Box>
                    <Text bold>{service.name}</Text>
                    <Text size="small" style={{ opacity: 0.7 }}>
                      {service.duration} phút
                    </Text>
                  </Box>
                  <Text
                    bold
                    style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}
                  >
                    {formatPrice(service.price)}
                  </Text>
                </Box>
              ))}
            </Box>
            <Box
              p={4}
              mt={3}
              style={{
                background: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
                borderRadius: 16,
              }}
            >
              <Box flex justifyContent="space-between">
                <Text size="small" style={{ opacity: 0.8 }}>
                  Tổng thời gian:
                </Text>
                <Text bold>{totalDuration} phút</Text>
              </Box>
              <Box flex justifyContent="space-between" mt={2}>
                <Text size="small" style={{ opacity: 0.8 }}>
                  Tổng tiền:
                </Text>
                <Text
                  bold
                  style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}
                >
                  {formatPrice(totalAmount)}
                </Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 2: Select Staff */}
        {step === 'staff' && (
          <Box className="animate-fade-in">
            <Text.Title size="normal">Chọn Stylist (không bắt buộc)</Text.Title>

            {/* Skip option */}
            <Box
              p={4}
              mt={3}
              style={{
                background: 'var(--zaui-light-header-background-color, #fff)',
                borderRadius: 16,
                border: `2px solid ${
                  !selectedStaff
                    ? 'var(--zaui-light-color-primary, var(--brand-accent))'
                    : 'var(--zaui-light-header-divider, #e9ebed)'
                }`,
              }}
              onClick={() => setStaff(null)}
            >
              <Box flex alignItems="center" style={{ gap: 12 }}>
                <Box
                  flex
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    background: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
                  }}
                >
                  <Icon icon="zi-more-horiz" />
                </Box>
                <Box>
                  <Text bold>Để salon tự chọn</Text>
                  <Text size="small" style={{ opacity: 0.75 }}>
                    Chúng tôi sẽ chọn stylist phù hợp nhất
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
                    mt={2}
                    style={{
                      background: 'var(--zaui-light-header-background-color, #fff)',
                      borderRadius: 16,
                      border: `2px solid ${
                        selectedStaff?.id === member.id
                          ? 'var(--zaui-light-color-primary, var(--brand-accent))'
                          : 'var(--zaui-light-header-divider, #e9ebed)'
                      }`,
                    }}
                    onClick={() => setStaff(member)}
                  >
                    <Box flex alignItems="center" style={{ gap: 12 }}>
                      <Box style={{ width: 52, height: 52, borderRadius: 999, overflow: 'hidden' }}>
                        <img
                          src={member.user.avatar || '/assets/images/default-avatar.jpg'}
                          alt={member.user.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <Box style={{ flex: 1 }}>
                        <Text bold>{member.user.name}</Text>
                        <Text
                          size="small"
                          style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}
                        >
                          {STAFF_POSITIONS[member.position as keyof typeof STAFF_POSITIONS]}
                        </Text>
                        <Box flex alignItems="center" mt={1} style={{ gap: 6, opacity: 0.8 }}>
                          <Icon icon="zi-star" />
                          <Text size="small">{member.rating.toFixed(1)}</Text>
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
          <Box className="animate-fade-in">
            <Text.Title size="normal">Chọn ngày & giờ</Text.Title>

            {/* Date Picker */}
            <Box
              p={4}
              mt={3}
              style={{
                background: 'var(--zaui-light-header-background-color, #fff)',
                borderRadius: 16,
                border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
              }}
            >
              <Text bold>Chọn ngày</Text>
              <Box mt={3}>
                <DatePicker
                  value={selectedDate ? new Date(selectedDate) : undefined}
                  onChange={date => setDate(dayjs(date).format('YYYY-MM-DD'))}
                  startDate={minDate}
                  endDate={maxDate}
                  title="Chọn ngày"
                />
              </Box>
            </Box>

            {/* Time Slots */}
            {selectedDate && (
              <Box
                p={4}
                mt={3}
                style={{
                  background: 'var(--zaui-light-header-background-color, #fff)',
                  borderRadius: 16,
                  border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
                }}
              >
                <Text bold>Chọn giờ</Text>
                <Box mt={3}>
                  {loading ? (
                    <PageLoading />
                  ) : timeSlots.length === 0 ? (
                    <Box p={4} style={{ textAlign: 'center' }}>
                      <Text size="small" style={{ opacity: 0.7 }}>
                        Không có khung giờ trống
                      </Text>
                    </Box>
                  ) : (
                    <Grid columnCount={4} columnSpace="8px" rowSpace="8px">
                      {timeSlots.map(slot => (
                        <Box
                          key={slot.time}
                          p={3}
                          style={{
                            textAlign: 'center',
                            borderRadius: 12,
                            background: !slot.available
                              ? 'var(--zaui-light-button-background-disabled, #d6d9dc)'
                              : selectedTimeSlot === slot.time
                                ? 'var(--zaui-light-color-primary, var(--brand-accent))'
                                : 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
                            color: !slot.available
                              ? 'var(--zaui-light-button-text-disabled, #b9bdc1)'
                              : selectedTimeSlot === slot.time
                                ? '#fff'
                                : 'var(--zaui-light-text-color, #141415)',
                            fontWeight: 600,
                            opacity: slot.available ? 1 : 0.8,
                          }}
                          onClick={() => slot.available && setTimeSlot(slot.time)}
                        >
                          <Text size="xxSmall" style={{ color: 'inherit' }}>
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
          <Box className="animate-fade-in">
            <Text.Title size="normal">Xác nhận đặt lịch</Text.Title>

            {/* Summary */}
            <Box
              p={4}
              mt={3}
              style={{
                background: 'var(--zaui-light-header-background-color, #fff)',
                borderRadius: 16,
                border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
              }}
            >
              <Box flex alignItems="center" style={{ gap: 12 }}>
                <Icon icon="zi-location" />
                <Box>
                  <Text size="xxSmall" style={{ opacity: 0.7 }}>
                    Salon
                  </Text>
                  <Text bold>{salon.name}</Text>
                </Box>
              </Box>

              <Box flex alignItems="center" mt={3} style={{ gap: 12 }}>
                <Icon icon="zi-calendar" />
                <Box>
                  <Text size="xxSmall" style={{ opacity: 0.7 }}>
                    Ngày & giờ
                  </Text>
                  <Text bold>
                    {dayjs(selectedDate).format('DD/MM/YYYY')} lúc {selectedTimeSlot}
                  </Text>
                </Box>
              </Box>

              <Box flex alignItems="center" mt={3} style={{ gap: 12 }}>
                <Icon icon="zi-user" />
                <Box>
                  <Text size="xxSmall" style={{ opacity: 0.7 }}>
                    Stylist
                  </Text>
                  <Text bold>{selectedStaff ? selectedStaff.user.name : 'Để salon chọn'}</Text>
                </Box>
              </Box>

              <Box
                mt={4}
                pt={4}
                style={{ borderTop: '1px solid var(--zaui-light-header-divider, #e9ebed)' }}
              >
                <Text bold>Dịch vụ:</Text>
                {selectedServices.map(service => (
                  <Box key={service.id} flex justifyContent="space-between" mt={2}>
                    <Text size="small" style={{ opacity: 0.8 }}>
                      {service.name}
                    </Text>
                    <Text size="small">{formatPrice(service.price)}</Text>
                  </Box>
                ))}
                <Box
                  flex
                  justifyContent="space-between"
                  mt={3}
                  pt={3}
                  style={{ borderTop: '1px solid var(--zaui-light-header-divider, #e9ebed)' }}
                >
                  <Text bold>Tổng cộng</Text>
                  <Text
                    bold
                    style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}
                  >
                    {formatPrice(totalAmount)}
                  </Text>
                </Box>
              </Box>
            </Box>

            {/* Note */}
            <Box
              p={4}
              mt={3}
              style={{
                background: 'var(--zaui-light-header-background-color, #fff)',
                borderRadius: 16,
                border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
              }}
            >
              <Text bold>Ghi chú (không bắt buộc)</Text>
              <Box mt={2}>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn cắt kiểu undercut..."
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
            </Box>
          </Box>
        )}
      </Box>

      {/* Bottom Navigation */}
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
        <Box flex style={{ gap: 12 }}>
          {step !== 'services' && (
            <Button
              fullWidth
              variant="secondary"
              type="neutral"
              onClick={() => {
                const steps: BookingStep[] = ['services', 'staff', 'datetime', 'confirm'];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1]);
                }
              }}
            >
              Quay lại
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
          >
            {step === 'confirm' ? 'Xác nhận đặt lịch' : 'Tiếp tục'}
          </Button>
        </Box>
      </Box>
    </Page>
  );
};

export default BookingPage;
