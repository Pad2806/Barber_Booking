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
         <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] block">JOIN THE CLUB</span>
        <h2 className="text-6xl font-heading font-black text-gray-900 tracking-tighter uppercase italic leading-none">Đăng ký</h2>
        <p className="text-sm font-light text-gray-500 tracking-tight">Trở thành thành viên của REETRO để tận hưởng dịch vụ tốt nhất.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="name" className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] font-mono italic px-2">FULL NAME</label>
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 transition-colors group-hover:text-black" />
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="NGUYỄN VĂN A"
                required
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:outline-none focus:border-black focus:bg-white transition-all font-black text-sm tracking-widest placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="email" className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] font-mono italic px-2">EMAIL ADDRESS</label>
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 transition-colors group-hover:text-black" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="CLIENT@EXAMPLE.COM"
                required
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:outline-none focus:border-black focus:bg-white transition-all font-black text-sm tracking-widest placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="space-y-3">
             <label htmlFor="phone" className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] font-mono italic px-2">PHONE (OPTIONAL)</label>
            <div className="relative group">
              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 transition-colors group-hover:text-black" />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912345678"
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:outline-none focus:border-black focus:bg-white transition-all font-black text-sm tracking-widest placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="space-y-3">
             <label htmlFor="password" className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] font-mono italic px-2">CREATE PASSWORD</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 transition-colors group-hover:text-black" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-16 pr-16 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:outline-none focus:border-black focus:bg-white transition-all font-black"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
             <label htmlFor="confirmPassword" className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] font-mono italic px-2">CONFIRM PASSWORD</label>
            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 transition-colors group-hover:text-black" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-16 pr-8 py-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:outline-none focus:border-black focus:bg-white transition-all font-black"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4 px-2">
          <input
            type="checkbox"
            id="terms"
            required
            className="w-5 h-5 mt-0.5 border-2 border-gray-100 rounded-sm text-black focus:ring-black accent-black cursor-pointer"
          />
          <label htmlFor="terms" className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed cursor-pointer">
            I AGREE TO THE <Link href="/terms" className="text-black underline underline-offset-4 decoration-1">TERMS</Link> AND <Link href="/privacy" className="text-black underline underline-offset-4 decoration-1">PRIVACY POLICY</Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] hover:bg-white hover:text-black border-2 border-black transition-all duration-700 shadow-2xl shadow-black/20 flex items-center justify-center gap-4 group active:scale-95"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <div className="flex items-center gap-4">
               CREATE ACCOUNT <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
            </div>
          )}
        </button>
      </form>

      <div className="pt-8 text-center border-t border-gray-100">
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">ALREADY HAVE AN ACCOUNT?</p>
         <Link href="/login" className="inline-block px-12 py-4 border-2 border-black rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all duration-700 active:scale-95">
           SIGN IN
         </Link>
      </div>
    </div>
  );
}
