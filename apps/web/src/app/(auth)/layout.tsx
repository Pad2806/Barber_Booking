'use client';

import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row text-foreground font-sans">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 lg:p-24 bg-background">
        <div className="w-full max-w-lg">
          <Link href="/" className="flex items-center gap-2 group mb-16">
            <span className="text-3xl font-heading font-bold tracking-tight text-foreground group-hover:text-primary transition-all duration-500">
              REETRO<span className="text-primary ml-1">BARBER</span>
            </span>
          </Link>
          {children}
        </div>
      </div>

      {/* Right Side - Premium Dark Panel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-foreground">
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000&auto=format')] bg-cover bg-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-start justify-center text-background p-24">
           <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.5em] mb-8 block font-mono">EST. 2024</span>
          <h2 className="text-6xl font-heading font-bold mb-8 tracking-tight leading-none uppercase italic">
            NÂNG TẦM<br />
            <span className="text-primary bg-background/10 px-4 inline-block transform -rotate-1">BẢN LĨNH</span>
          </h2>
          <p className="text-background/60 text-lg max-w-md font-bold tracking-tight leading-relaxed mb-16 uppercase italic">
            Đặt lịch cắt tóc nhanh chóng, trải nghiệm dịch vụ đẳng cấp thượng lưu cùng REETRO BARBER CO.
          </p>
          
          <div className="grid grid-cols-3 gap-12 pt-12 border-t border-background/10 w-full">
            <div className="text-left">
              <p className="text-4xl font-heading font-bold tracking-tight mb-1 uppercase italic text-primary">50+</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/40">STYLISTS</p>
            </div>
            <div className="text-left">
              <p className="text-4xl font-heading font-bold tracking-tight mb-1 uppercase italic text-primary">10K+</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/40">CLIENTS</p>
            </div>
            <div className="text-left">
              <p className="text-4xl font-heading font-bold tracking-tight mb-1 uppercase italic text-primary">4.9</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/40">RATING</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-12 right-12 text-[10px] font-bold text-background/10 uppercase tracking-[1em] rotate-90 origin-right pointer-events-none select-none">
           REETRO BARBER SHOP © 2024
        </div>
      </div>
    </div>
  );
}
