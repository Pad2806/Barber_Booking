'use client';

import { useEffect, useState } from 'react';
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

export default function ProfilePage() {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-[6px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mb-4 block">ACCOUNT SETTINGS</span>
            <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight leading-none mb-4 uppercase">Cá nhân</h1>
            <div className="w-16 h-0.5 bg-primary mx-auto" />
          </div>

          {/* Profile Header Card */}
          <div className="bg-background rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-border p-12 mb-10 transition-all duration-700 hover:shadow-2xl hover:shadow-foreground/5">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
              <div className="relative group shrink-0">
                <div className="transition-all duration-700 rounded-[40px] overflow-hidden border-4 border-background shadow-2xl bg-background">
                  <ImageUpload
                    value={formData.avatar || profile?.avatar || ''}
                    onChange={url => setFormData({ ...formData, avatar: url })}
                    folder="avatars"
                    variant="avatar"
                  />
                </div>
              </div>
              <div className="text-center md:text-left pt-4">
                <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight mb-2 uppercase">{profile?.name}</h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-6">{profile?.email}</p>
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-accent/5 rounded-full border border-border">
                   <Calendar className="w-4 h-4 text-primary" />
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    ESTABLISHED. {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                   </p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Tabs & Form Container */}
          <div className="bg-background rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] border border-border overflow-hidden mb-10 transition-all duration-700">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('info')}
                className={cn(
                  'flex-1 py-8 text-[11px] font-bold uppercase tracking-widest transition-all duration-700 relative',
                  activeTab === 'info'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Thông tin cá nhân
                <span className={cn(
                    "absolute bottom-0 left-0 w-full h-1 bg-primary transition-all duration-700 origin-left scale-x-0",
                    activeTab === 'info' && "scale-x-100"
                  )} />
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={cn(
                  'flex-1 py-8 text-[11px] font-bold uppercase tracking-widest transition-all duration-700 relative',
                  activeTab === 'password'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Đổi mật khẩu
                <span className={cn(
                    "absolute bottom-0 left-0 w-full h-1 bg-primary transition-all duration-700 origin-left scale-x-0",
                    activeTab === 'password' && "scale-x-100"
                  )} />
              </button>
            </div>

            <div className="p-12">
              {activeTab === 'info' ? (
                <form onSubmit={handleUpdateProfile} className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-2 block italic">FULL NAME</label>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-lg tracking-tight text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3 opacity-60">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-2 block italic">EMAIL ADDRESS</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={profile?.email || ''}
                        className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-transparent rounded-[24px] text-muted-foreground/50 font-bold text-lg tracking-tight cursor-not-allowed"
                        disabled
                      />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-2 px-6">! CONTACT SUPPORT TO CHANGE EMAIL</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-2 block italic">PHONE NUMBER</label>
                    <div className="relative group">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="09xx xxx xxx"
                        className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-lg tracking-tight text-foreground"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-6 bg-primary text-background rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background border-2 border-primary transition-all duration-700 shadow-xl shadow-primary/20 flex items-center justify-center gap-4 group active:scale-95"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5 group-hover:scale-125 transition-transform" />
                    )}
                    CẬP NHẬT THÔNG TIN
                  </button>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-2 block italic">CURRENT PASSWORD</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={e =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-2 block italic">NEW PASSWORD</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={e =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-foreground"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-2 block italic">CONFIRM NEW PASSWORD</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={e =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-foreground"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-6 bg-primary text-background rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-foreground hover:text-background border-2 border-primary transition-all duration-700 shadow-xl shadow-primary/20 flex items-center justify-center gap-4 group active:scale-95"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                    THAY ĐỔI MẬT KHẨU
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Logout Section */}
          <button
            onClick={handleLogout}
            className="w-full py-8 text-muted-foreground/30 hover:text-primary font-bold text-[11px] uppercase tracking-[0.6em] transition-all duration-700 group flex items-center justify-center gap-6"
          >
            <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors">
               <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
            SIGN OUT FROM ACCOUNT
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
