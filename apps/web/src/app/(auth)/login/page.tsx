'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams?.get('callbackUrl');
  // Sanitize: only allow same-origin paths (strip any full URL to just pathname)
  const callbackUrl = rawCallbackUrl
    ? (() => {
        try {
          const url = new URL(rawCallbackUrl, 'http://localhost');
          return url.pathname + url.search;
        } catch {
          return rawCallbackUrl.startsWith('/') ? rawCallbackUrl : '/dashboard';
        }
      })()
    : null;

  const { update: updateSession } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getRedirectUrl = (role: string): string => {
    if (callbackUrl) return callbackUrl;
    // All staff/admin go to unified dashboard
    if (role === 'CUSTOMER') return '/';
    return '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email hoặc mật khẩu không đúng');
      } else {
        toast.success('Đăng nhập thành công!');

        // Refresh the session to get the latest data from JWT
        let session = null;
        for (let i = 0; i < 3; i++) {
          session = await updateSession();
          if (session?.user) break;
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        const role = (session?.user as any)?.role || 'CUSTOMER';
        const redirectUrl = getRedirectUrl(role);

        // Use window.location for full page reload so SessionProvider
        // re-initializes with the new session — router.push only does
        // a client-side navigation that keeps the old session state
        window.location.href = redirectUrl;
      }
    } catch (error) {
      toast.error('Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };



  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    await signIn(provider, { callbackUrl: callbackUrl || '/' });
  };

  return (
    <div className="space-y-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#E8E0D4]">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold text-[#2C1E12]">Đăng nhập</h2>
        <p className="text-sm font-medium text-[#8B7355]">Vui lòng nhập thông tin để tiếp tục với Reetro</p>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold text-[#2C1E12]">Địa chỉ Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="client@example.com"
                required
                className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium text-[#2C1E12] placeholder:text-[#8B7355]/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-bold text-[#2C1E12]">Mật khẩu</label>
              <Link href="/forgot-password" title="Quên mật khẩu" className="text-xs font-bold text-[#8B7355] hover:text-[#C8A97E] transition-colors">Quên mật khẩu?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-12 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium text-[#2C1E12]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#C8A97E] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#C8A97E] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#B8975E] transition-all shadow-sm flex items-center justify-center gap-2 group disabled:opacity-70 active:scale-[0.98]"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
               Đăng nhập <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </button>
      </form>

      {/* Social Login */}
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8E0D4]"></div>
          </div>
          <div className="relative flex justify-center text-xs font-semibold text-[#8B7355]">
            <span className="px-4 bg-white">Hoặc đăng nhập bằng</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 bg-[#FAF8F5] border border-[#E8E0D4] text-sm font-bold text-[#2C1E12] py-3 rounded-xl hover:bg-[#F0EBE3] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <button
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 bg-[#FAF8F5] border border-[#E8E0D4] text-sm font-bold text-[#2C1E12] py-3 rounded-xl hover:bg-[#F0EBE3] transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </button>
        </div>
      </div>

      <div className="pt-6 text-center text-sm font-medium text-[#5C4A32]">
         Chưa có tài khoản?{' '}
         <Link href="/register" className="text-[#C8A97E] font-bold hover:text-[#B8975E] transition-colors">
           Đăng ký ngay
         </Link>
      </div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
      <div className="w-10 h-10 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
