'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [verifying, setVerifying] = useState(true);

  const verifyToken = useCallback(async () => {
    try {
      if (!token) {
        setStatus('error');
        setVerifying(false);
        return;
      }
      await axios.get(`${API_URL}/api/auth/verify-reset-token?token=${token}`);
      setVerifying(false);
    } catch (error) {
      setStatus('error');
      setVerifying(false);
    }
  }, [token]);

  useEffect(() => {
    void verifyToken();
  }, [verifyToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        password,
      });
      setStatus('success');
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn';
      toast.error(message);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#C8A97E] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#8B7355]">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#E8E0D4] text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#2C1E12] mb-2">Link không hợp lệ</h1>
        <p className="text-sm text-[#8B7355] mb-6 leading-relaxed">
          Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.
        </p>
        <Link
          href="/forgot-password"
          className="block w-full py-3.5 bg-[#C8A97E] text-white rounded-xl font-bold hover:bg-[#B8975E] transition-colors"
        >
          Yêu cầu link mới
        </Link>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#E8E0D4] text-center">
        <div className="w-16 h-16 bg-[#F0EBE3] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-[#C8A97E]" />
        </div>
        <h1 className="text-2xl font-bold text-[#2C1E12] mb-2">Thành công!</h1>
        <p className="text-sm text-[#8B7355] mb-6 leading-relaxed">
          Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
        </p>
        <Link
          href="/login"
          className="block w-full py-3.5 bg-[#C8A97E] text-white rounded-xl font-bold hover:bg-[#B8975E] transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-[#E8E0D4] space-y-8 animate-in fade-in slide-in-from-bottom-4 transition-all duration-500">
      <div>
        <h2 className="text-3xl font-bold text-[#2C1E12]">Đặt lại mật khẩu</h2>
        <p className="text-sm font-medium text-[#8B7355] mt-2">Nhập mật khẩu mới cho tài khoản của bạn</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#2C1E12]">Mật khẩu mới</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              className="w-full pl-12 pr-12 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium text-[#2C1E12]"
              required
              minLength={6}
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
          <label className="text-sm font-bold text-[#2C1E12]">Xác nhận mật khẩu</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7355] transition-colors group-focus-within:text-[#C8A97E]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full pl-12 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all font-medium text-[#2C1E12]"
              required
              minLength={6}
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
              Đang xử lý...
            </>
          ) : (
            'Đặt lại mật khẩu'
          )}
        </button>
      </form>
    </div>
  );
}

function ResetPasswordLoading() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#C8A97E] mx-auto mb-4" />
        <p className="text-sm font-medium text-[#8B7355]">Đang tải...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
