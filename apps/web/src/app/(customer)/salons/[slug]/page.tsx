'use client';
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Star, Clock, Phone, Check, Play, ChevronRight, Filter, Calendar, Eye } from 'lucide-react';
import { salonApi, serviceApi, staffApi, reviewApi, Salon, Service, Staff, Review } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, STAFF_POSITIONS, cn, formatDate } from '@/lib/utils';
import ServiceDetailModal from '@/components/ServiceDetailModal';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Avatar from '@/components/Avatar';
import BarberProfileSheet from '@/components/booking/BarberProfileSheet';

export default function SalonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { setSalon, selectedServices, toggleService, isServiceSelected } = useBookingStore();

  const [salon, setSalonData] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewMeta, setReviewMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'staff' | 'reviews' | 'info'>('services');

  const [selectedDetailService, setSelectedDetailService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileStaffId, setProfileStaffId] = useState<string | null>(null);

  // Review filters state
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const salonData = await salonApi.getBySlug(slug);
      setSalonData(salonData);

      const [servicesData, staffData, reviewsData] = await Promise.all([
        serviceApi.getBySalon(salonData.id),
        staffApi.getBySalon(salonData.id),
        reviewApi.getBySalon(salonData.id, { take: 10 }),
      ]);
      setServices(servicesData);
      setStaff(staffData);
      setReviews(reviewsData.data);
      setReviewMeta(reviewsData.meta);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchFilteredReviews = useCallback(async () => {
    if (!salon) return;
    try {
      setLoadingReviews(true);
      const reviewsData = await reviewApi.getBySalon(salon.id, {
        rating: ratingFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        take: 20,
      });
      setReviews(reviewsData.data);
      setReviewMeta(reviewsData.meta);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  }, [salon, ratingFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === 'reviews' && salon) {
      void fetchFilteredReviews();
    }
  }, [activeTab, fetchFilteredReviews, salon]);

  useEffect(() => {
    if (slug) {
      void fetchData();
    }
  }, [slug, fetchData]);

  const handleBooking = () => {
    if (salon) {
      setSalon(salon);
      router.push('/booking');
    }
  };

  const groupedServices = services.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    },
    {} as Record<string, Service[]>
  );

  const totalSelected = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-[#2C1E12]">Không tìm thấy salon</h2>
        <Link href="/salons" className="text-sm font-medium text-[#C8A97E] hover:text-[#B8975E] underline underline-offset-4">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24">
      <Header />

      {/* ─── Hero ─── */}
      <div className="relative h-[280px] md:h-[360px]">
        <div className="absolute inset-0 bg-[#E8E0D4] overflow-hidden">
          {salon.coverImage && (
            <Image src={salon.coverImage} alt={salon.name} fill className="object-cover" priority />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">{salon.name}</h1>
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span className="text-sm">{salon.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Info ─── */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D4] p-5 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C8A97E]/10 rounded-xl flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-[#C8A97E] fill-[#C8A97E]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#2C1E12] leading-tight">{salon.averageRating?.toFixed(1) || '0.0'}</p>
              <p className="text-[11px] text-[#8B7355]">{salon._count?.reviews || 0} đánh giá</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-x border-[#E8E0D4] px-4">
            <div className="w-10 h-10 bg-[#C8A97E]/10 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[#C8A97E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2C1E12]">{salon.openTime} – {salon.closeTime}</p>
              <p className="text-[11px] text-[#8B7355]">Giờ mở cửa</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C8A97E]/10 rounded-xl flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-[#C8A97E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2C1E12]">{salon.phone}</p>
              <p className="text-[11px] text-[#8B7355]">Liên hệ</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="flex gap-1 bg-[#F0EBE3] rounded-xl p-1">
          {[
            { id: 'services', label: 'Dịch vụ' },
            { id: 'staff', label: 'Đội ngũ' },
            { id: 'reviews', label: `Đánh giá (${salon._count?.reviews || 0})` },
            { id: 'info', label: 'Thông tin' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer',
                activeTab === tab.id
                  ? 'bg-white text-[#2C1E12] shadow-sm'
                  : 'text-[#8B7355] hover:text-[#5C4A32]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        <div className="py-6">
          {/* Services */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <div className="w-4 h-[2px] bg-[#C8A97E] rounded-full" />
                    {category}
                  </h3>

                  <div className="space-y-2">
                    {categoryServices.map(service => {
                      const selected = isServiceSelected(service.id);
                      return (
                        <div
                          key={service.id}
                          onClick={() => toggleService(service)}
                          className={cn(
                            'flex items-center gap-4 p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer group',
                            selected
                              ? 'border-[#C8A97E] bg-[#C8A97E]/5 shadow-sm'
                              : 'border-transparent bg-white hover:border-[#E8E0D4] hover:shadow-sm'
                          )}
                        >
                          {/* Image */}
                          <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 bg-[#F0EBE3]">
                            <Image
                              src={service.image || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=400&auto=format'}
                              alt={service.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {service.videoUrl && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-[15px] text-[#2C1E12] leading-tight">{service.name}</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDetailService(service);
                                  setIsModalOpen(true);
                                }}
                                className="text-[11px] text-[#C8A97E] font-medium hover:text-[#B8975E] shrink-0 cursor-pointer"
                              >
                                Chi tiết
                              </button>
                            </div>
                            {service.description && (
                              <p className="text-xs text-[#8B7355] line-clamp-1 mt-0.5">{service.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-sm font-bold text-[#C8A97E]">{formatPrice(service.price)}</span>
                              <span className="text-[11px] text-[#8B7355] bg-[#F0EBE3] px-2 py-0.5 rounded-full">{service.duration} phút</span>
                            </div>
                          </div>

                          {/* Checkbox */}
                          <div className={cn(
                            'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300',
                            selected ? 'bg-[#C8A97E] border-[#C8A97E]' : 'border-[#D4C9BA] group-hover:border-[#C8A97E]'
                          )}>
                            {selected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Staff */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {staff.map(member => (
                <div key={member.id} className="bg-white rounded-2xl p-4 border border-[#E8E0D4] hover:shadow-sm transition-all flex flex-col items-center text-center gap-3">
                  <Avatar
                    src={member.user.avatar}
                    name={member.user.name}
                    size="lg"
                    variant="circle"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-[#2C1E12]">{member.user.name}</h4>
                    <p className="text-[11px] text-[#C8A97E] font-medium mt-0.5">
                      {STAFF_POSITIONS[member.position] || member.position}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-[#C8A97E] fill-[#C8A97E]" />
                      <span className="text-xs font-bold text-[#2C1E12]">{member.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-[#8B7355]">({member.totalReviews})</span>
                    </div>
                  </div>
                  {member.bio && (
                    <p className="text-[11px] text-[#8B7355] line-clamp-2 border-t border-[#E8E0D4] pt-3 w-full">{member.bio}</p>
                  )}
                  <button
                    onClick={() => setProfileStaffId(member.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#C8A97E] hover:text-[#B8975E] transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem hồ sơ
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Distribution & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#E8E0D4] flex flex-col items-center justify-center text-center">
                  <p className="text-5xl font-black text-[#2C1E12] mb-1 font-heading italic">{salon.averageRating?.toFixed(1) || '0.0'}</p>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-5 h-5",
                          s <= Math.round(salon.averageRating || 0) ? "text-[#C8A97E] fill-[#C8A97E]" : "text-[#D4C9BA]"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-[#8B7355]">{salon._count?.reviews || 0} lượt đánh giá</p>
                </div>

                <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-[#E8E0D4] space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewMeta?.distribution?.[star] || 0;
                    const percentage = salon._count?.reviews ? (count / salon._count.reviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-4">
                        <div className="flex items-center gap-1 min-w-[40px]">
                          <span className="text-xs font-bold text-[#2C1E12]">{star}</span>
                          <Star className="w-3 h-3 text-[#C8A97E] fill-[#C8A97E]" />
                        </div>
                        <div className="flex-1 h-2 bg-[#F0EBE3] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#C8A97E] rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-[#8B7355] min-w-[30px]">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E0D4] flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#8B7355]" />
                  <span className="text-xs font-bold text-[#2C1E12]">Lọc theo:</span>
                </div>
                
                {/* Star Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  <button
                    onClick={() => setRatingFilter(undefined)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                      ratingFilter === undefined ? "bg-[#C8A97E] text-white shadow-sm" : "bg-[#F0EBE3] text-[#8B7355] hover:bg-[#E8E0D4]"
                    )}
                  >
                    Tất cả
                  </button>
                  {[5, 4, 3, 2, 1].map(star => (
                    <button
                      key={star}
                      onClick={() => setRatingFilter(star)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap",
                        ratingFilter === star ? "bg-[#C8A97E] text-white shadow-sm" : "bg-[#F0EBE3] text-[#8B7355] hover:bg-[#E8E0D4]"
                      )}
                    >
                      {star} <Star className="w-3 h-3 fill-current" />
                    </button>
                  ))}
                </div>

                <div className="h-6 w-[1px] bg-[#E8E0D4] hidden md:block" />

                {/* Date Filter */}
                <div className="flex items-center gap-2 ml-auto">
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B7355]" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-[#F0EBE3] border-none rounded-lg text-xs font-bold text-[#2C1E12] focus:ring-1 focus:ring-[#C8A97E] cursor-pointer"
                    />
                  </div>
                  <span className="text-[#8B7355] text-xs font-bold">đến</span>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B7355]" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-[#F0EBE3] border-none rounded-lg text-xs font-bold text-[#2C1E12] focus:ring-1 focus:ring-[#C8A97E] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {loadingReviews ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
                    <p className="text-sm font-medium text-[#8B7355]">Đang tải đánh giá...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-2xl p-5 border border-[#E8E0D4] space-y-4 hover:shadow-sm transition-all animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={review.customer.avatar}
                            name={review.customer.name}
                            size="md"
                            variant="circle"
                          />
                          <div>
                            <h4 className="font-bold text-[14px] text-[#2C1E12]">{review.customer.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={cn(
                                      "w-3 h-3",
                                      s <= review.rating ? "text-[#C8A97E] fill-[#C8A97E]" : "text-[#D4C9BA]"
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-[#8B7355] font-medium">• {formatDate(review.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {review.staff && (
                          <div className="text-right">
                            <p className="text-[10px] text-[#8B7355] font-bold uppercase tracking-wider mb-0.5">Thực hiện bởi</p>
                            <p className="text-[11px] font-bold text-[#2C1E12]">{review.staff.name}</p>
                          </div>
                        )}
                      </div>

                      {review.comment && (
                        <p className="text-sm text-[#5C4A32] leading-relaxed italic pr-4">{`"${review.comment}"`}</p>
                      )}

                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                          {review.images.map((img, idx) => (
                            <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden relative shrink-0 bg-[#F0EBE3]">
                              <Image src={img} alt={`Review ${idx}`} fill className="object-cover hover:scale-110 transition-transform duration-500 cursor-zoom-in" />
                            </div>
                          ))}
                        </div>
                      )}

                      {review.reply && (
                        <div className="bg-[#FAF8F5] rounded-xl p-4 border-l-4 border-[#C8A97E] ml-2">
                          <p className="text-[10px] font-black text-[#C8A97E] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Check className="w-3 h-3" /> Salon Phản hồi
                          </p>
                          <p className="text-[13px] text-[#5C4A32] font-medium leading-relaxed">{review.reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-12 border border-[#E8E0D4] flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-16 h-16 bg-[#F0EBE3] rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-[#D4C9BA]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2C1E12]">Chưa có đánh giá nào</h4>
                      <p className="text-sm text-[#8B7355] mt-1">Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận nhé!</p>
                    </div>
                    <button 
                      onClick={() => {
                        setRatingFilter(undefined);
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="mt-2 text-xs font-bold text-[#C8A97E] hover:underline cursor-pointer"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Address */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E0D4]">
                <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#C8A97E]" />
                  Địa chỉ
                </h3>
                <p className="text-sm font-medium text-[#2C1E12]">
                  {salon.address}{salon.ward && `, ${salon.ward}`}, {salon.district}, {salon.city}
                </p>
              </div>

              {/* Hours */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E0D4]">
                <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#C8A97E]" />
                  Giờ hoạt động
                </h3>
                <p className="text-lg font-bold text-[#2C1E12] mb-3">{salon.openTime} – {salon.closeTime}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {salon.workingDays.map(day => (
                    <span key={day} className="px-3 py-1.5 bg-[#F0EBE3] text-xs font-bold text-[#2C1E12] rounded-lg">{day}</span>
                  ))}
                </div>
              </div>

              {/* Description */}
              {salon.description && (
                <div className="bg-white rounded-2xl p-5 border border-[#E8E0D4]">
                  <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">Giới thiệu</h3>
                  <p className="text-sm text-[#5C4A32] leading-relaxed">{salon.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#E8E0D4] shadow-[0_-2px_16px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {selectedServices.length > 0 ? (
              <>
                <p className="text-[11px] text-[#8B7355]">
                  {selectedServices.length} dịch vụ · {totalDuration} phút
                </p>
                <p className="text-lg font-bold text-[#2C1E12] tracking-tight leading-tight">
                  {formatPrice(totalSelected)}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#8B7355]">Chọn dịch vụ để đặt lịch</p>
            )}
          </div>

          <button
            onClick={handleBooking}
            disabled={selectedServices.length === 0}
            className={cn(
              'shrink-0 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 cursor-pointer',
              selectedServices.length > 0
                ? 'bg-[#C8A97E] text-white hover:bg-[#B8975E] active:scale-[0.98] shadow-sm'
                : 'bg-[#E8E0D4] text-[#B8A98C] cursor-not-allowed'
            )}
          >
            Tiếp tục đặt lịch
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDetailService && (
        <ServiceDetailModal
          service={selectedDetailService}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={() => toggleService(selectedDetailService)}
          isSelected={isServiceSelected(selectedDetailService.id)}
        />
      )}
      {/* Barber Profile Sheet */}
      {profileStaffId && (
        <BarberProfileSheet
          staffId={profileStaffId}
          onClose={() => setProfileStaffId(null)}
          onSelect={() => {
            setProfileStaffId(null);
            if (salon) {
              setSalon(salon);
              router.push('/booking');
            }
          }}
        />
      )}
      <Footer />
    </div>
  );
}
