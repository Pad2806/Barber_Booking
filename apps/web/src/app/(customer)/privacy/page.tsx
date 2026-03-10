'use client';

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Shield, Lock, Eye, Share2, UserCheck } from 'lucide-react';

export default function PrivacyPolicyPage(): React.ReactNode {
  const sections = [
    {
      icon: Eye,
      title: '1. Thu thập thông tin',
      content: 'Chúng tôi thu thập các thông tin cần thiết khi bạn đăng ký tài khoản hoặc đặt lịch hẹn, bao gồm: Họ tên, số điện thoại, địa chỉ email và lịch sử đặt lịch tại REETRO BARBER.',
    },
    {
      icon: UserCheck,
      title: '2. Sử dụng thông tin',
      content: 'Thông tin của bạn được sử dụng để quản lý lịch hẹn, xác nhận dịch vụ, thông báo các chương trình ưu đãi đặc quyền và cải thiện chất lượng phục vụ tại các chi nhánh.',
    },
    {
      icon: Lock,
      title: '3. Bảo mật dữ liệu',
      content: 'REETRO BARBER áp dụng các biện pháp bảo mật tiên tiến để bảo vệ thông tin cá nhân của bạn khỏi việc truy cập, thay đổi hoặc tiết lộ trái phép.',
    },
    {
      icon: Share2,
      title: '4. Chia sẻ thông tin',
      content: 'Chúng tôi cam kết không bán, trao đổi hoặc cho thuê thông tin cá nhân của khách hàng cho bên thứ ba, trừ trường hợp có yêu cầu từ cơ quan pháp luật có thẩm quyền.',
    },
    {
      icon: Shield,
      title: '5. Quyền của bạn',
      content: 'Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân của mình bất kỳ lúc nào thông qua trang cá nhân hoặc liên hệ trực tiếp với bộ phận hỗ trợ của chúng tôi.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      
      <main className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold text-[#C8A97E] uppercase tracking-[0.4em] mb-4 block">BẢO MẬT TUYỆT ĐỐI</span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#2C1E12] tracking-tight mb-6 italic font-heading">
            Chính Sách <span className="text-[#C8A97E]">Bảo Mật</span>
          </h1>
          <p className="text-[#8B7355] text-sm font-medium max-w-2xl mx-auto leading-relaxed">
            Tại REETRO BARBER, sự riêng tư của bạn là ưu tiên hàng đầu. Chúng tôi cam kết bảo vệ mọi thông tin khách hàng bằng sự chuyên nghiệp và minh bạch nhất.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl border border-[#E8E0D4] shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-[#F0EBE3] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#C8A97E] transition-colors duration-500">
                  <section.icon className="w-6 h-6 text-[#8B7355] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2C1E12] mb-3">{section.title}</h2>
                  <p className="text-[#5C4A32] leading-relaxed text-sm font-medium opacity-80">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-[#2C1E12] rounded-2xl text-white text-center">
          <h3 className="text-xl font-bold mb-4 italic text-[#C8A97E]">Bạn có thắc mắc?</h3>
          <p className="text-white/70 text-sm mb-6 max-w-xl mx-auto">
            Nếu bạn có bất kỳ câu hỏi nào liên quan đến chính sách bảo mật, vui lòng liên hệ với đội ngũ CSKH của REETRO BARBER.
          </p>
          <a 
            href="mailto:privacy@reetro.vn" 
            className="inline-block px-8 py-3 bg-[#C8A97E] hover:bg-[#B8975E] text-white rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            Liên hệ hỗ trợ
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
