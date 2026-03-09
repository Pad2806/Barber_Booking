'use client';

import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-lg">
          <Link href="/" className="flex items-center gap-2 group mb-16">
            <span className="text-3xl font-black tracking-[-0.08em] text-black group-hover:scale-105 transition-transform duration-500">
              REETRO<span className="bg-black text-white px-2 py-0.5 ml-1 rounded-sm">BARBER</span>
            </span>
          </Link>
          {children}
        </div>
      </div>

      {/* Right Side - Premium Dark Panel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-40 grayscale pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000&auto=format')] bg-cover bg-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-start justify-center text-white p-24">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-8 block">THE EXPERIENCE</span>
          <h2 className="text-7xl font-heading font-black mb-8 tracking-tighter leading-none uppercase italic">
            NÂNG TẦM<br />
            <span className="text-white bg-white/10 px-4 inline-block">BẢN LĨNH</span>
          </h2>
          <p className="text-gray-400 text-xl max-w-md font-light tracking-tight leading-relaxed mb-16">
            Đặt lịch cắt tóc nhanh chóng, trải nghiệm dịch vụ đẳng cấp thượng lưu cùng REETRO BARBER CO.
          </p>
          
          <div className="grid grid-cols-3 gap-12 pt-12 border-t border-white/10 w-full">
            <div className="text-left">
              <p className="text-4xl font-black tracking-tighter mb-1 uppercase italic">50+</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">STYLISTS</p>
            </div>
            <div className="text-left">
              <p className="text-4xl font-black tracking-tighter mb-1 uppercase italic">10K+</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">CLIENTS</p>
            </div>
            <div className="text-left">
              <p className="text-4xl font-black tracking-tighter mb-1 uppercase italic">4.9</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">RATING</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-12 right-12 text-[10px] font-black text-white/20 uppercase tracking-[1em] rotate-90 origin-right">
           REETRO BARBER SHOP © 2024
        </div>
      </div>
    </div>
  );
}
