import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Users, Shield, Star, MapPin, ChevronRight, Scissors } from 'lucide-react';
import Header from '@/components/header';

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
    description: 'Đội ngũ được đào tạo bài bản, kinh nghiệm',
  },
  {
    icon: Shield,
    title: 'Cam kết chất lượng',
    description: 'Bảo hành 7 ngày, hoàn tiền nếu không hài lòng',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              Phong cách của bạn,
              <br />
              <span className="text-accent">Đẳng cấp</span> của chúng tôi
            </h1>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Hệ thống salon tóc nam chuyên nghiệp hàng đầu Việt Nam với 100+ chi nhánh. Đặt lịch dễ
              dàng, phục vụ tận tâm.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/booking"
                className="bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors inline-flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Đặt lịch ngay
              </Link>
              <Link
                href="/salons"
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors inline-flex items-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                Tìm salon
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">100+</div>
                <div className="text-white/80">Chi nhánh</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">500K+</div>
                <div className="text-white/80">Khách hàng</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">4.9</div>
                <div className="text-white/80">Đánh giá</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">1000+</div>
                <div className="text-white/80">Stylist</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center text-gray-900 mb-12">
            Tại sao chọn chúng tôi?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                Dịch vụ của chúng tôi
              </h2>
              <p className="text-gray-600">Trải nghiệm dịch vụ chất lượng cao</p>
            </div>
            <Link
              href="/services"
              className="hidden md:flex items-center gap-2 text-accent hover:text-accent/80 font-medium"
            >
              Xem tất cả
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <div
                key={service.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative h-48">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-semibold text-white mb-1">{service.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-white/90">
                      <span className="font-semibold text-accent">{service.price}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <Link
                    href="/booking"
                    className="block w-full bg-accent/10 hover:bg-accent hover:text-white text-accent text-center py-2.5 rounded-xl font-medium transition-all"
                  >
                    Đặt lịch
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Salons */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                Hệ thống salon của chúng tôi
              </h2>
              <p className="text-gray-600">Tìm salon gần bạn nhất</p>
            </div>
            <Link
              href="/salons"
              className="hidden md:flex items-center gap-2 text-accent hover:text-accent/80 font-medium"
            >
              Xem tất cả
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {salons.map(salon => (
              <Link
                key={salon.id}
                href={`/salons/${salon.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100"
              >
                <div className="relative h-48">
                  <Image
                    src={salon.image}
                    alt={salon.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-accent transition-colors mb-2">
                    {salon.name}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-start gap-2 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                    {salon.address}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{salon.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">({salon.reviews} đánh giá)</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto text-white">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Sẵn sàng đổi mới phong cách?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Đặt lịch ngay hôm nay và nhận ưu đãi 20% cho lần đầu tiên
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Đặt lịch ngay
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-heading font-bold text-xl mb-4">
                Reetro<span className="text-accent">BarberShop</span>
              </h3>
              <p className="text-white/70 text-sm">
                Hệ thống salon tóc nam chuyên nghiệp hàng đầu Việt Nam
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Về chúng tôi</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    Giới thiệu
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white transition-colors">
                    Tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link href="/franchise" className="hover:text-white transition-colors">
                    Nhượng quyền
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Dịch vụ</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <Link href="/services" className="hover:text-white transition-colors">
                    Cắt tóc
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-white transition-colors">
                    Uốn/Nhuộm
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-white transition-colors">
                    Combo VIP
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Hotline: 1900.27.27.30</li>
                <li>Email: contact@reetro.vn</li>
                <li>Giờ phục vụ: 8h30 - 20h30</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/60">© 2024 ReetroBarberShop. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-sm text-white/60 hover:text-white">
                Chính sách bảo mật
              </Link>
              <Link href="/terms" className="text-sm text-white/60 hover:text-white">
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
