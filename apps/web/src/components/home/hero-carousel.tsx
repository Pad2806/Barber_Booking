'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    image:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000&auto=format',
    titleLine1: 'REETRO',
    titleLine2: 'BARBER',
    subtitle: 'Nơi định hình PHONG CÁCH QUÝ TỘC của bạn.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=2000&auto=format',
    titleLine1: 'DỊCH VỤ',
    titleLine2: 'THƯỢNG HẠNG',
    subtitle: 'Trải nghiệm không gian cắt tóc đẳng cấp và tinh tế.',
  },
  {
    image:
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=2000&auto=format',
    titleLine1: 'STYLIST',
    titleLine2: 'CHUYÊN NGHIỆP',
    subtitle: 'Đội ngũ chuyên gia giàu kinh nghiệm sẵn sàng phục vụ.',
  },
];

export function HeroCarousel(): React.ReactElement {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <section className="relative h-[70vh] sm:h-[80vh] min-h-[500px] sm:min-h-[600px] w-full overflow-hidden bg-[#2C1E12] flex items-center justify-center border-b border-[#E8E0D4]">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform ease-linear"
            style={{
              backgroundImage: `url('${slide.image}')`,
              transform: index === currentSlide ? 'scale(1.05)' : 'scale(1)',
              transitionDuration: '10000ms',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2C1E12]/90 via-[#2C1E12]/60 to-transparent sm:via-[#2C1E12]/70" />
          <div className="absolute inset-0 bg-[#C8A97E]/10 mix-blend-overlay" />
        </div>
      ))}

      {/* Content */}
      <div className="container mx-auto px-6 relative z-20">
        <div className="max-w-3xl">
          <span className="text-[10px] sm:text-xs font-bold text-[#C8A97E] uppercase tracking-[0.2em] mb-3 sm:mb-4 block" style={{ animation: 'fadeInUp 1s ease-out' }}>
            THÀNH LẬP NĂM 2024
          </span>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-4 sm:mb-6 tracking-tight leading-[1.1] sm:leading-none text-white drop-shadow-md">
            {slides[currentSlide].titleLine1}<br />
            <span className="text-[#C8A97E]">{slides[currentSlide].titleLine2}</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-[#F0EBE3] mb-8 sm:mb-10 max-w-xl font-medium leading-relaxed drop-shadow-sm">
            Hệ thống salon chuyên nghiệp hàng đầu Việt Nam. <br className="hidden sm:block" />
            {slides[currentSlide].subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 max-w-xs sm:max-w-none">
            <Link
              href="/booking"
              className="w-full sm:w-auto bg-[#C8A97E] text-white hover:bg-[#B8975E] px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 group"
            >
              Đặt Lịch Hẹn
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/salons"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Tìm Salon
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation & Controls - Hidden on very small screens for cleaner look or adjusted */}
      <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 z-30">
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-500 rounded-full h-1 sm:h-1.5 ${
                  index === currentSlide ? 'w-6 sm:w-8 bg-[#C8A97E]' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex flex-row items-center gap-2">
             <button
                onClick={prevSlide}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
          </div>
        </div>
      </div>
    </section>
  );
}
