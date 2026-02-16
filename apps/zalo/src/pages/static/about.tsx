import React from 'react';
import { Page, Box, Text, Header, Icon, List } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '../../config';

const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Page style={{ background: '#fff' }}>
            <Header title="Về chúng tôi" showBackIcon onBackClick={() => navigate(-1)} />
            <Box style={{ height: 44 }} />
            
            <Box p={6} flex flexDirection="column" alignItems="center" justifyContent="center">
                <Box
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 999,
                    background: 'var(--brand-primary)',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Icon icon="zi-user" size={48} style={{ color: '#fff' }} /> {/* Replace with actual logo */}
                </Box>
                <Text.Title size="large">{BRAND.name}</Text.Title>
                <Text size="xSmall" style={{ marginTop: 4, opacity: 0.6 }}>Phiên bản 1.0.0</Text>
            </Box>

            <Box p={4} mt={4} style={{ background: '#f5f5f5', borderRadius: 12, margin: '0 16px' }}>
                <Text size="normal" style={{ lineHeight: 1.6 }}>
                    {BRAND.name} là ứng dụng đặt lịch cắt tóc hàng đầu, mang đến trải nghiệm tiện lợi và nhanh chóng cho khách hàng.
                    Chúng tôi kết nối bạn với những salon uy tín nhất, giúp bạn dễ dàng chọn dịch vụ, stylist và thời gian phù hợp.
                </Text>
            </Box>

            <Box mt={6} px={4}>
                <Text.Title size="small" style={{ marginBottom: 16 }}>Liên hệ với chúng tôi</Text.Title>
                <List>
                    <List.Item title="Email" subTitle="support@bookingbarber.vn" prefix={<Icon icon="zi-inbox" />} />
                    <List.Item title="Hotline" subTitle="1900 1234" prefix={<Icon icon="zi-call" />} />
                    <List.Item title="Website" subTitle="bookingbarber.vn" prefix={<Icon icon="zi-more-horiz" />} />
                </List>
            </Box>
            
            <Box p={4} mt={8} style={{ textAlign: 'center' }}>
                <Text size="xxSmall" style={{ opacity: 0.5 }}>
                    © 2024 {BRAND.name}. All rights reserved.
                </Text>
            </Box>
        </Page>
    );
};

export default AboutPage;
