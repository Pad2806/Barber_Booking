'use client';

import React, { useState } from 'react';
import { Star, X, Loader2, MessageSquare } from 'lucide-react';
import { reviewApi } from '@/lib/api';
import MultiImageUpload from './MultiImageUpload';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  bookingId: string;
  salonName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  bookingId,
  salonName,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await reviewApi.create({
        bookingId,
        rating,
        comment,
        images,
      });
      toast.success('Cảm ơn bạn đã đánh giá dịch vụ!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E8E0D4] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-[#2C1E12] p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold italic font-heading">Đánh giá dịch vụ</h3>
            <p className="text-xs text-white/60 uppercase tracking-widest mt-1">{salonName}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm font-bold text-[#8B7355] uppercase tracking-wider mb-4">Mức độ hài lòng của bạn?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star
                    className={cn(
                      "w-10 h-10 transition-colors fill-current",
                      (hoverRating || rating) >= star 
                        ? "text-[#C8A97E]" 
                        : "text-[#E8E0D4]"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm font-bold text-[#2C1E12]">
              {rating === 1 && 'Rất tệ 😞'}
              {rating === 2 && 'Tệ 😕'}
              {rating === 3 && 'Bình thường 😐'}
              {rating === 4 && 'Tốt 🙂'}
              {rating === 5 && 'Tuyệt vời 😍'}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-3">
             <label className="flex items-center gap-2 text-sm font-bold text-[#8B7355] uppercase tracking-wider">
               <MessageSquare className="w-4 h-4" />
               Chia sẻ trải nghiệm
             </label>
             <textarea
               value={comment}
               onChange={(e) => setComment(e.target.value)}
               placeholder="Kiểu tóc này rất hợp với mình, thợ làm rất kỹ..."
               rows={4}
               className="w-full p-4 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E] transition-all text-sm text-[#2C1E12] placeholder:text-[#8B7355]/40"
             />
          </div>

          {/* Images */}
          <div className="space-y-3">
             <label className="text-sm font-bold text-[#8B7355] uppercase tracking-wider block">Hình ảnh thực tế (không bắt buộc)</label>
             <MultiImageUpload 
               value={images}
               onChange={setImages}
               folder="reviews"
               maxImages={5}
             />
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-[#F0EBE3] text-[#5C4A32] rounded-xl font-bold text-sm hover:bg-[#E8E0D4] transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "flex-1 py-4 bg-[#2C1E12] text-white rounded-xl font-bold text-sm shadow-lg transition-all active:scale-[0.98]",
                submitting ? "opacity-70 cursor-not-allowed" : "hover:bg-[#1C130B]"
              )}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </div>
              ) : 'Gửi đánh giá ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
