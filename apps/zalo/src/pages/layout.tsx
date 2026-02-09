import React from 'react';
import { Box, BottomNavigation, Icon } from 'zmp-ui';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current page should show bottom nav
  const showBottomNav = ['/', '/salons', '/my-bookings', '/profile'].includes(location.pathname);

  return (
    <Box flex flexDirection="column" style={{ minHeight: '100vh' }}>
      <Box style={{ flex: 1, overflow: 'auto', paddingBottom: 56 }}>{children}</Box>

      {showBottomNav && (
        <BottomNavigation
          fixed
          activeKey={location.pathname}
          onChange={key => navigate(key as string)}
        >
          <BottomNavigation.Item
            key="/"
            label="Trang chủ"
            icon={<Icon icon="zi-home" />}
            activeIcon={<Icon icon="zi-home" />}
          />
          <BottomNavigation.Item
            key="/salons"
            label="Salon"
            icon={<Icon icon="zi-location" />}
            activeIcon={<Icon icon="zi-location-solid" />}
          />
          <BottomNavigation.Item
            key="/my-bookings"
            label="Lịch hẹn"
            icon={<Icon icon="zi-calendar" />}
            activeIcon={<Icon icon="zi-calendar-solid" />}
          />
          <BottomNavigation.Item
            key="/profile"
            label="Tài khoản"
            icon={<Icon icon="zi-user" />}
            activeIcon={<Icon icon="zi-user-solid" />}
          />
        </BottomNavigation>
      )}
    </Box>
  );
};

export default Layout;
