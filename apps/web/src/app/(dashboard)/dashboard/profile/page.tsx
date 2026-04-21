'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Loader2, Save, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/ImageUpload';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
}

export default function AdminProfilePage() {
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
      router.push('/login?callbackUrl=/admin/profile');
      return;
    }
    if (status === 'authenticated' && session) {
      const hasToken = (session as any)?.accessToken;
      if (hasToken) {
        fetchProfile();
      } else {
        router.push('/login?callbackUrl=/admin/profile');
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
      await update({ 
        name: formData.name,
        image: formData.avatar 
      });
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="text-slate-500">Quản lý thông tin và bảo mật tài khoản admin</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="shrink-0 relative group">
          <ImageUpload
            value={formData.avatar || profile?.avatar || ''}
            onChange={url => setFormData({ ...formData, avatar: url })}
            folder="avatars"
            variant="avatar"
          />
        </div>
        <div className="text-center md:text-left pt-2 flex-1">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{profile?.name}</h2>
          <p className="text-sm font-medium text-slate-500 mb-4">{profile?.email}</p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-bold">
              THÀNH VIÊN TỪ {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'flex-1 py-4 text-sm font-bold transition-all duration-300 border-b-2',
              activeTab === 'info'
                ? 'bg-white text-blue-600 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 border-transparent hover:bg-slate-100'
            )}
          >
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={cn(
              'flex-1 py-4 text-sm font-bold transition-all duration-300 border-b-2',
              activeTab === 'password'
                ? 'bg-white text-blue-600 border-blue-600'
                : 'text-slate-500 hover:text-slate-700 border-transparent hover:bg-slate-100'
            )}
          >
            Đổi mật khẩu
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === 'info' ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
               <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700 block">Họ và tên</label>
                 <div className="relative">
                   <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input
                     type="text"
                     value={formData.name}
                     onChange={e => setFormData({ ...formData, name: e.target.value })}
                     className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-900"
                     required
                   />
                 </div>
               </div>

               <div className="space-y-2 opacity-70">
                 <label className="text-sm font-semibold text-slate-700 block">Địa chỉ email</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input
                     type="email"
                     value={profile?.email || ''}
                     className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-medium cursor-not-allowed"
                     disabled
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700 block">Số điện thoại</label>
                 <div className="relative">
                   <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input
                     type="tel"
                     value={formData.phone}
                     onChange={e => setFormData({ ...formData, phone: e.target.value })}
                     className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-900"
                   />
                 </div>
               </div>

               <div className="pt-4">
                 <button
                   type="submit"
                   disabled={saving}
                   className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-70"
                 >
                   {saving ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                     <Save className="w-5 h-5" />
                   )}
                   Cập nhật
                 </button>
               </div>
            </form>
          ) : (
             <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
               <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700 block">Mật khẩu hiện tại</label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input
                     type="password"
                     value={passwordData.currentPassword}
                     onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                     className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900"
                     required
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700 block">Mật khẩu mới</label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input
                     type="password"
                     value={passwordData.newPassword}
                     onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                     className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900"
                     required
                     minLength={6}
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700 block">Xác nhận mật khẩu mới</label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input
                     type="password"
                     value={passwordData.confirmPassword}
                     onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                     className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-900"
                     required
                     minLength={6}
                   />
                 </div>
               </div>

               <div className="pt-4">
                 <button
                   type="submit"
                   disabled={saving}
                   className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-70"
                 >
                   {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                   Đổi mật khẩu
                 </button>
               </div>
             </form>
          )}
        </div>
      </div>
    </div>
  );
}
