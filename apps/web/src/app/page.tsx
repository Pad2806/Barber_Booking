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
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Minimalist Bold */}
      <section className="bg-foreground py-24 md:py-32 overflow-hidden relative border-b border-primary/20">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute inset-0 grayscale bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000&auto=format')] bg-cover bg-center mix-blend-overlay" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center text-white">
             <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 block">ESTABLISHED 2024</span>
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 tracking-tight leading-none uppercase text-background">
              REETRO<br />
              <span className="text-primary bg-background/5 px-2 inline-block">BARBER</span>
            </h1>
            <p className="text-lg md:text-xl text-background/60 mb-10 max-w-2xl mx-auto font-medium tracking-tight">
              Hệ thống salon tóc nam chuyên nghiệp hàng đầu Việt Nam. <br />
              Nơi định hình <span className="text-primary font-bold">PHONG CÁCH QUÝ TỘC</span> của bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/booking"
                className="bg-primary text-foreground hover:bg-background border-2 border-primary px-12 py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 shadow-2xl shadow-primary/10 flex items-center gap-3 active:scale-95"
              >
                BOOK APPOINTMENT
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/salons"
                className="bg-transparent hover:bg-background/10 text-background border-2 border-background/20 px-12 py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 flex items-center gap-3 active:scale-95"
              >
                LOCATE SALONS
              </Link>
            </div>

            {/* Stats - Monochrome contrast */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-background/10">
              <div className="text-center group">
                <div className="text-4xl font-heading font-bold text-primary mb-1 tracking-tight transition-transform group-hover:scale-105 duration-500">100+</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-background/40">SALONS</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-heading font-bold text-primary mb-1 tracking-tight transition-transform group-hover:scale-105 duration-500">500K</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-background/40">CLIENTS</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-heading font-bold text-primary mb-1 tracking-tight transition-transform group-hover:scale-105 duration-500">4.9</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-background/40">RATING</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-heading font-bold text-primary mb-1 tracking-tight transition-transform group-hover:scale-105 duration-500">1000+</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-background/40">STYLISTS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - White clean layout */}
      <section className="py-32 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block italic">EXCELLENCE</span>
            <h2 className="text-5xl font-heading font-black text-foreground tracking-tighter uppercase italic">
              Tại sao chọn REETRO?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-background rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-border transition-all duration-700 group-hover:bg-primary group-hover:border-primary group-hover:rounded-full group-hover:shadow-2xl group-hover:shadow-primary/20">
                  <feature.icon className="w-8 h-8 text-foreground transition-all duration-700 group-hover:text-background" />
                </div>
                <h3 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-foreground mb-4 italic">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed tracking-tight italic font-light">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services - Minimalist Monochrome cards */}
      <section className="py-32 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-xl text-left">
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block">COLLECTIONS</span>
              <h2 className="text-5xl font-heading font-black text-foreground tracking-tighter uppercase italic leading-none">
                Dịch vụ thượng hạng
              </h2>
            </div>
            <Link
              href="/salons"
              className="flex items-center gap-4 text-foreground hover:translate-x-2 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.3em] font-heading"
            >
              EXPLORE ALL SERVICES
              <ArrowRight className="w-5 h-5 px-1 py-1 bg-primary text-foreground rounded-full" />
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
                    className="block w-full bg-foreground text-background text-center py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 hover:bg-primary hover:text-foreground shadow-xl shadow-foreground/10 active:scale-95 italic font-heading"
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
      <section className="py-32 bg-background border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="max-w-xl text-left">
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block">LOCATIONS</span>
              <h2 className="text-5xl font-heading font-black text-foreground tracking-tighter uppercase italic leading-none">
                Hệ thống REETRO
              </h2>
            </div>
            <Link
              href="/salons"
              className="flex items-center gap-4 text-foreground hover:translate-x-2 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.3em] font-heading"
            >
               VIEW ALL LOCATIONS
              <ArrowRight className="w-5 h-5 px-1 py-1 bg-primary text-foreground rounded-full" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {salons.map(salon => (
              <Link
                key={salon.id}
                href={`/salons/${salon.id}`}
                className="group bg-background rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:shadow-foreground/5 transition-all duration-700 border border-border"
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
                  <h3 className="text-2xl font-heading font-black text-foreground group-hover:text-primary transition-colors mb-4 uppercase tracking-tighter italic">
                    {salon.name}
                  </h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-start gap-3 mb-6 leading-relaxed italic">
                    <MapPin className="w-4 h-4 mt-[-2px] flex-shrink-0 text-primary" />
                    {salon.address}
                  </p>
                    <div className="flex items-center justify-between pt-6 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-primary text-background px-2 py-0.5 rounded-sm font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] uppercase">{salon.rating}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">({salon.reviews} REVIEWS)</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Deep Vintage Lounge */}
      <section className="py-32 bg-accent relative overflow-hidden border-t border-primary/10">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2000&auto=format')] bg-cover grayscale" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto text-white">
            <span className="text-[10px] font-bold text-background/40 uppercase tracking-[0.3em] mb-6 block">RESERVE YOUR TIME</span>
            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-10 tracking-tight uppercase leading-none text-background">
               BẠN ĐÃ SẴN SÀNG ĐỂ<br />
               <span className="text-primary bg-background/5 px-4 inline-block">TRỞ NÊN KHÁC BIỆT?</span>
            </h2>
            <p className="text-lg text-background/60 mb-12 tracking-tight max-w-2xl mx-auto font-medium">
               Đặt lịch ngay hôm nay để trải nghiệm dịch vụ cắt tóc thượng lưu và nhận ưu đãi <span className="text-primary font-bold">WHITELIST 20%</span>.
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-4 bg-primary text-background hover:bg-background hover:text-foreground border-2 border-primary px-12 py-4 rounded-full font-bold text-xs uppercase tracking-[0.2em] transition-all duration-700 shadow-xl shadow-primary/10 group active:scale-95"
            >
              BOOK NOW
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
