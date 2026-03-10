'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setIsSubmitted(true);
    } catch (error: any) {
      // Don't reveal if email exists or not (404), but do show server configuration errors (500)
      if (error.response && error.response.status >= 500) {
        toast.error(error.response.data.message || 'Lỗi hệ thống khi gửi email');
      } else {
        setIsSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#E8E0D4] text-center space-y-6">
        <div className="w-16 h-16 bg-[#F0EBE3] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-[#C8A97E]" />
        </div>
        <h2 className="text-2xl font-bold text-[#2C1E12] mb-2">Đã gửi email</h2>
        <p className="text-[#8B7355] text-sm mb-6 leading-relaxed">
          Nếu tài khoản tồn tại với email <span className="font-bold text-[#2C1E12]">{email}</span>, bạn sẽ
          nhận được hướng dẫn đặt lại mật khẩu trong vài phút.
        </p>
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full py-3.5 bg-[#C8A97E] text-white rounded-xl font-bold hover:bg-[#B8975E] transition-colors"
          >
            Quay lại đăng nhập
          </Link>
          <button
            onClick={() => setIsSubmitted(false)}
            className="block w-full py-3.5 text-sm font-semibold text-[#8B7355] hover:text-[#5C4A32] hover:bg-[#FAF8F5] rounded-xl transition-colors"
          >
            Thử gửi lại email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#E8E0D4] space-y-8 animate-in fade-in slide-in-from-bottom-4 transition-all duration-500">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#8B7355] hover:text-[#C8A97E] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>

        <h2 className="text-3xl font-bold text-[#2C1E12]">Quên mật khẩu?</h2>
        <p className="text-sm font-medium text-[#8B7355] mt-2">
          Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#2C1E12]">Địa chỉ Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium text-[#2C1E12] placeholder:text-[#8B7355]/50"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-[#C8A97E] text-white rounded-xl font-bold hover:bg-[#B8975E] transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang gửi...
            </>
          ) : (
            'Gửi hướng dẫn'
          )}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-[#5C4A32] border-t border-[#E8E0D4] pt-6">
        Nhớ mật khẩu?{' '}
        <Link href="/login" className="text-[#C8A97E] font-bold hover:text-[#B8975E] transition-colors">
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
