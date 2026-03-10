'use client';

import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col lg:flex-row text-[#2C1E12] font-sans">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-24 bg-[#FAF8F5]">
        <div className="w-full max-w-lg">
          <Link href="/" className="flex items-center gap-2 group mb-12">
            <span className="text-3xl font-bold tracking-tight text-[#2C1E12] transition-all">
              Reetro<span className="text-[#C8A97E] ml-1">Barber</span>
            </span>
          </Link>
          {children}
        </div>
      </div>

      {/* Right Side - Premium Dark Panel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-[#2C1E12]">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000&auto=format')] bg-cover bg-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#2C1E12] via-[#2C1E12]/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-start justify-center text-white p-24">
          <h2 className="text-5xl font-bold mb-6 tracking-tight leading-tight">
            Nâng Tầm<br />
            <span className="text-[#C8A97E]">Bản Lĩnh Phái Mạnh</span>
          </h2>
          <p className="text-white/70 text-lg max-w-md font-medium leading-relaxed mb-16">
            Đặt lịch cắt tóc nhanh chóng, trải nghiệm dịch vụ đẳng cấp thượng lưu cùng Reetro Barber.
          </p>
          
          <div className="grid grid-cols-3 gap-12 pt-12 border-t border-white/10 w-full">
            <div className="text-left">
              <p className="text-3xl font-bold tracking-tight mb-2 text-[#C8A97E]">50+</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Thợ cạo</p>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold tracking-tight mb-2 text-[#C8A97E]">10K+</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Khách hàng</p>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold tracking-tight mb-2 text-[#C8A97E]">4.9</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Đánh giá</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
