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
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop&q=80&auto=format',
  },
  {
    id: 2,
    name: 'Uốn tóc Hàn Quốc',
    price: '350.000đ',
    duration: '90 phút',
    image:
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop&q=80&auto=format',
  },
  {
    id: 3,
    name: 'Nhuộm tóc',
    price: '300.000đ',
    duration: '60 phút',
    image:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&q=80&auto=format',
  },
  {
    id: 4,
    name: 'Gội massage',
    price: '50.000đ',
    duration: '20 phút',
    image:
      'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=300&fit=crop&q=80&auto=format',
  },
  {
    id: 5,
    name: 'Combo VIP',
    price: '200.000đ',
    duration: '60 phút',
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop&q=80&auto=format',
  },
  {
    id: 6,
    name: 'Cạo mặt',
    price: '70.000đ',
    duration: '25 phút',
    image:
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop&q=80&auto=format',
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
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=300&fit=crop&q=80&auto=format',
  },
  {
    id: 2,
    name: 'Reetro Quận 3',
    address: '456 Võ Văn Tần, Quận 3, TP.HCM',
    rating: 4.8,
    reviews: 980,
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop&q=80&auto=format',
  },
  {
    id: 3,
    name: 'Reetro Quận 7',
    address: '789 Nguyễn Thị Thập, Quận 7, TP.HCM',
    rating: 4.9,
    reviews: 850,
    image:
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop&q=80&auto=format',
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Minimalist Bold */}
      <section className="bg-black py-32 md:py-48 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 grayscale bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000&auto=format')] bg-cover bg-center mix-blend-overlay" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center text-white">
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-6 block">ESTABLISHED 2024</span>
            <h1 className="text-6xl md:text-9xl font-heading font-black mb-8 tracking-tighter leading-none uppercase italic">
              REETRO<br />
              <span className="text-white bg-white/10 px-4 inline-block">BARBER</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-light tracking-tight">
              Hệ thống salon tóc nam chuyên nghiệp hàng đầu Việt Nam. <br />
              Nơi định hình <span className="text-white font-black italic">PHONG CÁCH QUÝ TỘC</span> của bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/booking"
                className="bg-white text-black hover:bg-black hover:text-white border-2 border-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 shadow-2xl shadow-white/10 flex items-center gap-3 active:scale-95"
              >
                BOOK APPOINTMENT
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/salons"
                className="bg-transparent hover:bg-white/10 text-white border-2 border-white/20 px-12 py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 flex items-center gap-3 active:scale-95"
              >
                LOCATE SALONS
              </Link>
            </div>

            {/* Stats - Monochrome contrast */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-24 pt-24 border-t border-white/10">
              <div className="text-center group">
                <div className="text-5xl font-black text-white mb-2 tracking-tighter transition-transform group-hover:scale-110 duration-500">100+</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">SALONS</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-black text-white mb-2 tracking-tighter transition-transform group-hover:scale-110 duration-500">500K</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">CLIENTS</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-black text-white mb-2 tracking-tighter transition-transform group-hover:scale-110 duration-500">4.9</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">RATING</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-black text-white mb-2 tracking-tighter transition-transform group-hover:scale-110 duration-500">1000+</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">STYLISTS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - White clean layout */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 block">EXCELLENCE</span>
            <h2 className="text-5xl font-heading font-black text-gray-900 tracking-tighter uppercase italic">
              Tại sao chọn REETRO?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-gray-100 transition-all duration-700 group-hover:bg-black group-hover:border-black group-hover:rounded-full">
                  <feature.icon className="w-8 h-8 text-black transition-all duration-700 group-hover:text-white" />
                </div>
                <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed tracking-tight">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services - Minimalist Monochrome cards */}
      <section className="py-32 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 block text-left">COLLECTIONS</span>
              <h2 className="text-5xl font-heading font-black text-gray-900 tracking-tighter uppercase italic">
                Dịch vụ thượng hạng
              </h2>
            </div>
            <Link
              href="/services"
              className="flex items-center gap-4 text-black hover:translate-x-2 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.3em]"
            >
              EXPLORE ALL SERVICES
              <ArrowRight className="w-5 h-5 px-1 py-1 bg-black text-white rounded-full" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {services.map(service => (
              <div
                key={service.id}
                className="group bg-white rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-2xl hover:shadow-black/5 transition-all duration-700"
              >
                <div className="relative h-72">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute bottom-6 left-8 right-8">
                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">{service.name}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-white tracking-[0.2em]">
                      <span className="bg-white text-black px-3 py-1 rounded-sm">{service.price}</span>
                      <span className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {service.duration}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <Link
                    href="/booking"
                    className="block w-full bg-black text-white text-center py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 hover:bg-gray-900 shadow-xl shadow-black/10 active:scale-95"
                  >
                    SELECT SERVICE
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Salons - High contrast clean cards */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-xl">
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 block text-left">LOCATIONS</span>
              <h2 className="text-5xl font-heading font-black text-gray-900 tracking-tighter uppercase italic">
                Hệ thống REETRO
              </h2>
            </div>
            <Link
              href="/salons"
              className="flex items-center gap-4 text-black hover:translate-x-2 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.3em]"
            >
               VIEW ALL LOCATIONS
              <ArrowRight className="w-5 h-5 px-1 py-1 bg-black text-white rounded-full" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {salons.map(salon => (
              <Link
                key={salon.id}
                href={`/salons/${salon.id}`}
                className="group bg-white rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:shadow-black/5 transition-all duration-700 border border-gray-100"
              >
                <div className="relative h-64">
                  <Image
                    src={salon.image}
                    alt={salon.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black text-gray-900 group-hover:text-black transition-colors mb-4 uppercase tracking-tighter italic">
                    {salon.name}
                  </h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-start gap-3 mb-6 leading-relaxed">
                    <MapPin className="w-4 h-4 mt-[-2px] flex-shrink-0 text-black" />
                    {salon.address}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-black text-white px-2 py-1 rounded-sm">
                        <Star className="w-3 h-3 fill-white" />
                        <span className="text-[10px] font-black">{salon.rating}</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight italic">({salon.reviews} REVIEWS)</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Bold High Contrast */}
      <section className="py-48 bg-black relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2000&auto=format')] bg-cover grayscale" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto text-white">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-8 block">RESERVE YOUR TIME</span>
            <h2 className="text-5xl md:text-8xl font-heading font-black mb-12 tracking-tighter uppercase italic leading-none">
               BẠN ĐÃ SẴN SÀNG ĐỂ<br />
               <span className="bg-white text-black px-6 py-2 inline-block">TRỞ NÊN KHÁC BIỆT?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-16 tracking-tight max-w-2xl mx-auto">
               Đặt lịch ngay hôm nay để trải nghiệm dịch vụ cắt tóc thượng lưu và nhận ưu đãi <span className="text-white font-black italic">WHITELIST 20%</span>.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-6 bg-white text-black hover:bg-black hover:text-white border-2 border-white px-16 py-6 rounded-full font-black text-sm uppercase tracking-[0.4em] transition-all duration-700 shadow-2xl shadow-white/10 group active:scale-95"
            >
              BOOK NOW
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
