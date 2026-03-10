'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
      });

      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đã có lỗi xảy ra';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12 transition-all duration-1000 animate-in fade-in slide-in-from-bottom-8 pb-12">
      <div className="space-y-4">
         <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.4em] block font-mono">JOIN THE CLUB</span>
        <h2 className="text-4xl font-heading font-bold text-foreground tracking-tight uppercase leading-none">Đăng ký</h2>
        <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase italic leading-relaxed">Trở thành thành viên của REETRO để tận hưởng dịch vụ tốt nhất.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="name" className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] font-mono italic px-2">FULL NAME</label>
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="NGUYỄN VĂN A"
                required
                className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-[11px] tracking-widest placeholder:text-muted-foreground/20 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="email" className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] font-mono italic px-2">EMAIL ADDRESS</label>
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="CLIENT@EXAMPLE.COM"
                required
                className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-[11px] tracking-widest placeholder:text-muted-foreground/20 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-3">
             <label htmlFor="phone" className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] font-mono italic px-2">PHONE (OPTIONAL)</label>
            <div className="relative group">
              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912345678"
                className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-[11px] tracking-widest placeholder:text-muted-foreground/20 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-3">
             <label htmlFor="password" className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] font-mono italic px-2">CREATE PASSWORD</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
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
          </div>

          <div className="space-y-3">
             <label htmlFor="confirmPassword" className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em] font-mono italic px-2">CONFIRM PASSWORD</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-16 pr-8 py-5 bg-accent/5 border-2 border-border rounded-[24px] focus:outline-none focus:border-primary focus:bg-background transition-all font-bold text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4 px-2">
          <input
            type="checkbox"
            id="terms"
            required
            className="w-5 h-5 mt-0.5 border-2 border-border rounded-sm text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <label htmlFor="terms" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed cursor-pointer italic">
            I AGREE TO THE <Link href="/terms" className="text-primary underline underline-offset-4 decoration-1 hover:text-foreground">TERMS</Link> AND <Link href="/privacy" className="text-primary underline underline-offset-4 decoration-1 hover:text-foreground">PRIVACY POLICY</Link>
          </label>
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
               CREATE ACCOUNT <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
            </div>
          )}
        </button>
      </form>

      <div className="pt-8 text-center border-t border-border">
         <p className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.2em] mb-4 italic">ALREADY HAVE AN ACCOUNT?</p>
         <Link href="/login" className="inline-block px-12 py-4 border-2 border-primary rounded-full font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-700 active:scale-95 text-primary">
           SIGN IN
         </Link>
      </div>
    </div>
  );
}
