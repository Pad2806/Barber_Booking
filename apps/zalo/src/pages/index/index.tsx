import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Box, Text, Button, Icon, Grid } from 'zmp-ui';
import { BRAND_CONFIG, SERVICE_CATEGORIES } from '../../config';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const accent = BRAND_CONFIG.colors.accent;

  return (
    <Page className="animate-fade-in">
      {/* Hero Section - Vintage Aesthetic */}
      <Box className="web-hero safe-area-top" style={{ padding: 24, paddingBottom: 40, background: 'var(--brand-secondary)' }}>
        <Box style={{ maxWidth: 520, margin: '0 auto' }}>
          <Text
            style={{
              fontSize: 32,
              lineHeight: 1.1,
              fontWeight: 900,
              color: 'var(--brand-background)',
              letterSpacing: -0.01,
              textTransform: 'uppercase',
            }}
          >
            Phong cách
          </Text>
          <Text
            style={{
              fontSize: 48,
              lineHeight: 1,
              fontWeight: 900,
              color: 'var(--brand-background)',
              letterSpacing: -0.02,
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            <span style={{ color: 'var(--brand-primary)' }}>Tân cổ</span> điển
          </Text>

          <Box mt={3}>
            <Text className="web-hero-subtitle" style={{ fontSize: 13, lineHeight: 1.6, textTransform: 'uppercase', fontWeight: 600, opacity: 0.6, letterSpacing: 1.5 }}>
              TRẢI NGHIỆM DỊCH VỤ CẮT GỘI ĐẲNG CẤP REETRO
            </Text>
          </Box>

          <Box mt={5} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button 
               fullWidth 
               size="large"
               onClick={() => navigate('/salons')}
               style={{ height: 56, borderRadius: 28, fontWeight: 800, letterSpacing: 2, background: 'var(--brand-primary)', color: 'var(--brand-background)' }}
            >
              ĐẶT LỊCH NGAY
            </Button>
            <button
              type="button"
              className="web-hero-secondaryBtn"
              style={{
                width: '100%',
                height: 56,
                borderRadius: 28,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 1,
                textTransform: 'uppercase',
                border: '2px solid rgba(165, 124, 82, 0.3)',
                background: 'transparent',
                color: 'var(--brand-primary)'
              }}
              onClick={() => navigate('/salons')}
            >
              KHÁM PHÁ SALON
            </button>
          </Box>

          <Box mt={5}>
            <Grid columnCount={2} columnSpace="12px" rowSpace="12px">
              {[
                { value: '100+', label: 'Chi nhánh' },
                { value: '500K+', label: 'Khách hàng' },
                { value: '4.9', label: 'Đánh giá' },
                { value: '1000+', label: 'Stylist' },
              ].map(stat => (
                <Box key={stat.label} className="web-stat" p={3}>
                  <Text style={{ fontSize: 22, fontWeight: 800, color: accent }}>{stat.value}</Text>
                  <Box mt={0.5}>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                      {stat.label}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* Features - Vintage Cards */}
      <Box p={6} style={{ background: 'var(--brand-background)' }}>
        <Text.Title size="large" className="web-sectionTitle" style={{ textAlign: 'center', fontSize: 24, textTransform: 'uppercase', fontWeight: 900, letterSpacing: -1 }}>
          DI SẢN REETRO
        </Text.Title>
        <Box mt={6}>
          <Grid columnCount={2} columnSpace="16px" rowSpace="16px">
            {[
              {
                icon: 'zi-calendar',
                title: 'ĐẶT LỊCH',
                desc: 'CHỈ 30 GIÂY THAO TÁC',
              },
              {
                icon: 'zi-clock-1',
                title: 'ĐÚNG GIỜ',
                desc: 'KHÔNG PHẢI CHỜ ĐỢI',
              },
              { icon: 'zi-user', title: 'STYLIST', desc: 'TAY NGHỀ ĐIÊU LUYỆN' },
              {
                icon: 'zi-shield-check',
                title: 'CAM KẾT',
                desc: 'HÀI LÒNG 100%',
              },
            ].map(item => (
              <Box key={item.title} className="web-card" p={4} style={{ borderRadius: 32, background: 'var(--brand-muted)', border: 'none', textAlign: 'center' }}>
                <Box className="web-softIcon" style={{ background: 'var(--brand-background)', width: 56, height: 56, borderRadius: 20, margin: '0 auto 12px' }}>
                  <Icon icon={item.icon as any} style={{ color: 'var(--brand-primary)', fontSize: 24 }} />
                </Box>
                <Text bold style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {item.title}
                </Text>
                <Box mt={1}>
                  <Text style={{ fontSize: 9, opacity: 0.5, fontWeight: 700, fontStyle: 'italic' }}>
                    {item.desc}
                  </Text>
                </Box>
              </Box>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Services Section */}
      <Box p={6}>
        <Box flex alignItems="flex-end" justifyContent="space-between" style={{ gap: 12, marginBottom: 24 }}>
          <Box>
             <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>DỊCH VỤ CỦA CHÚNG TÔI</Text>
            <Text.Title size="large" className="web-sectionTitle" style={{ fontSize: 28, textTransform: 'uppercase', fontWeight: 900 }}>
              THỰC ĐƠN STYLING
            </Text.Title>
          </Box>
          <Text style={{ color: 'var(--brand-primary)', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }} onClick={() => navigate('/salons')}>
            Tất cả →
          </Text>
        </Box>

        <Box>
          <Grid columnCount={1} rowSpace="16px">
            {Object.values(SERVICE_CATEGORIES)
              .slice(0, 3)
              .map(cat => (
                <Box key={cat.label} className="web-card" p={5} style={{ borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--brand-background)' }}>
                  <Box flex alignItems="center" style={{ gap: 16 }}>
                    <Box className="web-softIcon" style={{ background: 'var(--brand-muted)', width: 56, height: 56, borderRadius: 20 }}>
                      <Icon icon={cat.icon as any} style={{ color: 'var(--brand-primary)', fontSize: 24 }} />
                    </Box>
                    <Box>
                       <Text bold style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: -0.5 }}>
                        {cat.label}
                      </Text>
                      <Text style={{ fontSize: 10, opacity: 0.5, fontWeight: 700, fontStyle: 'italic' }}>TRẢI NGHIỆM ĐỈNH CAO</Text>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    style={{ borderRadius: 20, background: 'var(--brand-secondary)', color: 'var(--brand-primary)', fontWeight: 800, padding: '0 20px', fontSize: 11 }}
                    onClick={() => navigate('/salons')}
                  >
                    ĐẶT LỊCH
                  </Button>
                </Box>
              ))}
          </Grid>
        </Box>
      </Box>

      {/* Salons teaser */}
      <Box p={6} style={{ background: 'var(--brand-background)' }}>
        <Box flex alignItems="flex-end" justifyContent="space-between" style={{ gap: 12, marginBottom: 24 }}>
          <Box>
            <Text style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>KHÁM PHÁ KHÔNG GIAN</Text>
            <Text.Title size="large" className="web-sectionTitle" style={{ fontSize: 24, textTransform: 'uppercase', fontWeight: 900 }}>
              HỆ THỐNG SALON
            </Text.Title>
          </Box>
          <Text style={{ color: 'var(--brand-primary)', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }} onClick={() => navigate('/salons')}>
            Bản đồ →
          </Text>
        </Box>

        <Box 
          p={6} 
          className="web-card"
          style={{ 
            background: 'var(--brand-background)', 
            borderRadius: 32, 
            border: '1px solid var(--brand-border)',
            boxShadow: '0 16px 32px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}
        >
          <Box 
            flex 
            alignItems="center" 
            justifyContent="center"
            style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 24, 
              background: 'var(--brand-muted)', 
              margin: '0 auto 20px',
              border: '1px solid var(--brand-border)'
            }}
          >
            <Icon icon="zi-location" style={{ color: 'var(--brand-primary)', fontSize: 32 }} />
          </Box>
          <Text style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase' }}>CHỌN SALON GẦN BẠN</Text>
          <Box mt={2}>
            <Text style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
              Xem danh sách salon và đặt lịch trống ngay lập tức
            </Text>
          </Box>
          <Box mt={6}>
            <Button 
                fullWidth 
                onClick={() => navigate('/salons')}
                style={{ height: 56, borderRadius: 28, background: 'var(--brand-secondary)', color: 'var(--brand-background)', fontWeight: 800, letterSpacing: 1 }}
            >
              TÌM KIẾM NGAY
            </Button>
          </Box>
        </Box>
      </Box>

      {/* CTA */}
      <Box
        p={8}
        style={{
          background: 'var(--brand-secondary)',
          color: 'var(--brand-background)',
          textAlign: 'center'
        }}
      >
        <Box style={{ maxWidth: 520, margin: '0 auto' }}>
          <Text style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1 }}>
            SẴN SÀNG <span style={{ color: 'var(--brand-primary)' }}>ĐỔI MỚI</span> PHONG CÁCH?
          </Text>
          <Box mt={3}>
            <Text style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1.5, lineHeight: 1.6 }}>
              Đặt lịch ngay hôm nay và trải nghiệm dịch vụ đẳng cấp từ các Stylist hàng đầu.
            </Text>
          </Box>
          <Box mt={8}>
            <Button 
                fullWidth 
                onClick={() => navigate('/salons')}
                style={{ 
                    height: 64, 
                    borderRadius: 32, 
                    background: 'var(--brand-primary)', 
                    color: 'var(--brand-background)', 
                    fontWeight: 900, 
                    fontSize: 15,
                    letterSpacing: 2,
                    border: 'none',
                    boxShadow: '0 16px 32px rgba(0,0,0,0.3)'
                }}
            >
              ĐẶT LỊCH NGAY
            </Button>
          </Box>
          <Box mt={6}>
             <Text style={{ fontSize: 9, fontWeight: 800, opacity: 0.3, letterSpacing: 2 }}>
                REETRO BARBER SHOP · SINCE 2024
             </Text>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default HomePage;
