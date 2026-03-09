'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Clock, Search, ArrowRight } from 'lucide-react';
import { salonApi, Salon } from '@/lib/api';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function SalonsPage() {
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero / Search Section - Monochrome High Contrast */}
      <div className="bg-black py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-6 block">LOCATIONS</span>
          <h1 className="text-5xl md:text-7xl font-heading font-black text-white mb-12 tracking-tighter uppercase italic">
            Tìm Salon của bạn
          </h1>
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors group-hover:text-white" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="NHẬP TÊN HOẶC ĐỊA CHỈ..."
                className="w-full pl-16 pr-8 py-5 bg-white/5 border-2 border-transparent rounded-full focus:outline-none focus:border-white focus:bg-white/10 text-white font-black text-sm tracking-widest transition-all placeholder:text-gray-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-white text-black hover:bg-black hover:text-white border-2 border-white px-10 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl shadow-white/10 active:scale-95"
            >
              TÌM KIẾM
            </button>
          </div>
        </div>
      </div>

      {/* Salon List */}
      <div className="container mx-auto px-4 py-32">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-[40px] overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-64 bg-gray-50" />
                <div className="p-8 space-y-6">
                  <div className="h-8 bg-gray-50 rounded-lg w-3/4" />
                  <div className="h-4 bg-gray-50 rounded-lg w-full" />
                  <div className="h-4 bg-gray-50 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-48">
             <span className="text-8xl block mb-12 opacity-20 grayscale">🏪</span>
            <h2 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter italic">Không tìm thấy salon</h2>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">THỬ TÌM KIẾM VỚI TỪ KHÓA KHÁC</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {salons.map(salon => (
              <Link
                key={salon.id}
                href={`/salons/${salon.slug}`}
                className="group bg-white rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:shadow-black/5 transition-all duration-700 border border-gray-100"
              >
                <div className="relative h-72">
                  <div className="absolute inset-0 bg-gray-50">
                    {salon.coverImage && (
                      <Image
                        src={salon.coverImage}
                        alt={salon.name}
                        fill
                        className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  {salon.logo && (
                    <div className="absolute bottom-6 left-8 w-16 h-16 rounded-[20px] overflow-hidden border-2 border-white shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-700">
                      <Image src={salon.logo} alt={salon.name} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                    </div>
                  )}
                </div>
                <div className="p-8 pb-10">
                  <h3 className="text-2xl font-black text-gray-900 transition-colors uppercase tracking-tighter italic mb-4">
                    {salon.name}
                  </h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-start gap-3 mb-8 leading-relaxed">
                    <MapPin className="w-4 h-4 mt-[-2px] flex-shrink-0 text-black" />
                    {salon.address}, {salon.district}, {salon.city}
                  </p>
                  <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-sm">
                        <Star className="w-3 h-3 fill-white" />
                        <span className="text-[10px] font-black">
                          {salon.rating?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight italic">({salon.totalReviews || 0} REVIEWS)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tight italic bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                      <Clock className="w-3 h-3" />
                      {salon.openTime} - {salon.closeTime}
                    </div>
                  </div>
                  
                  <div className="mt-8">
                     <div className="bg-black text-white py-4 rounded-full text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700 flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-black/20">
                        VIEW SALON DETAILS
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
