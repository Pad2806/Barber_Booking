'use client';

import React, { useState, useEffect } from 'react';
import { Star, X, Loader2, MessageSquare, Camera } from 'lucide-react';
import { reviewApi } from '@/lib/api';
import MultiImageUpload from './MultiImageUpload';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  bookingId: string;
  salonName: string;
  staffName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  bookingId,
  salonName,
  staffName,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [staffRating, setStaffRating] = useState(5);
  const [hoverStaffRating, setHoverStaffRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Smooth mount/unmount animation
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Double RAF for reliable CSS transition trigger
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await reviewApi.create({ bookingId, rating, staffRating, comment, images });
      toast.success('Cảm ơn bạn đã đánh giá dịch vụ! 🌟');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4',
        'transition-all duration-400',
        visible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none',
      )}
      style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
      onClick={handleClose}
    >
      {/* Modal card */}
      <div
        className={cn(
          'relative w-full sm:max-w-lg bg-white shadow-2xl',
          'rounded-t-3xl sm:rounded-3xl overflow-hidden',
          'transition-all duration-400',
          visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-12 opacity-0 sm:scale-95 sm:translate-y-4',
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag pill (mobile) */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#D4C9BA]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-4 pb-4 border-b border-[#F0EBE3]">
          <div>
            <h3 className="text-xl font-bold text-[#2C1E12] font-heading italic">Đánh giá dịch vụ</h3>
            <p className="text-xs text-[#8B7355] uppercase tracking-[0.15em] mt-0.5 font-semibold">{salonName}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-[#F0EBE3] flex items-center justify-center hover:bg-[#E8E0D4] transition-all active:scale-90 mt-0.5 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 text-[#5C4A32]" />
          </button>
        </div>

        {/* Scrollable form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[70vh] sm:max-h-[65vh]"
        >
          <div className="px-6 py-5 space-y-6">

            {/* Salon Rating */}
            <StarSection
              step={1}
              label="Đánh giá Salon"
              question="Bạn thấy không gian &amp; dịch vụ chung thế nào?"
              value={hoverRating || rating}
              onHover={setHoverRating}
              onLeave={() => setHoverRating(0)}
              onSelect={setRating}
            />

            {/* Barber Rating */}
            {staffName && (
              <StarSection
                step={2}
                label="Đánh giá Barber"
                question={`Tay nghề của `}
                highlight={staffName}
                suffix=" ra sao?"
                value={hoverStaffRating || staffRating}
                onHover={setHoverStaffRating}
                onLeave={() => setHoverStaffRating(0)}
                onSelect={setStaffRating}
              />
            )}

            {/* Comment */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold text-[#8B7355] uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" />
                Chia sẻ thêm (không bắt buộc)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Kiểu tóc này rất hợp với mình, thợ làm rất kỹ..."
                rows={3}
                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-2xl focus:outline-none focus:border-[#C8A97E] focus:ring-2 focus:ring-[#C8A97E]/20 transition-all duration-200 text-sm text-[#2C1E12] placeholder:text-[#C4B9A8] resize-none leading-relaxed"
              />
            </div>

            {/* Images */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold text-[#8B7355] uppercase tracking-wider">
                <Camera className="w-3.5 h-3.5" />
                Hình ảnh thực tế
              </label>
              <MultiImageUpload
                value={images}
                onChange={setImages}
                folder="reviews"
                maxImages={5}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 pb-6 pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3.5 bg-[#F0EBE3] text-[#5C4A32] rounded-2xl font-bold text-sm hover:bg-[#E8E0D4] transition-all active:scale-[0.97] cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'flex-1 py-3.5 bg-[#2C1E12] text-white rounded-2xl font-bold text-sm',
                'transition-all duration-200 active:scale-[0.97]',
                submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#1C130B] cursor-pointer shadow-lg shadow-[#2C1E12]/20',
              )}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </span>
              ) : 'Gửi đánh giá ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Star section component ─────────────────────────────────────── */
function StarSection({
  step,
  label,
  question,
  highlight,
  suffix,
  value,
  onHover,
  onLeave,
  onSelect,
}: {
  step: number;
  label: string;
  question: string;
  highlight?: string;
  suffix?: string;
  value: number;
  onHover: (v: number) => void;
  onLeave: () => void;
  onSelect: (v: number) => void;
}) {
  const labels = ['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];
  return (
    <div className="bg-[#FAF8F5] rounded-2xl border border-[#E8E0D4] p-5 text-center">
      <p className="text-[10px] font-bold text-[#C8A97E] uppercase tracking-[0.2em] mb-1">
        {step}. {label}
      </p>
      <p className="text-sm font-semibold text-[#2C1E12] mb-4 leading-snug">
        {question}
        {highlight && <span className="text-[#C8A97E]">{highlight}</span>}
        {suffix}
      </p>
      <div className="flex justify-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => onHover(star)}
            onMouseLeave={onLeave}
            onTouchStart={() => onHover(star)}
            onTouchEnd={() => { onSelect(star); onLeave(); }}
            onClick={() => onSelect(star)}
            className="p-1 transition-transform duration-150 active:scale-75 cursor-pointer"
            style={{
              transform: value >= star ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <Star
              className={cn(
                'w-8 h-8 transition-colors duration-150 fill-current',
                value >= star ? 'text-[#C8A97E]' : 'text-[#E8E0D4]',
              )}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs font-bold text-[#C8A97E] min-h-[1rem] transition-all duration-200">
          {labels[value]}
        </p>
      )}
    </div>
  );
}
