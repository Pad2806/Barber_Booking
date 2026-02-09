import React, { useEffect, useState } from 'react';
import { Page, Box, Text, Button, Tabs, Icon, Header } from 'zmp-ui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSalonById, type Salon } from '../../services/salon.service';
import {
  getServicesBySalon,
  type Service,
  groupServicesByCategory,
} from '../../services/service.service';
import { getStaffBySalon, type Staff } from '../../services/staff.service';
import { PageLoading, ErrorState, ShareButton } from '../../components/shared';
import { useBookingStore } from '../../stores/bookingStore';
import { SERVICE_CATEGORIES, STAFF_POSITIONS } from '../../config';

const SalonDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const salonId = searchParams.get('id');
  const { setSalon, addService, removeService, selectedServices } = useBookingStore();

  const [salon, setSalonData] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    if (salonId) {
      fetchData();
    }
  }, [salonId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salonData, servicesData, staffData] = await Promise.all([
        getSalonById(salonId!),
        getServicesBySalon(salonId!),
        getStaffBySalon(salonId!),
      ]);
      setSalonData(salonData);
      setServices(servicesData);
      setStaff(staffData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (salon) {
      setSalon(salon);
      navigate('/booking');
    }
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  const toggleService = (service: Service) => {
    if (isServiceSelected(service.id)) {
      removeService(service.id);
    } else {
      addService(service);
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

  if (error || !salon) {
    return <ErrorState message={error || 'Không tìm thấy salon'} onRetry={fetchData} />;
  }

  const groupedServices = groupServicesByCategory(services, SERVICE_CATEGORIES);

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'HAIRCUT':
        return 'zi-star';
      case 'HAIR_STYLING':
        return 'zi-retry';
      case 'HAIR_COLORING':
        return 'zi-camera';
      case 'COMBO':
        return 'zi-more-horiz';
      default:
        return 'zi-more-horiz';
    }
  };

  return (
    <Page
      style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)', paddingBottom: 96 }}
    >
      <Header title="Chi tiết salon" onBackClick={() => navigate(-1)} />
      {/* Hero Section */}
      <Box style={{ position: 'relative', height: 200 }}>
        <img
          src={salon.coverImage || '/assets/images/default-salon.jpg'}
          alt={salon.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.6) 100%)',
          }}
        />
        <Box style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <ShareButton
            type="salon"
            data={{
              salonName: salon.name,
              address: salon.address,
              phone: salon.phone,
              rating: salon.rating,
            }}
            variant="icon"
            onShareError={err => console.error(err)}
          />
        </Box>
        <Box style={{ position: 'absolute', bottom: 12, left: 12, right: 12, color: '#fff' }}>
          <Text.Title size="large" style={{ color: '#fff' }}>
            {salon.name}
          </Text.Title>
          <Box mt={1}>
            <Box flex alignItems="center" style={{ gap: 8 }}>
              <Icon icon="zi-location" />
              <Text size="small" style={{ color: '#fff', opacity: 0.85 }}>
                {salon.address}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Info Cards */}
      <Box flex px={4} style={{ gap: 12, marginTop: -24, position: 'relative', zIndex: 10 }}>
        {[
          {
            icon: 'zi-star',
            value: salon.rating?.toFixed(1) || '5.0',
            sub: `${salon.totalReviews || 0} đánh giá`,
          },
          {
            icon: 'zi-clock-1',
            value: `${salon.openTime} - ${salon.closeTime}`,
            sub: 'Giờ mở cửa',
          },
          { icon: 'zi-call', value: salon.phone, sub: 'Liên hệ' },
        ].map(item => (
          <Box
            key={item.sub}
            p={3}
            style={{
              flex: 1,
              background: 'var(--zaui-light-header-background-color, #fff)',
              borderRadius: 16,
              border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
              textAlign: 'center',
            }}
          >
            <Box flex alignItems="center" justifyContent="center" style={{ gap: 8 }}>
              <Icon icon={item.icon as any} />
              <Text bold>{item.value}</Text>
            </Box>
            <Box mt={1}>
              <Text size="xxSmall" style={{ opacity: 0.7 }}>
                {item.sub}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Tabs */}
      <Box mt={4}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.Tab key="services" label="Dịch vụ">
            <Box p={4}>
              {groupedServices.map(group => (
                <Box key={group.category} mb={4}>
                  <Box flex alignItems="center" style={{ gap: 8, marginBottom: 8 }}>
                    <Icon icon={getCategoryIcon(group.category) as any} />
                    <Text bold>{group.categoryLabel}</Text>
                  </Box>
                  <Box>
                    {group.services.map(service => (
                      <Box
                        key={service.id}
                        p={4}
                        mt={2}
                        style={{
                          background: 'var(--zaui-light-header-background-color, #fff)',
                          borderRadius: 16,
                          border: `2px solid ${
                            isServiceSelected(service.id)
                              ? 'var(--zaui-light-color-primary, var(--brand-accent))'
                              : 'var(--zaui-light-header-divider, #e9ebed)'
                          }`,
                        }}
                        onClick={() => toggleService(service)}
                      >
                        <Box
                          flex
                          justifyContent="space-between"
                          alignItems="flex-start"
                          style={{ gap: 12 }}
                        >
                          <Box style={{ flex: 1 }}>
                            <Text bold>{service.name}</Text>
                            {service.description && (
                              <Box mt={1}>
                                <Text size="small" style={{ opacity: 0.75 }}>
                                  {service.description}
                                </Text>
                              </Box>
                            )}
                            <Box flex alignItems="center" mt={2} style={{ gap: 12 }}>
                              <Text
                                bold
                                style={{
                                  color: 'var(--zaui-light-color-primary, var(--brand-accent))',
                                }}
                              >
                                {formatPrice(service.price)}
                              </Text>
                              <Box flex alignItems="center" style={{ gap: 6, opacity: 0.7 }}>
                                <Icon icon="zi-clock-1" />
                                <Text size="xxSmall">{service.duration} phút</Text>
                              </Box>
                            </Box>
                          </Box>
                          <Box
                            flex
                            alignItems="center"
                            justifyContent="center"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 999,
                              border: `2px solid ${
                                isServiceSelected(service.id)
                                  ? 'var(--zaui-light-color-primary, var(--brand-accent))'
                                  : 'var(--zaui-light-input-border-color, #b9bdc1)'
                              }`,
                              background: isServiceSelected(service.id)
                                ? 'var(--zaui-light-color-primary, var(--brand-accent))'
                                : 'transparent',
                            }}
                          >
                            {isServiceSelected(service.id) && <Icon icon="zi-check" />}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Tabs.Tab>

          <Tabs.Tab key="staff" label="Stylist">
            <Box p={4}>
              {staff.map(member => (
                <Box
                  key={member.id}
                  p={4}
                  mt={2}
                  flex
                  alignItems="center"
                  style={{
                    gap: 12,
                    background: 'var(--zaui-light-header-background-color, #fff)',
                    borderRadius: 16,
                    border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
                  }}
                >
                  <Box style={{ width: 56, height: 56, borderRadius: 999, overflow: 'hidden' }}>
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
                      {STAFF_POSITIONS[member.position as keyof typeof STAFF_POSITIONS] ||
                        member.position}
                    </Text>
                    <Box flex alignItems="center" mt={1} style={{ gap: 6, opacity: 0.8 }}>
                      <Icon icon="zi-star" />
                      <Text size="small">
                        {member.rating.toFixed(1)} ({member.totalReviews})
                      </Text>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Tabs.Tab>

          <Tabs.Tab key="info" label="Thông tin">
            <Box p={4}>
              <Box
                p={4}
                style={{
                  background: 'var(--zaui-light-header-background-color, #fff)',
                  borderRadius: 16,
                  border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
                }}
              >
                <Text bold>Địa chỉ</Text>
                <Box mt={2}>
                  <Text size="small" style={{ opacity: 0.8 }}>
                    {salon.address}, {salon.ward && `${salon.ward}, `}
                    {salon.district}, {salon.city}
                  </Text>
                </Box>
              </Box>
              <Box
                p={4}
                mt={3}
                style={{
                  background: 'var(--zaui-light-header-background-color, #fff)',
                  borderRadius: 16,
                  border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
                }}
              >
                <Text bold>Giờ làm việc</Text>
                <Box mt={2}>
                  <Text size="small" style={{ opacity: 0.8 }}>
                    {salon.openTime} - {salon.closeTime}
                  </Text>
                </Box>
                <Box mt={1}>
                  <Text size="xxSmall" style={{ opacity: 0.6 }}>
                    {salon.workingDays.join(', ')}
                  </Text>
                </Box>
              </Box>
              {salon.description && (
                <Box
                  p={4}
                  mt={3}
                  style={{
                    background: 'var(--zaui-light-header-background-color, #fff)',
                    borderRadius: 16,
                    border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
                  }}
                >
                  <Text bold>Giới thiệu</Text>
                  <Box mt={2}>
                    <Text size="small" style={{ opacity: 0.8 }}>
                      {salon.description}
                    </Text>
                  </Box>
                </Box>
              )}
            </Box>
          </Tabs.Tab>
        </Tabs>
      </Box>

      {/* Floating Book Button */}
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
        <Box flex alignItems="center" justifyContent="space-between" mb={3}>
          <Text size="small" style={{ opacity: 0.8 }}>
            Đã chọn: <Text bold>{selectedServices.length} dịch vụ</Text>
          </Text>
          {selectedServices.length > 0 && (
            <Text bold style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}>
              {formatPrice(selectedServices.reduce((sum, s) => sum + Number(s.price), 0))}
            </Text>
          )}
        </Box>
        <Button fullWidth onClick={handleBooking} disabled={selectedServices.length === 0}>
          {selectedServices.length === 0 ? 'Chọn dịch vụ để đặt lịch' : 'Tiếp tục đặt lịch'}
        </Button>
      </Box>
    </Page>
  );
};

export default SalonDetailPage;
