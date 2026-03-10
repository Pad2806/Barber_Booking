'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, LogOut, Loader2, Save, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/ImageUpload';
import Header from '@/components/header';
import Footer from '@/components/footer';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
}

export default function ProfilePage(): React.ReactNode {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile');
      return;
    }
    if (status === 'authenticated' && session) {
      const hasToken = (session as any)?.accessToken;
      if (hasToken) {
        fetchProfile();
      } else {
        console.error('Session loaded but no accessToken found');
        toast.error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        router.push('/login?callbackUrl=/profile');
      }
    }
  }, [status, router, session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/me');
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        avatar: response.data.avatar || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Không thể tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await apiClient.patch('/users/me', {
        name: formData.name,
        phone: formData.phone || null,
        avatar: formData.avatar || null,
      });
      toast.success('Cập nhật thành công!');
      fetchProfile();
      await update({ name: formData.name });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Cập nhật thất bại';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setSaving(true);

    try {
      await apiClient.post('/users/me/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#2C1E12]">Hồ sơ cá nhân</h1>
            <p className="text-sm text-[#8B7355]">Quản lý thông tin và bảo mật tài khoản</p>
          </div>

          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D4] p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="shrink-0 relative group">
              <ImageUpload
                value={formData.avatar || profile?.avatar || ''}
                onChange={url => setFormData({ ...formData, avatar: url })}
                folder="avatars"
                variant="avatar"
              />
            </div>
            <div className="text-center md:text-left pt-2 flex-1">
              <h2 className="text-2xl font-bold text-[#2C1E12] mb-1">{profile?.name}</h2>
              <p className="text-sm font-medium text-[#8B7355] mb-4">{profile?.email}</p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0EBE3] rounded-full">
                <Calendar className="w-4 h-4 text-[#C8A97E]" />
                <span className="text-xs font-bold text-[#5C4A32]">
                  THÀNH VIÊN TỪ {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-auto hidden md:flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors px-4 py-2 rounded-xl hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>

          {/* Settings Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D4] overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-[#E8E0D4] bg-[#F0EBE3] p-1 gap-1">
              <button
                onClick={() => setActiveTab('info')}
                className={cn(
                  'flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300',
                  activeTab === 'info'
                    ? 'bg-white text-[#2C1E12] shadow-sm'
                    : 'text-[#8B7355] hover:text-[#5C4A32]'
                )}
              >
                Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={cn(
                  'flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300',
                  activeTab === 'password'
                    ? 'bg-white text-[#2C1E12] shadow-sm'
                    : 'text-[#8B7355] hover:text-[#5C4A32]'
                )}
              >
                Đổi mật khẩu
              </button>
            </div>

            {/* Content */}
            <div className="p-8 md:p-10">
              {activeTab === 'info' ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block">HỌ VÀ TÊN</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C8A97E]" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-4 focus:ring-[#C8A97E]/10 transition-all font-medium text-[#2C1E12]"
                        required
                        placeholder="Nhập họ và tên..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2 opacity-70">
                    <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block">ĐỊA CHỈ EMAIL</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355]" />
                      <input
                        type="email"
                        value={profile?.email || ''}
                        className="w-full pl-12 pr-4 py-3.5 bg-[#F0EBE3] border border-transparent rounded-xl text-[#5C4A32] font-medium cursor-not-allowed"
                        disabled
                      />
                    </div>
                    <p className="text-[11px] text-[#8B7355] mt-1 ml-1">Vui lòng liên hệ hỗ trợ nếu bạn cần thay đổi email.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block">SỐ ĐIỆN THOẠI</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C8A97E]" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Ví dụ: 0912345678"
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-4 focus:ring-[#C8A97E]/10 transition-all font-medium text-[#2C1E12]"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto px-8 py-3.5 bg-[#C8A97E] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#B8975E] active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Cập nhật thông tin
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block">MẬT KHẨU HIỆN TẠI</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C8A97E]" />
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={e =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-4 focus:ring-[#C8A97E]/10 transition-all text-[#2C1E12]"
                        required
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block">MẬT KHẨU MỚI</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C8A97E]" />
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={e =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-4 focus:ring-[#C8A97E]/10 transition-all text-[#2C1E12]"
                        required
                        minLength={6}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block">XÁC NHẬN MẬT KHẨU MỚI</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C8A97E]" />
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={e =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-4 focus:ring-[#C8A97E]/10 transition-all text-[#2C1E12]"
                        required
                        minLength={6}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto px-8 py-3.5 bg-[#C8A97E] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#B8975E] active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                      Đổi mật khẩu
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Mobile Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full md:hidden py-4 text-red-500 font-bold flex items-center justify-center gap-2 bg-red-50 rounded-2xl border border-red-100"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất khỏi tài khoản
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
