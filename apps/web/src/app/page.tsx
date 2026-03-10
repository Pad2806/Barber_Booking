import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Users, Shield, Star, MapPin, ArrowRight } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';

// Mock data
const services = [
  {
    id: 1,
    name: 'Cắt tóc nam',
    price: '80.000đ',
    duration: '30 phút',
    image:
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'Uốn tóc Hàn Quốc',
    price: '350.000đ',
    duration: '90 phút',
    image:
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Nhuộm tóc',
    price: '300.000đ',
    duration: '60 phút',
    image:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&fit=crop&q=80',
  },
  {
    id: 4,
    name: 'Gội massage',
    price: '50.000đ',
    duration: '20 phút',
    image:
      'https://images.unsplash.com/photo-1512690199101-83ca6490c370?w=800&h=600&fit=crop&q=80',
  },
  {
    id: 5,
    name: 'Combo VIP',
    price: '200.000đ',
    duration: '60 phút',
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop&q=80',
  },
  {
    id: 6,
    name: 'Cạo mặt',
    price: '70.000đ',
    duration: '25 phút',
    image:
      'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800&h=600&fit=crop&q=80',
  },
];

const salons = [
  {
    id: 1,
    name: 'Reetro Quận 1',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    rating: 4.9,
    reviews: 1250,
    image:
      'https://images.unsplash.com/photo-1592647420148-bfcc1a004eb7?w=800&h=600&fit=crop&q=80',
  },
  {
    id: 2,
    name: 'Reetro Quận 3',
    address: '456 Võ Văn Tần, Quận 3, TP.HCM',
    rating: 4.8,
    reviews: 980,
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Reetro Quận 7',
    address: '789 Nguyễn Thị Thập, Quận 7, TP.HCM',
    rating: 4.9,
    reviews: 850,
    image:
      'https://images.unsplash.com/photo-1512690199101-83ca6490c370?w=800&h=600&fit=crop&q=80',
  },
];

const features = [
  {
    icon: Calendar,
    title: 'Đặt lịch nhanh chóng',
    description: 'Chỉ 30 giây để hoàn tất đặt lịch online',
  },
  {
    icon: Clock,
    title: 'Không chờ đợi',
    description: 'Đến đúng giờ hẹn, được phục vụ ngay',
  },
  {
    icon: Users,
    title: 'Stylist chuyên nghiệp',
    description: 'Đội ngũ được đào tạo bài bản, kinh nghiệm tại REETRO.',
  },
  {
    icon: Shield,
    title: 'Cam kết chất lượng',
    description: 'Bảo hành 7 ngày, hoàn tiền nếu không hài lòng',
  },
];

export default function HomePage(): React.ReactNode {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Clean Light */}
      <section className="bg-[#FAF8F5] py-20 md:py-28 overflow-hidden relative border-b border-[#E8E0D4]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0 grayscale bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000&auto=format')] bg-cover bg-center" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
             <span className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-4 block">THÀNH LẬP NĂM 2024</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-none text-[#2C1E12]">
              REETRO<br />
              <span className="text-[#C8A97E]">BARBER</span>
            </h1>
            <p className="text-base md:text-lg text-[#5C4A32] mb-8 max-w-2xl mx-auto font-medium">
              Hệ thống salon tóc nam chuyên nghiệp hàng đầu Việt Nam. <br />
              Nơi định hình <span className="text-[#C8A97E] font-bold">PHONG CÁCH QUÝ TỘC</span> của bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/booking"
                className="bg-[#C8A97E] text-white hover:bg-[#B8975E] px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 active:scale-95"
              >
                Đặt Lịch Hẹn
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/salons"
                className="bg-white hover:bg-[#F0EBE3] text-[#2C1E12] border border-[#E8E0D4] px-8 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
              >
                Tìm Salon Gần Nhất
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16 pt-12 border-t border-[#E8E0D4]">
              <div className="text-center group">
                <div className="text-3xl font-bold text-[#2C1E12] mb-1 transition-transform group-hover:scale-105">100+</div>
                <div className="text-xs font-bold text-[#8B7355] uppercase">Salons</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-[#2C1E12] mb-1 transition-transform group-hover:scale-105">500K</div>
                <div className="text-xs font-bold text-[#8B7355] uppercase">Khách hàng</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-[#2C1E12] mb-1 transition-transform group-hover:scale-105">4.9</div>
                <div className="text-xs font-bold text-[#8B7355] uppercase">Đánh giá</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-[#2C1E12] mb-1 transition-transform group-hover:scale-105">1000+</div>
                <div className="text-xs font-bold text-[#8B7355] uppercase">Stylists</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - White clean layout */}
      <section className="py-20 md:py-24 bg-white border-b border-[#E8E0D4]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2 block">CHẤT LƯỢNG HÀNG ĐẦU</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C1E12] tracking-tight">
              Tại sao chọn REETRO?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-[#F0EBE3] rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 group-hover:bg-[#C8A97E] group-hover:scale-110">
                  <feature.icon className="w-7 h-7 text-[#8B7355] transition-colors group-hover:text-white" />
                </div>
                <h3 className="font-bold text-base text-[#2C1E12] mb-2">{feature.title}</h3>
                <p className="text-[#5C4A32] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services - Minimalist cards */}
      <section className="py-20 md:py-24 bg-[#FAF8F5]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="max-w-xl text-left">
               <span className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2 block">DỊCH VỤ</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C1E12] tracking-tight">
                Dịch vụ thượng hạng
              </h2>
            </div>
            <Link
              href="/salons"
              className="flex items-center gap-2 text-[#C8A97E] hover:text-[#B8975E] transition-colors font-bold text-sm"
            >
              Hiển thị tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(service => (
              <div
                key={service.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E8E0D4] hover:shadow-md transition-all"
              >
                <div className="relative h-64">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2C1E12]/80 to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                    <div className="flex items-center gap-3 text-sm font-semibold text-white">
                      <span className="bg-[#C8A97E] text-white px-2.5 py-1 rounded-md">{service.price}</span>
                      <span className="flex items-center gap-1.5 opacity-90">
                        <Clock className="w-4 h-4" />
                        {service.duration}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <Link
                    href="/booking"
                    className="block w-full bg-[#F0EBE3] text-[#2C1E12] text-center py-3 rounded-xl font-bold text-sm transition-colors hover:bg-[#C8A97E] hover:text-white"
                  >
                    Chọn Dịch Vụ
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Salons - Clean cards */}
      <section className="py-20 md:py-24 bg-white border-y border-[#E8E0D4]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="max-w-xl text-left">
               <span className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2 block">CHI NHÁNH</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C1E12] tracking-tight">
                Hệ thống REETRO
              </h2>
            </div>
            <Link
              href="/salons"
              className="flex items-center gap-2 text-[#C8A97E] hover:text-[#B8975E] transition-colors font-bold text-sm"
            >
               Xem tất cả địa điểm
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {salons.map(salon => (
              <Link
                key={salon.id}
                href={`/salons/${salon.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#E8E0D4] flex flex-col"
              >
                <div className="relative h-56">
                  <Image
                    src={salon.image}
                    alt={salon.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#2C1E12]/60 to-transparent" />
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-[#2C1E12] group-hover:text-[#C8A97E] transition-colors mb-2">
                    {salon.name}
                  </h3>
                  <p className="text-sm font-medium text-[#5C4A32] flex items-start gap-2 mb-6 flex-grow">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#C8A97E]" />
                    {salon.address}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#E8E0D4]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1 bg-[#F0EBE3] text-[#8B7355] px-2.5 py-1 rounded-md font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#C8A97E] text-[#C8A97E]" />
                        <span className="text-xs">{salon.rating}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#8B7355]">({salon.reviews} đánh giá)</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Light & Clean */}
      <section className="py-20 md:py-24 bg-[#E8E0D4]/30 relative overflow-hidden border-t border-[#E8E0D4] z-10">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2000&auto=format')] bg-cover grayscale" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-20">
          <div className="max-w-4xl mx-auto">
            <span className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-4 block">ĐẶT LỊCH NGAY</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-[#2C1E12]">
               BẠN ĐÃ SẴN SÀNG ĐỂ<br />
               <span className="text-[#C8A97E]">TRỞ NÊN KHÁC BIỆT?</span>
            </h2>
            <p className="text-base text-[#5C4A32] mb-10 max-w-2xl mx-auto font-medium">
               Đặt lịch ngay hôm nay để trải nghiệm dịch vụ cắt tóc thượng lưu và nhận ưu đãi <span className="text-[#C8A97E] font-bold mt-1 inline-block">20% CHO KHÁCH MỚI.</span>
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-2 bg-[#2C1E12] text-white hover:bg-[#C8A97E] px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-sm group active:scale-95"
            >
              Đặt lịch cắt tóc
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
