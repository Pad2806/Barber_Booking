'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Clock, Search, ArrowRight } from 'lucide-react';
import { salonApi, Salon } from '@/lib/api';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function SalonsPage(): React.ReactNode {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSalons = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const response = await salonApi.getAll(query ? { search: query } : undefined);
      setSalons(response.data);
    } catch (error) {
      console.error('Failed to fetch salons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSalons();
  }, [fetchSalons]);

  const handleSearch = () => {
    void fetchSalons(search);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="bg-foreground py-16 md:py-20 relative overflow-hidden border-b border-primary/20">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2000&auto=format')] bg-cover bg-center grayscale mix-blend-overlay" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
           <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-4 block">LOCATIONS</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 tracking-tight uppercase leading-none">
            Tìm Salon của bạn
          </h1>
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-colors group-hover:text-white" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="NHẬP TÊN HOẶC ĐỊA CHỈ..."
                className="w-full pl-14 pr-8 py-4 bg-background/5 border-2 border-background/10 rounded-full focus:outline-none focus:border-primary focus:bg-background/10 text-background font-bold text-sm tracking-tight transition-all placeholder:text-background/40"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-primary text-background hover:bg-background hover:text-foreground border-2 border-primary px-10 py-4 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all duration-500 shadow-xl shadow-primary/10 active:scale-95"
            >
              TÌM KIẾM
            </button>
          </div>
        </div>
      </div>

      {/* Salon List */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-background rounded-[40px] overflow-hidden border border-border animate-pulse">
                <div className="h-64 bg-accent/5" />
                <div className="p-8 space-y-6">
                  <div className="h-8 bg-accent/5 rounded-lg w-3/4" />
                  <div className="h-4 bg-accent/5 rounded-lg w-full" />
                  <div className="h-4 bg-accent/5 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-48">
             <span className="text-8xl block mb-12 opacity-20 grayscale">🏪</span>
            <h2 className="text-3xl font-bold text-[#2C1E12] mb-4 uppercase tracking-tight">Không tìm thấy salon</h2>
            <p className="text-muted-foreground font-bold text-[11px] uppercase tracking-wider">THỬ TÌM KIẾM VỚI TỪ KHÓA KHÁC</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {salons.map(salon => (
              <Link
                key={salon.id}
                href={`/salons/${salon.slug}`}
                className="group bg-background rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:shadow-foreground/5 transition-all duration-700 border border-border"
              >
                <div className="relative h-72">
                  <div className="absolute inset-0 bg-gray-50">
                    {salon.coverImage && (
                        <Image
                          src={salon.coverImage}
                          alt={`${salon.name} - Ảnh đại diện chi nhánh`}
                          fill
                          className="object-cover transition-all duration-700 group-hover:scale-110"
                        />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  {salon.logo && (
                    <div className="absolute bottom-6 left-8 w-16 h-16 rounded-[20px] overflow-hidden border-2 border-white shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-700">
                      <Image src={salon.logo} alt={`${salon.name} - Logo`} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                    </div>
                  )}
                </div>
                  <div className="p-6 pb-8">
                    <h3 className="text-xl font-bold text-[#2C1E12] group-hover:text-[#C8A97E] transition-colors uppercase tracking-tight mb-3 text-left">
                      {salon.name}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-start gap-2 mb-6 leading-relaxed text-left">
                      <MapPin className="w-3.5 h-3.5 mt-[1px] flex-shrink-0 text-primary" />
                      {salon.address}, {salon.district}, {salon.city}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-border">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-primary text-background px-2.5 py-0.5 rounded-sm">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-[10px] font-bold">
                            {salon.rating?.toFixed(1) || '5.0'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">({salon.totalReviews || 0} REVIEWS)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-tight bg-accent/5 px-2.5 py-1.5 rounded-full border border-border">
                        <Clock className="w-3 h-3" />
                        {salon.openTime} - {salon.closeTime}
                      </div>
                    </div>
                    
                    <div className="mt-8">
                       <div className="bg-[#2C1E12] text-white py-4 rounded-2xl text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-100 md:opacity-0 md:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-[#2C1E12]/10">
                          XEM CHI TIẾT SALON
                          <ArrowRight className="w-4 h-4" />
                       </div>
                    </div>
                  </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
