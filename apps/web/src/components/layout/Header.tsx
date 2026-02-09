'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Menu, Button, Drawer, Space, Badge, Avatar, Dropdown } from 'antd';
import {
  MenuOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CalendarOutlined,
  HomeOutlined,
  ScissorOutlined,
  ShopOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: <Link href="/">Trang chủ</Link>,
  },
  {
    key: '/services',
    icon: <ScissorOutlined />,
    label: <Link href="/services">Dịch vụ</Link>,
  },
  {
    key: '/salons',
    icon: <ShopOutlined />,
    label: <Link href="/salons">Hệ thống Salon</Link>,
  },
  {
    key: '/about',
    icon: <InfoCircleOutlined />,
    label: <Link href="/about">Giới thiệu</Link>,
  },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'bookings',
      icon: <CalendarOutlined />,
      label: <Link href="/my-bookings">Lịch hẹn của tôi</Link>,
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">Tài khoản</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  return (
    <>
      <AntHeader
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 'auto',
          padding: 0,
          background: scrolled ? '#fff' : 'transparent',
          boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            background: '#1a3c6e',
            padding: '8px 0',
            display: scrolled ? 'none' : 'block',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '0 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Space size="large">
              <Space>
                <PhoneOutlined style={{ color: '#f5a623' }} />
                <span style={{ color: '#fff', fontSize: 13 }}>Hotline: 1900 xxxx</span>
              </Space>
              <Space>
                <EnvironmentOutlined style={{ color: '#f5a623' }} />
                <span style={{ color: '#fff', fontSize: 13 }}>100+ chi nhánh toàn quốc</span>
              </Space>
            </Space>
            <Space>
              <Link href="/login" style={{ color: '#fff', fontSize: 13 }}>
                Đăng nhập
              </Link>
              <span style={{ color: '#fff' }}>|</span>
              <Link href="/register" style={{ color: '#fff', fontSize: 13 }}>
                Đăng ký
              </Link>
            </Space>
          </div>
        </div>

        {/* Main header */}
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '12px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #1a3c6e 0%, #2a5090 100%)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScissorOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a3c6e', lineHeight: 1.2 }}>
                  REETRO
                </div>
                <div style={{ fontSize: 11, color: '#666', letterSpacing: 2 }}>BARBERSHOP</div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <Menu
              mode="horizontal"
              selectedKeys={[pathname]}
              items={menuItems}
              style={{
                border: 'none',
                background: 'transparent',
                flex: 1,
                justifyContent: 'center',
                display: 'none',
              }}
              className="desktop-menu"
            />

            {/* Actions */}
            <Space size="middle">
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                href="/booking"
                style={{
                  background: '#f5a623',
                  borderColor: '#f5a623',
                  fontWeight: 600,
                  borderRadius: 8,
                  height: 44,
                  paddingInline: 24,
                }}
              >
                ĐẶT LỊCH NGAY
              </Button>

              {/* Mobile menu button */}
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 20 }} />}
                onClick={() => setMobileMenuOpen(true)}
                className="mobile-menu-btn"
                style={{ display: 'none' }}
              />
            </Space>
          </div>
        </div>
      </AntHeader>

      {/* Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
      >
        <Menu
          mode="vertical"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ border: 'none' }}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block size="large" href="/booking">
              ĐẶT LỊCH NGAY
            </Button>
            <Button block size="large" href="/login">
              Đăng nhập
            </Button>
          </Space>
        </div>
      </Drawer>

      {/* Spacer for fixed header */}
      <div style={{ height: scrolled ? 68 : 108 }} />

      <style jsx global>{`
        @media (min-width: 768px) {
          .desktop-menu {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
