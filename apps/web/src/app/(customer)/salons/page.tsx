'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Clock, Search } from 'lucide-react';
import { salonApi, Salon } from '@/lib/api';
import Header from '@/components/header';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Search */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-heading font-bold text-white text-center mb-8">
            Tìm Salon gần bạn
          </h1>
          <div className="max-w-2xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm theo tên hoặc địa chỉ..."
                className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-accent hover:bg-accent/90 text-white px-8 rounded-xl font-medium transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Salon List */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Không tìm thấy salon</h2>
            <p className="text-gray-500">Thử tìm kiếm với từ khóa khác</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salons.map(salon => (
              <Link
                key={salon.id}
                href={`/salons/${salon.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative h-48">
                  <div className="absolute inset-0 bg-gray-100">
                    {salon.coverImage && (
                      <Image
                        src={salon.coverImage}
                        alt={salon.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {salon.logo && (
                    <div className="absolute bottom-4 left-4 w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                      <Image src={salon.logo} alt={salon.name} fill className="object-cover" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-800 group-hover:text-accent transition-colors">
                    {salon.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 flex items-start gap-1">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {salon.address}, {salon.district}, {salon.city}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">
                          {salon.rating?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">({salon.totalReviews || 0})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Clock className="w-4 h-4" />
                      {salon.openTime} - {salon.closeTime}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
