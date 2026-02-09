import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Box, Text, Button, Icon, Grid } from 'zmp-ui';
import { BRAND_CONFIG, SERVICE_CATEGORIES } from '../../config';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const accent = BRAND_CONFIG.colors.accent;

  return (
    <Page className="animate-fade-in">
      {/* Hero (clone web - mobile) */}
      <Box className="web-hero safe-area-top" style={{ padding: 16, paddingBottom: 24 }}>
        <Box style={{ maxWidth: 520, margin: '0 auto' }}>
          <Text
            style={{
              fontSize: 34,
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: -0.02,
            }}
          >
            Phong cách của bạn,
          </Text>
          <Text
            style={{
              fontSize: 34,
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: -0.02,
            }}
          >
            <span style={{ color: accent }}>Đẳng cấp</span> của chúng tôi
          </Text>

          <Box mt={3}>
            <Text className="web-hero-subtitle" style={{ fontSize: 15, lineHeight: 1.55 }}>
              Hệ thống salon tóc nam chuyên nghiệp. Đặt lịch dễ dàng, phục vụ tận tâm.
            </Text>
          </Box>

          <Box mt={4} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button fullWidth onClick={() => navigate('/salons')}>
              Đặt lịch ngay
            </Button>
            <button
              type="button"
              className="web-hero-secondaryBtn"
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 15,
              }}
              onClick={() => navigate('/salons')}
            >
              Tìm salon
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

      {/* Features */}
      <Box p={4} style={{ background: 'var(--brand-background, #fff)' }}>
        <Text.Title size="large" className="web-sectionTitle" style={{ textAlign: 'center' }}>
          Tại sao chọn chúng tôi?
        </Text.Title>
        <Box mt={4}>
          <Grid columnCount={2} columnSpace="12px" rowSpace="12px">
            {[
              {
                icon: 'zi-calendar',
                title: 'Đặt lịch nhanh chóng',
                desc: 'Chỉ vài bước để hoàn tất',
              },
              {
                icon: 'zi-clock-1',
                title: 'Không chờ đợi',
                desc: 'Đến đúng giờ hẹn, phục vụ ngay',
              },
              { icon: 'zi-user', title: 'Stylist chuyên nghiệp', desc: 'Đội ngũ tay nghề cao' },
              {
                icon: 'zi-shield-check',
                title: 'Cam kết chất lượng',
                desc: 'Quy trình rõ ràng, minh bạch',
              },
            ].map(item => (
              <Box key={item.title} className="web-card" p={4}>
                <Box className="web-softIcon">
                  <Icon icon={item.icon as any} style={{ color: accent }} />
                </Box>
                <Box mt={2}>
                  <Text bold style={{ lineHeight: 1.25 }}>
                    {item.title}
                  </Text>
                  <Box mt={1}>
                    <Text size="xxSmall" style={{ opacity: 0.75, lineHeight: 1.45 }}>
                      {item.desc}
                    </Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Services */}
      <Box p={4}>
        <Box flex alignItems="flex-end" justifyContent="space-between" style={{ gap: 12 }}>
          <Box>
            <Text.Title size="large" className="web-sectionTitle">
              Dịch vụ của chúng tôi
            </Text.Title>
            <Text size="xxSmall" style={{ opacity: 0.7 }}>
              Trải nghiệm dịch vụ chất lượng cao
            </Text>
          </Box>
          <Text style={{ color: accent, fontWeight: 600 }} onClick={() => navigate('/salons')}>
            Xem tất cả
          </Text>
        </Box>

        <Box mt={3}>
          <Grid columnCount={2} columnSpace="12px" rowSpace="12px">
            {Object.values(SERVICE_CATEGORIES)
              .slice(0, 6)
              .map(cat => (
                <Box key={cat.label} className="web-card" p={4}>
                  <Box flex alignItems="center" style={{ gap: 10 }}>
                    <Box className="web-softIcon">
                      <Icon icon={cat.icon as any} style={{ color: accent }} />
                    </Box>
                    <Text bold style={{ lineHeight: 1.2 }}>
                      {cat.label}
                    </Text>
                  </Box>
                  <Box mt={3}>
                    <Button
                      variant="secondary"
                      type="neutral"
                      fullWidth
                      onClick={() => navigate('/salons')}
                    >
                      Đặt lịch
                    </Button>
                  </Box>
                </Box>
              ))}
          </Grid>
        </Box>
      </Box>

      {/* Salons teaser */}
      <Box p={4} style={{ background: 'var(--brand-background, #fff)' }}>
        <Box flex alignItems="flex-end" justifyContent="space-between" style={{ gap: 12 }}>
          <Box>
            <Text.Title size="large" className="web-sectionTitle">
              Hệ thống salon
            </Text.Title>
            <Text size="xxSmall" style={{ opacity: 0.7 }}>
              Tìm salon gần bạn nhất
            </Text>
          </Box>
          <Text style={{ color: accent, fontWeight: 600 }} onClick={() => navigate('/salons')}>
            Xem tất cả
          </Text>
        </Box>

        <Box mt={3} className="web-card" p={4}>
          <Box flex alignItems="center" style={{ gap: 10 }}>
            <Box className="web-softIcon">
              <Icon icon={'zi-location' as any} style={{ color: accent }} />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text bold>Tìm salon phù hợp</Text>
              <Box mt={1}>
                <Text size="xxSmall" style={{ opacity: 0.75 }}>
                  Xem danh sách salon và chọn lịch trống
                </Text>
              </Box>
            </Box>
          </Box>
          <Box mt={3}>
            <Button fullWidth onClick={() => navigate('/salons')}>
              Tìm salon
            </Button>
          </Box>
        </Box>
      </Box>

      {/* CTA */}
      <Box
        p={4}
        style={{
          background:
            'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
          color: '#fff',
        }}
      >
        <Box style={{ maxWidth: 520, margin: '0 auto' }}>
          <Text.Title size="large" style={{ color: '#fff' }}>
            Sẵn sàng đổi mới phong cách?
          </Text.Title>
          <Box mt={2}>
            <Text className="web-hero-subtitle" style={{ fontSize: 15, lineHeight: 1.55 }}>
              Đặt lịch ngay hôm nay và trải nghiệm dịch vụ chất lượng.
            </Text>
          </Box>
          <Box mt={4}>
            <Button fullWidth onClick={() => navigate('/salons')}>
              Đặt lịch ngay
            </Button>
          </Box>
        </Box>
      </Box>
    </Page>
  );
};

export default HomePage;
