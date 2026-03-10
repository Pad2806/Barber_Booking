'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getRedirectUrl = (role: string): string => {
    if (callbackUrl) return callbackUrl;
    switch (role) {
      case 'SUPER_ADMIN':
      case 'SALON_OWNER':
        return '/admin';
      case 'STAFF':
        return '/staff';
      case 'CUSTOMER':
      default:
        return '/';
    }
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
        const session = await getSession();
        const role = (session?.user as any)?.role || 'CUSTOMER';
        const redirectUrl = getRedirectUrl(role);
        router.push(redirectUrl);
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
    <div className="space-y-12 transition-all duration-1000 animate-in fade-in slide-in-from-bottom-8">
      <div className="space-y-4">
         <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.4em] block font-mono">WELCOME BACK</span>
        <h2 className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase leading-none">Đăng nhập</h2>
        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase italic leading-relaxed">Vui lòng nhập thông tin để tiếp tục trải nghiệm cùng REETRO.</p>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="email" className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] font-mono italic px-2">EMAIL ADDRESS</label>
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="CLIENT@EXAMPLE.COM"
                required
                className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-[11px] tracking-widest placeholder:text-muted-foreground/20 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="password" className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] font-mono italic px-2">PASSWORD</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-16 pr-16 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex justify-end px-2">
               <Link href="/forgot-password" title="Forgot Password" className="text-[10px] font-bold text-primary/40 uppercase tracking-widest hover:text-primary transition-colors italic">QUÊN MẬT KHẨU?</Link>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-background py-6 rounded-full font-bold text-[11px] uppercase tracking-[0.4em] hover:bg-foreground transition-all duration-700 shadow-xl shadow-primary/20 flex items-center justify-center gap-4 group active:scale-95 border border-primary/20"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <div className="flex items-center gap-4">
               LOGIN <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
            </div>
          )}
        </button>
      </form>

      {/* Social Login - Monochrome Clean */}
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.4em]">
            <span className="px-6 bg-background text-primary/30 italic font-mono">OR SIGN IN WITH</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-4 bg-accent/5 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground py-4 rounded-full hover:bg-primary hover:text-background transition-all duration-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            GOOGLE
          </button>

          <button
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            className="flex items-center justify-center gap-4 bg-accent/5 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground py-4 rounded-full hover:bg-primary hover:text-background transition-all duration-700"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            FACEBOOK
          </button>
        </div>
      </div>

      <div className="pt-8 text-center border-t border-border">
         <p className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em] mb-4 italic">MỚI BIẾT ĐẾN REETRO?</p>
         <Link href="/register" className="inline-block px-12 py-4 border-2 border-primary rounded-full font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-700 active:scale-95 text-primary">
           CREATE ACCOUNT
         </Link>
      </div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-16 h-16 border-[6px] border-primary border-t-transparent rounded-full animate-spin" />
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
