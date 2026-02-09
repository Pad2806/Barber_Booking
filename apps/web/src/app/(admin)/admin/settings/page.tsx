'use client';

import { useState } from 'react';
import { Save, Building, CreditCard, Bell, Shield, Globe, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'payment' | 'notifications' | 'security' | 'branding';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);

  const TABS = [
    { id: 'general', label: 'Thông tin chung', icon: Building },
    { id: 'payment', label: 'Thanh toán', icon: CreditCard },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'security', label: 'Bảo mật', icon: Shield },
    { id: 'branding', label: 'Thương hiệu', icon: Palette },
  ];

  const handleSave = async () => {
    setSaving(true);
    // Mock save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-800">Cài đặt</h1>
          <p className="text-gray-500">Quản lý cấu hình hệ thống</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors',
            saving
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-accent text-white hover:bg-accent/90'
          )}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Lưu thay đổi
            </>
          )}
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl p-4 shadow-sm h-fit">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left',
                  activeTab === tab.id ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-white rounded-xl p-6 shadow-sm">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Thông tin chung</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên doanh nghiệp
                  </label>
                  <input
                    type="text"
                    defaultValue="ReetroBarberShop"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email liên hệ
                  </label>
                  <input
                    type="email"
                    defaultValue="contact@reetro.vn"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    defaultValue="1900 1234"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    defaultValue="https://reetro.vn"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <textarea
                  rows={3}
                  defaultValue="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Cấu hình thanh toán</h2>

              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-medium text-blue-800 mb-2">VietQR + Sepay</h3>
                <p className="text-sm text-blue-600">
                  Thanh toán qua QR ngân hàng với xác nhận tự động
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
                  <select className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="VCB">Vietcombank</option>
                    <option value="TCB">Techcombank</option>
                    <option value="MB">MB Bank</option>
                    <option value="ACB">ACB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    placeholder="1234567890"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chủ tài khoản
                  </label>
                  <input
                    type="text"
                    placeholder="CONG TY TNHH REETRO"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sepay API Key
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Cài đặt thông báo</h2>

              <div className="space-y-4">
                {[
                  { id: 'booking_new', label: 'Có đặt lịch mới', enabled: true },
                  { id: 'booking_cancel', label: 'Khách hủy lịch', enabled: true },
                  { id: 'payment_received', label: 'Nhận thanh toán', enabled: true },
                  { id: 'review_new', label: 'Có đánh giá mới', enabled: false },
                  { id: 'daily_report', label: 'Báo cáo hàng ngày', enabled: false },
                ].map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <span className="font-medium">{item.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={item.enabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Kênh thông báo</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-accent rounded"
                      />
                      <span>Email</span>
                    </label>
                  </div>
                  <div className="p-4 border rounded-xl">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-accent rounded"
                      />
                      <span>Zalo OA</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Bảo mật</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Xác thực 2 yếu tố</h3>
                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-medium">Bảo mật 2 lớp</p>
                    <p className="text-sm text-gray-500">Sử dụng ứng dụng xác thực để đăng nhập</p>
                  </div>
                  <button className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90">
                    Kích hoạt
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Thương hiệu</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div className="border-2 border-dashed rounded-xl p-8 text-center">
                    <Palette className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Kéo thả hoặc click để upload</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                  <div className="border-2 border-dashed rounded-xl p-8 text-center">
                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Kéo thả hoặc click để upload</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Màu chủ đạo</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    defaultValue="#D4A574"
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    defaultValue="#D4A574"
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
