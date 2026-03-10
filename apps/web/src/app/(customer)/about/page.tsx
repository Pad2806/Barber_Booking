'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import Image from 'next/image';
import { Scissors, Star, Users, History } from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'Năm thành lập', value: '2024', icon: History },
    { label: 'Khách hàng hài lòng', value: '500K+', icon: Star },
    { label: 'Chi nhánh toàn quốc', value: '100+', icon: Scissors },
    { label: 'Đội ngũ Stylist', value: '1000+', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000&auto=format"
            alt="Reetro Barber"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#2C1E12]/80" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="text-[10px] font-bold text-[#C8A97E] uppercase tracking-[0.4em] mb-4 block">VỀ CHÚNG TÔI</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 italic font-heading">
            REETRO <span className="text-[#C8A97E]">BARBER</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-medium">
            Nâng tầm phong cách quý ông Việt thông qua sự kết hợp giữa truyền thống và tinh hoa hiện đại.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 bg-white border-b border-[#E8E0D4]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[10px] font-bold text-[#8B7355] uppercase tracking-[0.4em] mb-4 block">TRIẾT LÝ</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C1E12] mb-8 leading-tight">
                Không Chỉ Là Một Kiểu Tóc,<br />
                Đó Là <span className="text-[#C8A97E]">Một Trải Nghiệm.</span>
              </h2>
              <p className="text-[#5C4A32] text-sm font-medium leading-relaxed mb-6 opacity-80">
                Tại REETRO BARBER, chúng tôi tin rằng mỗi quý ông đều sở hữu một nét riêng độc bản. Nhiệm vụ của chúng tôi là lắng nghe và định hình phong cách đó thông qua đôi tay khéo léo của những Stylist hàng đầu.
              </p>
              <p className="text-[#5C4A32] text-sm font-medium leading-relaxed opacity-80">
                Mọi chi tiết tại salon, từ mùi hương đàn hương nhẹ nhàng đến không gian cổ điển pha lẫn hiện đại, đều được thiết kế để bạn có những phút giây thư giãn tuyệt đối.
              </p>
            </div>
            <div className="relative h-[450px] rounded-3xl overflow-hidden shadow-2xl skew-y-2 group transition-transform hover:skew-y-0 duration-700">
               <Image 
                src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1000&auto=format"
                alt="Styling"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C1E12]/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-[#FAF8F5]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E8E0D4] group-hover:bg-[#C8A97E] transition-all duration-500">
                  <stat.icon className="w-7 h-7 text-[#8B7355] group-hover:text-white transition-colors" />
                </div>
                <div className="text-3xl font-bold text-[#2C1E12] mb-1">{stat.value}</div>
                <div className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#2C1E12] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80')] bg-cover grayscale" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 italic tracking-tight">
            Hãy Để REETRO Định Hình <br /> 
            <span className="text-[#C8A97E]">Phong Cách Của Bạn</span>
          </h2>
          <Link 
            href="/salons" 
            className="inline-block px-10 py-4 bg-[#C8A97E] hover:bg-[#B8975E] text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-xl"
          >
            ĐẶT LỊCH NGAY
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
