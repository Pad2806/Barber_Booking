'use client';

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { BadgeCheck, BarChart3, Coins, PieChart, ShieldCheck, TrendingUp } from 'lucide-react';

export default function FranchisePage(): React.ReactNode {
  const benefits = [
    { icon: TrendingUp, title: 'Thương hiệu hàng đầu', desc: 'Sở hữu quyền sử dụng thương hiệu REETRO BARBER uy tín.' },
    { icon: BadgeCheck, title: 'Hệ thống vận hành', desc: 'Quy trình phục vụ chuẩn 5 sao được tối ưu hóa sẵn.' },
    { icon: BarChart3, title: 'Phần mềm quản lý', desc: 'Độc quyền hệ thống booking và quản lý salon hiện đại.' },
    { icon: ShieldCheck, title: 'Đào tạo chuyên sâu', desc: 'Hỗ trợ đào tạo Stylist và quản lý theo tiêu chuẩn REETRO.' },
    { icon: PieChart, title: 'Kế hoạch Marketing', desc: 'Hỗ trợ truyền thông thu hút khách hàng từ ngày đầu.' },
    { icon: Coins, title: 'Lợi nhuận bền vững', desc: 'Mô hình kinh doanh đã được chứng minh thành công.' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      
      <main className="container mx-auto px-4 py-24 max-w-6xl">
        {/* Intro */}
        <div className="text-center mb-24">
          <span className="text-[10px] font-bold text-[#C8A97E] uppercase tracking-[0.4em] mb-4 block">HỢP TÁC KINH DOANH</span>
          <h1 className="text-4xl md:text-6xl font-bold text-[#2C1E12] tracking-tight mb-8 italic font-heading">
            Cơ Hội <span className="text-[#C8A97E]">Nhượng Quyền</span>
          </h1>
          <p className="text-[#8B7355] text-lg max-w-3xl mx-auto leading-relaxed">
            Đồng hành cùng REETRO BARBER để xây dựng hệ thống salon đẳng cấp. Chúng tôi cung cấp giải pháp trọn gói từ thương hiệu, thiết kế đến vận hành.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white p-10 rounded-3xl border border-[#E8E0D4] hover:shadow-xl transition-all duration-500 group">
              <div className="w-16 h-16 bg-[#2C1E12] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#C8A97E] transition-colors duration-500">
                <b.icon className="w-8 h-8 text-[#C8A97E] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-[#2C1E12] mb-4">{b.title}</h3>
              <p className="text-[#5C4A32] text-sm leading-relaxed opacity-80">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Process Card */}
        <div className="bg-white p-12 md:p-16 rounded-[40px] border border-[#E8E0D4] shadow-sm overflow-hidden relative mb-24">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F0EBE3] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C1E12] mb-6 leading-tight">Bắt đầu hành trình <br /><span className="text-[#C8A97E] italic font-heading">thành công của bạn.</span></h2>
              <p className="text-[#5C4A32] text-sm font-medium mb-10 opacity-80 leading-relaxed">
                Chúng tôi cung cấp quy trình 5 bước đơn giản để bạn sở hữu chi nhánh REETRO BARBER riêng. Từ khảo sát mặt bằng đến ngày khai trương rực rỡ.
              </p>
              <button className="bg-[#2C1E12] text-white px-10 py-4 rounded-xl font-bold text-sm hover:bg-[#C8A97E] transition-all shadow-xl active:scale-95">
                TẢI XUỐNG BROCHURE NHƯỢNG QUYỀN
              </button>
            </div>
            
            <div className="md:w-1/2 bg-[#FAF8F5] p-10 rounded-3xl border border-[#E8E0D4]">
              <h3 className="text-xl font-bold text-[#2C1E12] mb-8">Liên hệ trực tiếp</h3>
              <form className="space-y-4">
                <input type="text" placeholder="Họ và tên" className="w-full px-4 py-3 bg-white border border-[#E8E0D4] rounded-lg text-sm focus:border-[#C8A97E] focus:outline-none transition-all placeholder:text-[#8B7355]/40" />
                <input type="tel" placeholder="Số điện thoại" className="w-full px-4 py-3 bg-white border border-[#E8E0D4] rounded-lg text-sm focus:border-[#C8A97E] focus:outline-none transition-all placeholder:text-[#8B7355]/40" />
                <button type="button" className="w-full bg-[#C8A97E] hover:bg-[#B8975E] text-white py-4 rounded-lg font-bold text-sm transition-all active:scale-95 shadow-lg">ĐĂNG KÝ TƯ VẤN</button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
