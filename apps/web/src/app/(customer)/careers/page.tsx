'use client';

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Briefcase, UserPlus, Heart, Zap, Globe } from 'lucide-react';

export default function CareersPage(): React.ReactNode {
  const values = [
    { icon: Heart, title: 'Tận tâm', desc: 'Phục vụ từ tâm, đặt sự hài lòng lên hàng đầu.' },
    { icon: Zap, title: 'Sáng tạo', desc: 'Luôn dẫn đầu xu hướng, không ngừng học hỏi.' },
    { icon: Globe, title: 'Đẳng cấp', desc: 'Chủ động xây dựng tiêu chuẩn chuyên nghiệp.' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      
      <main className="container mx-auto px-4 py-24 max-w-5xl">
        <div className="text-center mb-24">
          <span className="text-[10px] font-bold text-[#C8A97E] uppercase tracking-[0.4em] mb-4 block">TUYỂN DỤNG</span>
          <h1 className="text-4xl md:text-6xl font-bold text-[#2C1E12] tracking-tight mb-8 italic font-heading">
            Gia Nhập <span className="text-[#C8A97E]">REETRO TEAM</span>
          </h1>
          <p className="text-[#8B7355] text-lg max-w-3xl mx-auto leading-relaxed">
            Chúng tôi luôn tìm kiếm những nghệ sĩ tài năng và đam mê thực sự với nghề cạo. Tại REETRO, cơ hội phát triển sự nghiệp của bạn là không giới hạn.
          </p>
        </div>

        {/* Culture */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {values.map((v, i) => (
            <div key={i} className="bg-white p-10 rounded-2xl border border-[#E8E0D4] text-center shadow-sm">
              <div className="w-14 h-14 bg-[#F0EBE3] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <v.icon className="w-6 h-6 text-[#C8A97E]" />
              </div>
              <h3 className="text-xl font-bold text-[#2C1E12] mb-4">{v.title}</h3>
              <p className="text-[#5C4A32] text-sm leading-relaxed opacity-80">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Jobs List */}
        <div className="bg-[#2C1E12] p-12 md:p-16 rounded-3xl text-white">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <h2 className="text-3xl font-bold italic text-[#C8A97E]">Vị trí đang tuyển</h2>
            <div className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold tracking-widest text-[#C8A97E] border border-white/20">
              CẬP NHẬT: 2024
            </div>
          </div>

          <div className="space-y-6">
            {[
              { role: 'Stylist / Barber VIP', location: 'Quận 1, TP.HCM', type: 'Full-time' },
              { role: 'Quản lý Chi nhánh', location: 'Toàn quốc', type: 'Full-time' },
              { role: 'Gội đầu / Massage', location: 'Quận 7, TP.HCM', type: 'Part-time' },
            ].map((j, i) => (
              <div key={i} className="group bg-white/5 hover:bg-white/10 p-8 rounded-2xl border border-white/10 transition-all flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer">
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[#C8A97E] transition-colors">{j.role}</h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-white/50">
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{j.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{j.type}</span>
                  </div>
                </div>
                <button className="bg-[#C8A97E] hover:bg-[#B8975E] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap active:scale-95 flex items-center gap-2">
                  ỨNG TUYỂN <UserPlus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
          <p className="text-[#8B7355] text-sm mb-4">Hoặc gửi CV trực tiếp về bộ phận nhân sự:</p>
          <a href="mailto:hr@reetro.vn" className="text-xl font-bold text-[#2C1E12] border-b-2 border-[#C8A97E] pb-1 hover:text-[#C8A97E] transition-colors">HR@REETRO.VN</a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
