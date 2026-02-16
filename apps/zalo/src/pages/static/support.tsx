import React from 'react';
import { Page, Box, Text, Header, List, Icon, Button } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { openChat, openPhone } from 'zmp-sdk';
import { BRAND_CONFIG } from '../../config';

const SupportPage: React.FC = () => {
    const navigate = useNavigate();

    const openChatWithOA = async () => {
        try {
            await openChat({
                type: 'oa',
                id: BRAND_CONFIG.zaloOAId,
                message: 'Xin chào, tôi cần hỗ trợ!',
            });
        } catch (error) {
            console.error('Failed to open chat', error);
        }
    };

    const callHotline = async () => {
        try {
            await openPhone({
                phoneNumber: BRAND_CONFIG.phone,
            });
        } catch (error) {
            console.error('Failed to call hotline', error);
        }
    };

    return (
        <Page style={{ background: '#fff' }}>
            <Header title="Trung tâm hỗ trợ" showBackIcon onBackClick={() => navigate(-1)} />
            <Box style={{ height: 44 }} />
            
            <Box p={4} mt={3} flex flexDirection="column" alignItems="center">
                <Icon icon="zi-call-solid" size={64} style={{ color: 'var(--brand-primary)', marginBottom: 16 }} />
                <Text.Title>Cần hỗ trợ?</Text.Title>
                <Text size="xSmall" style={{ textAlign: 'center', marginTop: 8, opacity: 0.6 }}>
                    Đừng ngần ngại liên hệ với chúng tôi bất cứ khi nào bạn gặp vấn đề.
                </Text>

                <Box mt={6} style={{ width: '100%' }}>
                    <Button fullWidth onClick={() => openChatWithOA()}>Chat với nhân viên hỗ trợ</Button>
                </Box>

                <Box mt={3} style={{ width: '100%' }}>
                    <Button fullWidth variant="secondary" onClick={() => callHotline()}>Gọi hotline: {BRAND_CONFIG.phone}</Button>
                </Box>
            </Box>

            <Box p={4} mt={6}>
                <Text.Title size="small" style={{ marginBottom: 16 }}>Câu hỏi thường gặp</Text.Title>
                <List>
                    <List.Item title="Làm sao để đặt lịch?" suffix={<Icon icon="zi-chevron-right" />} onClick={() => {}} />
                    <List.Item title="Tôi có thể hủy lịch hẹn không?" suffix={<Icon icon="zi-chevron-right" />} onClick={() => {}} />
                    <List.Item title="Phí dịch vụ được tính như thế nào?" suffix={<Icon icon="zi-chevron-right" />} onClick={() => {}} />
                    <List.Item title="Cách thay đổi Stylist?" suffix={<Icon icon="zi-chevron-right" />} onClick={() => {}} />
                </List>
            </Box>
        </Page>
    );

    // Removed duplicates
};

export default SupportPage;
