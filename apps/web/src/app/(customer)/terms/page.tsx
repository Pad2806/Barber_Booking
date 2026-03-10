'use client';

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { FileText, CalendarCheck, CreditCard, RotateCcw, AlertCircle } from 'lucide-react';

export default function TermsPage(): React.ReactNode {
  const terms = [
    {
      icon: CalendarCheck,
      title: '1. Quy định Đặt lịch',
      content: 'Khách hàng nên đặt lịch trước ít nhất 1 giờ để đảm bảo có vị trí. Lịch hẹn của bạn sẽ được giữ tối đa 15 phút so với giờ đã chọn. Sau thời gian này, chúng tôi có quyền ưu tiên cho khách hàng đến sau.',
    },
    {
      icon: CreditCard,
      title: '2. Thanh toán & Tiền cọc',
      content: 'Đối với một số dịch vụ cao cấp hoặc khung giờ cao điểm, REETRO BARBER có thể yêu cầu thanh toán một khoản tiền cọc để giữ chỗ. Số tiền này sẽ được trừ trực tiếp vào hóa đơn cuối cùng của bạn.',
    },
    {
      icon: RotateCcw,
      title: '3. Chính sách Hủy & Hoàn tiền',
      content: 'Việc hủy lịch nên được thực hiện trước 2 giờ so với giờ hẹn. Tiền cọc (nếu có) sẽ được hoàn trả vào tài khoản ví REETRO trong trường hợp hủy lịch đúng quy định. Hủy lịch muộn có thể bị mất tiền cọc.',
    },
    {
      icon: FileText,
      title: '4. Trách nhiệm Khách hàng',
      content: 'Khách hàng cam kết cung cấp thông tin chính xác khi đặt lịch. Mọi hành vi cố tình đặt lịch ảo hoặc gây rối tại salon sẽ bị từ chối phục vụ và khóa tài khoản vĩnh viễn.',
    },
    {
      icon: AlertCircle,
      title: '5. Thay đổi Điều khoản',
      content: 'REETRO BARBER có quyền cập nhật các điều khoản dịch vụ này bất kỳ lúc nào để phù hợp với tình hình thực tế. Chúng tôi sẽ thông báo cho khách hàng qua email hoặc ứng dụng khi có thay đổi quan trọng.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      
      <main className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold text-[#C8A97E] uppercase tracking-[0.4em] mb-4 block">QUY ĐỊNH CHUNG</span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#2C1E12] tracking-tight mb-6 italic font-heading">
            Điều Khoản <span className="text-[#C8A97E]">Sử Dụng</span>
          </h1>
          <p className="text-[#8B7355] text-sm font-medium max-w-2xl mx-auto leading-relaxed">
            Việc sử dụng dịch vụ của REETRO BARBER đồng nghĩa với việc bạn đồng ý với các điều khoản dưới đây. Chúng tôi luôn mong muốn mang lại trải nghiệm tốt nhất cho mọi quý ông.
          </p>
        </div>

        <div className="grid gap-6">
          {terms.map((term, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl border border-[#E8E0D4] shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-[#2C1E12] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#C8A97E] transition-colors duration-500">
                  <term.icon className="w-6 h-6 text-[#C8A97E] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2C1E12] mb-3">{term.title}</h2>
                  <p className="text-[#5C4A32] leading-relaxed text-sm font-medium opacity-80">
                    {term.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-[#E8E0D4] pt-12 text-center">
          <p className="text-[#8B7355] text-xs font-bold uppercase tracking-widest mb-4">CẬP NHẬT LẦN CUỐI: THÁNG 3, 2024</p>
          <div className="flex justify-center gap-8">
            <a href="tel:1900272730" className="text-sm font-bold text-[#2C1E12] hover:text-[#C8A97E] transition-colors">HOTLINE: 1900.27.27.30</a>
            <a href="mailto:support@reetro.vn" className="text-sm font-bold text-[#2C1E12] hover:text-[#C8A97E] transition-colors">SUPPORT@REETRO.VN</a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
