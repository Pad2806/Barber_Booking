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
import { checkIsFavorite, addToFavorites, removeFromFavorites } from '../../services/favorites.service';
import { useSnackbar } from 'zmp-ui';

const SalonDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const salonId = searchParams.get('id');
  const { setSalon, addService, removeService, selectedServices } = useBookingStore();
  const { openSnackbar } = useSnackbar();

  const [salon, setSalonData] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('services');
  const [isFavorited, setIsFavorited] = useState(false);

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

      // Check favorite status separately - don't let it block the page
      try {
        const favoriteData = await checkIsFavorite(salonId!);
        setIsFavorited(favoriteData.data.isFavorite);
      } catch {
        setIsFavorited(false);
      }
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

  const handleToggleFavorite = async () => {
      if (!salon) return;
      try {
          if (isFavorited) {
              await removeFromFavorites(salon.id);
              setIsFavorited(false);
              openSnackbar({ text: 'Đã xóa khỏi danh sách yêu thích', type: 'success' });
          } else {
              await addToFavorites(salon.id);
              setIsFavorited(true);
              openSnackbar({ text: 'Đã thêm vào danh sách yêu thích', type: 'success' });
          }
      } catch (err) {
          openSnackbar({ text: 'Thao tác thất bại', type: 'error' });
      }
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
      style={{ background: 'var(--brand-background)', paddingBottom: 110 }}
    >
      <Header title="CHI TIẾT SALON" onBackClick={() => navigate(-1)} />
      <Box style={{ height: 44 }} />
      {/* Hero Section - Vintage Aesthetic */}
      <Box style={{ position: 'relative', height: 240 }}>
        <img
          src={salon.coverImage || salon.images?.[0] || 'https://images.unsplash.com/photo-1585747860019-8e2e0c35c0e1?w=600&h=300&fit=crop'}
          alt={salon.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.3) contrast(1.1) brightness(0.8)' }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, var(--brand-secondary) 100%)',
          }}
        />
        <Box style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, display: 'flex', gap: 12 }}>
          <Box
            onClick={handleToggleFavorite}
            style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                borderRadius: 14,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
              <Icon icon={isFavorited ? 'zi-heart-solid' : 'zi-heart'} style={{ color: isFavorited ? 'var(--brand-primary)' : '#fff' }} />
          </Box>
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
        <Box style={{ position: 'absolute', bottom: 32, left: 20, right: 20, color: 'var(--brand-background)' }}>
           <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: 2, textTransform: 'uppercase' }}>ESTABLISHED SALON</Text>
          <Text style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1, lineHeight: 1.1, marginTop: 4 }}>
            {salon.name}
          </Text>
          <Box mt={2}>
            <Box flex alignItems="center" style={{ gap: 8 }}>
              <Icon icon="zi-location" style={{ color: 'var(--brand-primary)', fontSize: 16 }} />
              <Text style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.8 }}>
                {salon.address}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Info Cards - Premium Vintage */}
      <Box flex px={4} style={{ gap: 10, marginTop: -20, position: 'relative', zIndex: 10 }}>
        {[
          {
            icon: 'zi-star',
            value: salon.rating?.toFixed(1) || '5.0',
            sub: 'RATING',
          },
          {
            icon: 'zi-clock-1',
            value: `${salon.openTime}-${salon.closeTime}`,
            sub: 'OPENING',
          },
          { icon: 'zi-call', value: 'GỌI NGAY', sub: 'HOTLINE' },
        ].map(item => (
          <Box
            key={item.sub}
            p={3}
            style={{
              flex: 1,
              background: 'var(--brand-background)',
              borderRadius: 24,
              border: item.sub === 'HOTLINE' ? '1px solid var(--brand-primary)' : '1px solid var(--brand-border)',
              textAlign: 'center',
              boxShadow: '0 12px 24px -6px rgba(0,0,0,0.1)'
            }}
            onClick={item.sub === 'HOTLINE' ? () => window.open(`tel:${salon.phone}`) : undefined}
          >
            <Box flex alignItems="center" justifyContent="center" style={{ gap: 6 }}>
              <Icon icon={item.icon as any} style={{ color: 'var(--brand-primary)', fontSize: 14 }} />
              <Text style={{ fontSize: 13, fontWeight: 900, color: 'var(--brand-secondary)' }}>{item.value}</Text>
            </Box>
            <Box mt={1}>
              <Text style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                {item.sub}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Tabs - Vintage Styling */}
      <Box mt={6}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.Tab key="services" label="DỊCH VỤ">
            <Box p={4} pb={10}>
              {groupedServices.map(group => (
                <Box key={group.category} mb={8}>
                  <Box flex alignItems="center" style={{ gap: 10, marginBottom: 12, paddingLeft: 4 }}>
                    <Icon icon={getCategoryIcon(group.category) as any} style={{ color: 'var(--brand-primary)', fontSize: 18 }} />
                    <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)', letterSpacing: 1 }}>{group.categoryLabel}</Text>
                  </Box>
                  <Box>
                    {group.services.map(service => (
                      <Box
                        key={service.id}
                        p={4}
                        mt={3}
                        style={{
                          background: isServiceSelected(service.id) ? 'rgba(165, 124, 82, 0.05)' : 'var(--brand-background)',
                          borderRadius: 24,
                          border: `2px solid ${
                            isServiceSelected(service.id)
                              ? 'var(--brand-primary)'
                              : 'var(--brand-border)'
                          }`,
                          boxShadow: isServiceSelected(service.id) ? '0 8px 24px -4px rgba(165, 124, 82, 0.2)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => toggleService(service)}
                      >
                        <Box
                          flex
                          justifyContent="space-between"
                          alignItems="center"
                          style={{ gap: 16 }}
                        >
                          <Box style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{service.name}</Text>
                            {service.description && (
                              <Box mt={1}>
                                <Text style={{ fontSize: 10, fontWeight: 700, fontStyle: 'italic', opacity: 0.4 }}>
                                  {service.description.toUpperCase()}
                                </Text>
                              </Box>
                            )}
                            <Box flex alignItems="center" mt={3} style={{ gap: 16 }}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: 900,
                                  color: 'var(--brand-primary)',
                                }}
                              >
                                {formatPrice(service.price)}
                              </Text>
                              <Box flex alignItems="center" style={{ gap: 6, opacity: 0.4 }}>
                                <Icon icon="zi-clock-1" style={{ fontSize: 12 }} />
                                <Text style={{ fontSize: 9, fontWeight: 800 }}>{service.duration} PHÚT</Text>
                              </Box>
                            </Box>
                          </Box>
                          <Box
                            flex
                            alignItems="center"
                            justifyContent="center"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 14,
                              border: `2px solid ${
                                isServiceSelected(service.id)
                                  ? 'var(--brand-primary)'
                                  : 'var(--brand-border)'
                              }`,
                              background: isServiceSelected(service.id)
                                ? 'var(--brand-primary)'
                                : 'transparent',
                            }}
                          >
                            {isServiceSelected(service.id) && <Icon icon="zi-check" style={{ color: 'var(--brand-background)', fontSize: 18 }} />}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Tabs.Tab>

          <Tabs.Tab key="staff" label="STYLIST">
            <Box p={4} pb={10}>
              {staff.map(member => (
                <Box
                  key={member.id}
                  p={4}
                  mt={4}
                  flex
                  alignItems="center"
                  style={{
                    gap: 16,
                    background: 'var(--brand-background)',
                    borderRadius: 32,
                    border: '1px solid var(--brand-border)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
                  }}
                >
                  <Box style={{ width: 64, height: 64, borderRadius: 24, overflow: 'hidden', border: '1px solid var(--brand-border)' }}>
                    <img
                      src={member.user.avatar || '/assets/images/default-avatar.jpg'}
                      alt={member.user.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.2)' }}
                    />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>{member.user.name}</Text>
                    <Text
                      style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: 1 }}
                    >
                      {STAFF_POSITIONS[member.position as keyof typeof STAFF_POSITIONS] ||
                        member.position}
                    </Text>
                    <Box flex alignItems="center" mt={2} style={{ gap: 6, opacity: 0.6 }}>
                      <Icon icon="zi-star" style={{ color: 'var(--brand-primary)', fontSize: 12 }} />
                      <Text style={{ fontSize: 11, fontWeight: 800 }}>
                        {member.rating.toFixed(1)} <span style={{ opacity: 0.5 }}>({member.totalReviews} REVIEWS)</span>
                      </Text>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Tabs.Tab>

          <Tabs.Tab key="info" label="THÔNG TIN">
            <Box p={4} pb={10}>
              <Box
                p={6}
                style={{
                  background: 'var(--brand-background)',
                  borderRadius: 32,
                  border: '1px solid var(--brand-border)',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)' }}>ĐỊA CHỈ SALON</Text>
                <Box mt={3}>
                  <Text style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-secondary)', opacity: 0.8 }}>
                    {salon.address}, {salon.ward && `${salon.ward}, `}
                    {salon.district}, {salon.city}
                  </Text>
                </Box>
              </Box>
              <Box
                p={6}
                mt={4}
                style={{
                  background: 'var(--brand-background)',
                  borderRadius: 32,
                  border: '1px solid var(--brand-border)',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)' }}>GIỜ LÀM VIỆC</Text>
                <Box mt={3}>
                  <Text style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-primary)' }}>
                    {salon.openTime} - {salon.closeTime}
                  </Text>
                </Box>
                <Box mt={1}>
                  <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
                    {salon.workingDays.join(', ')}
                  </Text>
                </Box>
              </Box>
              {salon.description && (
                <Box
                  p={6}
                  mt={4}
                  style={{
                    background: 'var(--brand-background)',
                    borderRadius: 32,
                    border: '1px solid var(--brand-border)',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--brand-secondary)' }}>GIỚI THIỆU</Text>
                  <Box mt={3}>
                    <Text style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-secondary)', lineHeight: 1.6, opacity: 0.8 }}>
                      {salon.description}
                    </Text>
                  </Box>
                </Box>
              )}
            </Box>
          </Tabs.Tab>
        </Tabs>
      </Box>

      {/* Floating Book Button - Deep Mahogany */}
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
        <Box flex alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Text style={{ fontSize: 9, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>DỊCH VỤ ĐÃ CHỌN</Text>
            <Text style={{ fontSize: 15, fontWeight: 900, color: 'var(--brand-background)' }}>{selectedServices.length} STYLINGS</Text>
          </Box>
          {selectedServices.length > 0 && (
            <Box style={{ textAlign: 'right' }}>
               <Text style={{ fontSize: 9, fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', opacity: 0.6 }}>TỔNG CỘNG</Text>
               <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-primary)' }}>
                {formatPrice(selectedServices.reduce((sum, s) => sum + Number(s.price), 0))}
               </Text>
            </Box>
          )}
        </Box>
        <Button 
           fullWidth 
           onClick={handleBooking} 
           disabled={selectedServices.length === 0}
           style={{ height: 64, borderRadius: 32, fontWeight: 900, letterSpacing: 2, background: 'var(--brand-primary)', color: 'var(--brand-background)', border: 'none' }}
        >
          {selectedServices.length === 0 ? 'CHỌN DỊCH VỤ ĐỂ ĐẶT LỊCH' : 'TIẾP TỤC ĐẶT LỊCH'}
        </Button>
      </Box>
    </Page>
  );
};

export default SalonDetailPage;
