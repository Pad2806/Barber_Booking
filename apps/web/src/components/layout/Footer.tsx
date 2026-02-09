'use client';

import React from 'react';
import Link from 'next/link';
import { Layout, Row, Col, Space, Typography, Divider } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  YoutubeOutlined,
  InstagramOutlined,
  ScissorOutlined,
} from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Title, Text, Paragraph } = Typography;

export function Footer() {
  return (
    <AntFooter style={{ background: '#1a3c6e', padding: 0 }}>
      {/* Main Footer */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <Row gutter={[48, 32]}>
          {/* Company Info */}
          <Col xs={24} sm={12} lg={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: '#f5a623',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScissorOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>REETRO</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 2 }}>
                  BARBERSHOP
                </div>
              </div>
            </div>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>
              Hệ thống salon tóc nam chuyên nghiệp hàng đầu Việt Nam. Phong cách - Đẳng cấp - Chất
              lượng.
            </Paragraph>
            <Space size="middle">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FacebookOutlined style={{ fontSize: 20, color: '#fff' }} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <YoutubeOutlined style={{ fontSize: 20, color: '#fff' }} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <InstagramOutlined style={{ fontSize: 20, color: '#fff' }} />
              </a>
            </Space>
          </Col>

          {/* Services */}
          <Col xs={24} sm={12} lg={6}>
            <Title level={5} style={{ color: '#f5a623', marginBottom: 20 }}>
              Dịch vụ
            </Title>
            <Space direction="vertical" size="small">
              {['Cắt tóc nam', 'Uốn tóc Hàn Quốc', 'Nhuộm tóc', 'Gội massage', 'Combo VIP'].map(
                item => (
                  <Link
                    key={item}
                    href="/services"
                    style={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}
                  >
                    {item}
                  </Link>
                )
              )}
            </Space>
          </Col>

          {/* Quick Links */}
          <Col xs={24} sm={12} lg={6}>
            <Title level={5} style={{ color: '#f5a623', marginBottom: 20 }}>
              Liên kết nhanh
            </Title>
            <Space direction="vertical" size="small">
              <Link href="/salons" style={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
                Hệ thống Salon
              </Link>
              <Link href="/booking" style={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
                Đặt lịch ngay
              </Link>
              <Link href="/about" style={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
                Về chúng tôi
              </Link>
              <Link href="/careers" style={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
                Tuyển dụng
              </Link>
              <Link href="/franchise" style={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
                Nhượng quyền
              </Link>
            </Space>
          </Col>

          {/* Contact */}
          <Col xs={24} sm={12} lg={6}>
            <Title level={5} style={{ color: '#f5a623', marginBottom: 20 }}>
              Liên hệ
            </Title>
            <Space direction="vertical" size="middle">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <PhoneOutlined style={{ color: '#f5a623', fontSize: 18, marginTop: 2 }} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>Hotline</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)' }}>1900 xxxx xx</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <MailOutlined style={{ color: '#f5a623', fontSize: 18, marginTop: 2 }} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>Email</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)' }}>contact@reetro.vn</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <EnvironmentOutlined style={{ color: '#f5a623', fontSize: 18, marginTop: 2 }} />
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>Trụ sở</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)' }}>123 Nguyễn Huệ, Q.1, TP.HCM</div>
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '20px 24px',
          textAlign: 'center',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
          © 2024 ReetroBarberShop. All rights reserved.
        </Text>
      </div>
    </AntFooter>
  );
}
