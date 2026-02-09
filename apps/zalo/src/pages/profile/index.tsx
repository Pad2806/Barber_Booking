import React from 'react';
import { Page, Box, Text, Button, List, Avatar, Icon, Header } from 'zmp-ui';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { BRAND } from '../../config';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
        <Header title="Tài khoản" showBackIcon={false} />
        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={6}
          style={{ minHeight: '60vh', textAlign: 'center' }}
        >
          <Box
            flex
            alignItems="center"
            justifyContent="center"
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              background: 'var(--zaui-light-button-secondary-neutral-background, #e9ebed)',
              marginBottom: 16,
            }}
          >
            <Icon icon="zi-user" />
          </Box>
          <Text.Title size="large">Chào mừng đến {BRAND.name}</Text.Title>
          <Box mt={2}>
            <Text size="small" style={{ opacity: 0.75 }}>
              Đăng nhập để quản lý lịch hẹn và nhận ưu đãi
            </Text>
          </Box>
          <Box mt={4} style={{ width: '100%', maxWidth: 320 }}>
            <Button fullWidth onClick={handleLogin}>
              Đăng nhập với Zalo
            </Button>
          </Box>
        </Box>
      </Page>
    );
  }

  return (
    <Page style={{ background: 'var(--zaui-light-body-background-color, #e9ebed)' }}>
      <Header title="Tài khoản" showBackIcon={false} />
      {/* Profile Header */}
      <Box
        p={6}
        style={{
          paddingBottom: 28,
          background: `linear-gradient(135deg, var(--brand-secondary) 0%, var(--brand-primary) 100%)`,
        }}
      >
        <Box flex alignItems="center" style={{ gap: 12 }}>
          <Avatar size={64} src={user?.avatar || ''} online>
            {user?.name?.charAt(0) || '?'}
          </Avatar>
          <Box>
            <Text bold style={{ color: '#fff' }}>
              {user?.name || 'Khách'}
            </Text>
            <Text size="small" style={{ color: '#fff', opacity: 0.75 }}>
              {user?.phone || user?.email || 'Chưa cập nhật'}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box
        p={4}
        mx={4}
        style={{
          marginTop: -16,
          background: 'var(--zaui-light-header-background-color, #fff)',
          borderRadius: 16,
          border: '1px solid var(--zaui-light-header-divider, #e9ebed)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box flex justifyContent="space-between" style={{ textAlign: 'center' }}>
          <Box>
            <Text.Title size="large">12</Text.Title>
            <Text size="xxSmall" style={{ opacity: 0.7 }}>
              Lịch hẹn
            </Text>
          </Box>
          <Box>
            <Text.Title size="large">5</Text.Title>
            <Text size="xxSmall" style={{ opacity: 0.7 }}>
              Đánh giá
            </Text>
          </Box>
          <Box>
            <Text.Title
              size="large"
              style={{ color: 'var(--zaui-light-color-primary, var(--brand-accent))' }}
            >
              VIP
            </Text.Title>
            <Text size="xxSmall" style={{ opacity: 0.7 }}>
              Hạng thành viên
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Menu Items */}
      <Box p={4}>
        <Box
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <List>
            <List.Item
              title="Lịch hẹn của tôi"
              prefix={<Icon icon="zi-calendar" />}
              suffix={<Icon icon="zi-arrow-right" />}
              onClick={() => navigate('/my-bookings')}
            />
            <List.Item
              title="Salon yêu thích"
              prefix={<Icon icon="zi-heart" />}
              suffix={<Icon icon="zi-arrow-right" />}
              onClick={() => {}}
            />
            <List.Item
              title="Lịch sử thanh toán"
              prefix={<Icon icon="zi-upload" />}
              suffix={<Icon icon="zi-arrow-right" />}
              onClick={() => {}}
            />
          </List>
        </Box>

        <Box
          mt={3}
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <List>
            <List.Item
              title="Thông tin cá nhân"
              prefix={<Icon icon="zi-user" />}
              suffix={<Icon icon="zi-arrow-right" />}
              onClick={() => {}}
            />
            <List.Item
              title="Thông báo"
              prefix={<Icon icon="zi-notif" />}
              suffix={<Icon icon="zi-arrow-right" />}
              onClick={() => {}}
            />
            <List.Item
              title="Cài đặt"
              prefix={<Icon icon="zi-setting" />}
              suffix={<Icon icon="zi-arrow-right" />}
              onClick={() => {}}
            />
          </List>
        </Box>

        <Box
          mt={3}
          style={{
            background: 'var(--zaui-light-header-background-color, #fff)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <List>
            <List.Item
              title="Trung tâm hỗ trợ"
              prefix={<Icon icon="zi-warning" />}
              suffix={<Icon icon="zi-arrow-right" />}
              onClick={() => {}}
            />
            <List.Item
              title="Về chúng tôi"
              prefix={<Icon icon="zi-file" />}
              suffix={<Icon icon="zi-arrow-right" />}
              onClick={() => {}}
            />
            <List.Item
              title="Điều khoản sử dụng"
              prefix={<Icon icon="zi-file" />}
              suffix={<Icon icon="zi-arrow-right" />}
              onClick={() => {}}
            />
          </List>
        </Box>

        {/* Logout Button */}
        <Box mt={4}>
          <Button fullWidth type="danger" variant="secondary" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </Box>

        {/* App Version */}
        <Box mt={4} style={{ textAlign: 'center' }}>
          <Text size="xxSmall" style={{ opacity: 0.6 }}>
            {BRAND.name} v1.0.0
          </Text>
        </Box>
      </Box>
    </Page>
  );
};

export default ProfilePage;
