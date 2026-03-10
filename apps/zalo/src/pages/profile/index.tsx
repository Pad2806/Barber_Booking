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
      <Page style={{ background: 'var(--brand-background)' }}>
        <Header title="TÀI KHOẢN" showBackIcon={false} />
        <Box style={{ height: 44 }} />
        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={8}
          style={{ minHeight: '70vh', textAlign: 'center' }}
        >
          <Box
            flex
            alignItems="center"
            justifyContent="center"
            style={{
              width: 120,
              height: 120,
              borderRadius: 32,
              background: 'var(--brand-background)',
              border: '1px solid var(--brand-border)',
              marginBottom: 32,
              boxShadow: '0 24px 48px -12px rgba(0,0,0,0.1)'
            }}
          >
            <Icon icon="zi-user" style={{ fontSize: 48, color: 'var(--brand-primary)' }} />
          </Box>
          <Text style={{ fontSize: 28, fontWeight: 900, color: 'var(--brand-secondary)', textTransform: 'uppercase', letterSpacing: -1 }}>
            CHÀO MỪNG QUÝ KHÁCH
          </Text>
          <Box mt={2}>
            <Text style={{ fontSize: 13, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
              Đăng nhập để đặt lịch & nhận ưu đãi VIP
            </Text>
          </Box>
          <Box mt={10} style={{ width: '100%', maxWidth: 300 }}>
            <Button
              fullWidth
              onClick={handleLogin}
              style={{
                height: 64,
                borderRadius: 32,
                background: 'var(--brand-secondary)',
                color: 'var(--brand-background)',
                fontWeight: 900,
                letterSpacing: 2,
                fontSize: 14,
                border: 'none',
                boxShadow: '0 16px 32px rgba(0,0,0,0.2)'
              }}
            >
              ĐĂNG NHẬP VỚI ZALO
            </Button>
          </Box>
        </Box>
      </Page>
    );
  }

  return (
    <Page style={{ background: 'var(--brand-background)' }}>
      <Header title="TÀI KHOẢN" showBackIcon={false} />
      <Box style={{ height: 44 }} />
      {/* Profile Header - Deep Mahogany */}
      <Box
        p={8}
        style={{
          paddingBottom: 48,
          background: 'var(--brand-secondary)',
          borderBottom: '1px solid rgba(165, 124, 82, 0.2)'
        }}
      >
        <Box flex alignItems="center" style={{ gap: 20 }}>
          <Avatar 
            size={80} 
            src={user?.avatar || ''} 
            style={{ border: '3px solid var(--brand-primary)', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
          >
            {user?.name?.charAt(0) || '?'}
          </Avatar>
          <Box>
            <Text style={{ color: 'var(--brand-background)', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -0.5 }}>
              {user?.name || 'KHÁCH QUÝ'}
            </Text>
            <Text style={{ color: 'var(--brand-primary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic', opacity: 0.8 }}>
              {user?.phone || user?.email || 'MEMBER NO. #0000'}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Quick Stats - Premium Card */}
      <Box
        p={6}
        mx={4}
        style={{
          marginTop: -32,
          background: 'var(--brand-background)',
          borderRadius: 32,
          border: '1px solid var(--brand-border)',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 16px 32px -8px rgba(0,0,0,0.1)'
        }}
      >
        <Box flex justifyContent="space-between" style={{ textAlign: 'center' }}>
          <Box style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: 900, color: 'var(--brand-secondary)' }}>12</Text>
            <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
              LỊCH HẸN
            </Text>
          </Box>
          <Box style={{ flex: 1, borderLeft: '1px dashed var(--brand-border)', borderRight: '1px dashed var(--brand-border)' }}>
            <Text style={{ fontSize: 24, fontWeight: 900, color: 'var(--brand-secondary)' }}>5</Text>
            <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
              ĐÁNH GIÁ
            </Text>
          </Box>
          <Box style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 24, fontWeight: 900, color: 'var(--brand-primary)', fontStyle: 'italic' }}
            >
              VIP
            </Text>
            <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>
              HẠNG THẺ
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Menu Items */}
      <Box p={4} mt={4}>
        <Box
          p={2}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
          }}
        >
          <MenuItem 
            icon="zi-calendar" 
            title="LỊCH HẸN CỦA TÔI" 
            onClick={() => navigate('/my-bookings')} 
          />
          <MenuItem 
            icon="zi-heart" 
            title="SALON YÊU THÍCH" 
            onClick={() => navigate('/favorites')} 
          />
          <MenuItem 
            icon="zi-upload" 
            title="LỊCH SỬ THANH TOÁN" 
            onClick={() => navigate('/my-bookings')} 
          />
        </Box>

        <Box
          p={2}
          mt={4}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
          }}
        >
          <MenuItem 
            icon="zi-user" 
            title="THÔNG TIN CÁ NHÂN" 
            onClick={() => navigate('/profile/update')} 
          />
          <MenuItem 
            icon="zi-notif" 
            title="THÔNG BÁO" 
            onClick={() => navigate('/notifications')} 
          />
          <MenuItem 
            icon="zi-setting" 
            title="CÀI ĐẶT" 
            onClick={() => {}} 
          />
        </Box>

        <Box
          p={2}
          mt={4}
          style={{
            background: 'var(--brand-background)',
            borderRadius: 32,
            border: '1px solid var(--brand-border)',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
          }}
        >
          <MenuItem 
            icon="zi-warning" 
            title="TRUNG TÂM HỖ TRỢ" 
            onClick={() => navigate('/support')} 
          />
          <MenuItem 
            icon="zi-file" 
            title="VỀ CHÚNG TÔI" 
            onClick={() => navigate('/about')} 
          />
          <MenuItem 
            icon="zi-file" 
            title="ĐIỀU KHOẢN SỬ DỤNG" 
            onClick={() => navigate('/terms')} 
          />
        </Box>

        {/* Logout Button */}
        <Box mt={8}>
          <Button 
            fullWidth 
            onClick={handleLogout}
            style={{
              height: 60,
              borderRadius: 30,
              background: 'rgba(233, 69, 96, 0.05)',
              color: '#e94560',
              fontWeight: 900,
              letterSpacing: 2,
              border: '1px solid rgba(233, 69, 96, 0.2)',
              fontSize: 13
            }}
          >
            ĐĂNG XUẤT TÀI KHOẢN
          </Button>
        </Box>

        {/* App Version */}
        <Box mt={6} pb={8} style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.3, letterSpacing: 2 }}>
            BARBER SHOP v1.0.0 · EST. 2024
          </Text>
        </Box>
      </Box>
    </Page>
  );
};

// Helper Component for Vintage Menu Items
const MenuItem: React.FC<{ icon: string; title: string; onClick: () => void }> = ({ icon, title, onClick }) => (
  <Box 
    p={4} 
    flex 
    alignItems="center" 
    justifyContent="space-between"
    onClick={onClick}
    style={{ borderBottom: '1px dashed rgba(165, 124, 82, 0.1)' }}
  >
    <Box flex alignItems="center" style={{ gap: 16 }}>
      <Box 
        flex 
        alignItems="center" 
        justifyContent="center"
        style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 14, 
          background: 'rgba(165, 124, 82, 0.05)',
          border: '1px solid rgba(165, 124, 82, 0.1)'
        }}
      >
        <Icon icon={icon as any} style={{ color: 'var(--brand-primary)', fontSize: 18 }} />
      </Box>
      <Text style={{ fontSize: 13, fontWeight: 900, color: 'var(--brand-secondary)', letterSpacing: 0.5 }}>{title}</Text>
    </Box>
    <Icon icon="zi-arrow-right" style={{ color: 'var(--brand-primary)', fontSize: 16, opacity: 0.5 }} />
  </Box>
);

export default ProfilePage;
