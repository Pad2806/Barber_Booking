import React, { useState } from 'react';
import { Page, Box, Text, Header, List, Icon } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';

const TermsPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('terms');

    return (
        <Page style={{ background: '#e9ebed' }}>
            <Header title="Điều khoản & Bảo mật" showBackIcon onBackClick={() => navigate(-1)} />
            <Box style={{ height: 44 }} />
            
            <Box p={4} style={{ background: '#fff', margin: 16 }}>
                <Text.Title size="small">Chính sách bảo mật</Text.Title>
                <Text size="xSmall" style={{ marginTop: 8 }}>
                    Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Thông tin được thu thập chỉ sử dụng cho mục đích nâng cao trải nghiệm ứng dụng và liên lạc khi cần thiết.
                    Chúng tôi không chia sẻ dữ liệu với bên thứ ba trừ khi có sự đồng ý của bạn.
                </Text>

                <List style={{ marginTop: 16 }}>
                    <List.Item prefix={<Icon icon="zi-check-circle" />} title="Bảo mật dữ liệu cá nhân" />
                    <List.Item prefix={<Icon icon="zi-check-circle" />} title="Mã hóa giao dịch thanh toán" />
                    <List.Item prefix={<Icon icon="zi-check-circle" />} title="Quyền riêng tư tuyệt đối" />
                </List>
            </Box>

            <Box p={4} mt={3} style={{ background: '#fff', margin: 16 }}>
                <Text.Title size="small">Điều khoản sử dụng</Text.Title>
                <Text size="xSmall" style={{ marginTop: 8 }}>
                    Bằng việc sử dụng ứng dụng, bạn đồng ý tuân thủ các quy định sau:
                </Text>

                <List style={{ marginTop: 16 }}>
                    <List.Item prefix={<Icon icon="zi-warning-solid" />} title="Không sử dụng ứng dụng cho mục đích vi phạm pháp luật." />
                    <List.Item prefix={<Icon icon="zi-warning-solid" />} title="Tôn trọng quy định của Salon và Stylist." />
                    <List.Item prefix={<Icon icon="zi-warning-solid" />} title="Cung cấp thông tin chính xác khi đặt lịch." />
                </List>
            </Box>
        </Page>
    );
};

export default TermsPage;
