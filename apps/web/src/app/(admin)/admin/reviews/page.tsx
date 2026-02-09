'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Star,
  MessageSquare,
  MoreVertical,
  Eye,
  Flag,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDateTime, cn } from '@/lib/utils';
import { adminApi } from '@/lib/api';

interface ReviewData {
  id: string;
  customer: { id: string; name: string; avatar: string | null };
  salon: { id: string; name: string };
  staff: { id: string; name: string } | null;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified?: boolean;
  helpfulCount?: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params: any = { take: 100 };
      if (ratingFilter !== 'ALL') {
        params.rating = ratingFilter;
      }
      const data = await adminApi.getAllReviews(params);
      setReviews((data.data || []) as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch =
      review.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      review.comment?.toLowerCase().includes(search.toLowerCase()) ||
      review.salon?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Calculate stats
  const averageRating =
    reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
        : 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchReviews}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-800">Quản lý đánh giá</h1>
        <p className="text-gray-500">Xem và quản lý đánh giá từ khách hàng</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Average Rating */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-accent">{averageRating.toFixed(1)}</p>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={cn(
                      'w-5 h-5',
                      star <= Math.round(averageRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">{reviews.length} đánh giá</p>
            </div>
            <div className="flex-1 space-y-2">
              {ratingDistribution.map(item => (
                <div key={item.rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{item.rating}</span>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Thống kê nhanh</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-800">
                {reviews.filter(r => r.rating >= 4).length}
              </p>
              <p className="text-sm text-gray-500">Đánh giá tích cực (4-5⭐)</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-800">
                {reviews.filter(r => r.rating <= 2).length}
              </p>
              <p className="text-sm text-gray-500">Cần cải thiện (1-2⭐)</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-800">{reviews.length}</p>
              <p className="text-sm text-gray-500">Tổng đánh giá</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-800">
                {reviews.filter(r => r.rating === 5).length}
              </p>
              <p className="text-sm text-gray-500">5 sao</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo khách hàng, nội dung..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={e =>
            setRatingFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))
          }
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="ALL">Tất cả đánh giá</option>
          {[5, 4, 3, 2, 1].map(rating => (
            <option key={rating} value={rating}>
              {rating} sao
            </option>
          ))}
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map(review => (
          <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-accent">
                    {review.customer.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {review.customer?.name || 'Ẩn danh'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {review.salon?.name || 'N/A'} {review.staff ? `• ${review.staff.name}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      setSelectedReview(selectedReview === review.id ? null : review.id)
                    }
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>

                  {selectedReview === review.id && (
                    <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[150px]">
                      <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full">
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full text-yellow-600">
                        <Flag className="w-4 h-4" />
                        Đánh dấu spam
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full text-red-600">
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{review.comment}</p>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{formatDateTime(review.createdAt)}</span>
              <div className="flex items-center gap-4">
                <button className="text-accent hover:underline flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Phản hồi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">⭐</div>
          <p className="text-gray-500">Không tìm thấy đánh giá nào</p>
        </div>
      )}
    </div>
  );
}
