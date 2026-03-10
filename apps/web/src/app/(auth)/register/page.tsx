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
    <div className="space-y-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#E8E0D4] mb-12">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold text-[#2C1E12]">Đăng ký</h2>
        <p className="text-sm font-medium text-[#8B7355]">Trở thành thành viên của Reetro để tận hưởng dịch vụ tốt nhất</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-bold text-[#2C1E12]">Họ và tên</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
                className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium text-[#2C1E12] placeholder:text-[#8B7355]/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold text-[#2C1E12]">Địa chỉ Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="client@example.com"
                required
                className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium text-[#2C1E12] placeholder:text-[#8B7355]/50"
              />
            </div>
          </div>

          <div className="space-y-2">
             <label htmlFor="phone" className="text-sm font-bold text-[#2C1E12]">Số điện thoại <span className="text-[#8B7355] font-normal">(Tùy chọn)</span></label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912 345 678"
                className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium text-[#2C1E12] placeholder:text-[#8B7355]/50"
              />
            </div>
          </div>

          <div className="space-y-2">
             <label htmlFor="password" className="text-sm font-bold text-[#2C1E12]">Mật khẩu</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
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

          <div className="space-y-2">
             <label htmlFor="confirmPassword" className="text-sm font-bold text-[#2C1E12]">Xác nhận mật khẩu</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium text-[#2C1E12]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            required
            className="w-4 h-4 mt-0.5 border-[#E8E0D4] rounded text-[#C8A97E] focus:ring-[#C8A97E] accent-[#C8A97E] cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs font-medium text-[#8B7355] leading-relaxed cursor-pointer">
            Tôi đồng ý với các <Link href="/terms" className="text-[#C8A97E] font-bold hover:underline">Điều Khoản</Link> và <Link href="/privacy" className="text-[#C8A97E] font-bold hover:underline">Chính Sách Bảo Mật</Link>
          </label>
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
               Tạo tài khoản mới <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </button>
      </form>

      <div className="pt-6 text-center text-sm font-medium text-[#5C4A32] border-t border-[#E8E0D4]">
         Đã có tài khoản?{' '}
         <Link href="/login" className="text-[#C8A97E] font-bold hover:text-[#B8975E] transition-colors">
           Đăng nhập
         </Link>
      </div>
    </div>
  );
}
