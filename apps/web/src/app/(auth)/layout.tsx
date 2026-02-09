'use client';

import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-block mb-8 text-2xl font-heading font-bold text-primary">
            Reetro<span className="text-accent">BarberShop</span>
          </Link>
          {children}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
          <h2 className="text-4xl font-heading font-bold mb-4 text-center">
            Chào mừng đến với
            <br />
            ReetroBarberShop
          </h2>
          <p className="text-white/80 text-center text-lg max-w-md">
            Đặt lịch cắt tóc nhanh chóng, thanh toán tiện lợi qua QR Code. Trải nghiệm dịch vụ đẳng
            cấp với đội ngũ stylist chuyên nghiệp.
          </p>
          <div className="mt-12 flex gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">50+</p>
              <p className="text-white/60 text-sm">Stylist</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold">10K+</p>
              <p className="text-white/60 text-sm">Khách hàng</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold">4.9</p>
              <p className="text-white/60 text-sm">Đánh giá</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
