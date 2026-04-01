'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  X, MapPin, User, Scissors, Phone, Clock, Calendar,
  CheckCircle2, XCircle, AlertCircle, Hourglass,
  Star, MessageSquare, CreditCard, Receipt, Banknote, RefreshCw,
} from 'lucide-react';
import { bookingApi, Booking } from '@/lib/api';
import { formatPrice, formatDate, BOOKING_STATUS, PAYMENT_STATUS, cn } from '@/lib/utils';
import ReviewModal from '@/components/ReviewModal';
import Avatar from '@/components/Avatar';

/* ── Status config ─────────────────────────────────────────────── */
const bookingStatusConfig: Record<string, { icon: React.ElementType; bg: string; text: string; border: string }> = {
  PENDING:   { icon: Hourglass,    bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  CONFIRMED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  COMPLETED: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CANCELLED: { icon: XCircle,      bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200' },
  NO_SHOW:   { icon: AlertCircle,  bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200' },
  IN_SERVICE:{ icon: Scissors,     bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
};

const paymentStatusConfig: Record<string, { icon: React.ElementType; bg: string; text: string; border: string }> = {
  UNPAID:       { icon: CreditCard,   bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200' },
  PENDING:      { icon: Hourglass,    bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  DEPOSIT_PAID: { icon: Banknote,     bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  PAID:         { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

interface Props {
  bookingId: string | null;
  onClose: () => void;
}

export default function BookingDetailSheet({ bookingId, onClose }: Props) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const isWithinReviewPeriod = useCallback((completionDate: string) => {
    const now = new Date();
    const completedAt = new Date(completionDate);
    return now.getTime() - completedAt.getTime() <= 3 * 24 * 60 * 60 * 1000;
  }, []);

  /* ── Fetch booking when ID changes ─────────────────────────── */
  useEffect(() => {
    if (!bookingId) {
      setVisible(false);
      setBooking(null);
      return;
    }

    setLoading(true);
    setVisible(false); // reset anim

    bookingApi.getById(bookingId)
      .then(data => {
        setBooking(data);
        // Trigger slide-in after data is ready
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [bookingId]);

  /* ── Lock body scroll ───────────────────────────────────────── */
  useEffect(() => {
    if (bookingId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [bookingId]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  const handleCancel = async () => {
    if (!booking) return;
    try {
      setCancelling(true);
      await bookingApi.cancel(booking.id, cancelReason);
      setShowCancelModal(false);
      const updated = await bookingApi.getById(booking.id);
      setBooking(updated);
    } finally {
      setCancelling(false);
    }
  };

  if (!bookingId) return null;

  const totalPaid = booking?.payments
    ? booking.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0)
    : 0;
  const remainingAmount = booking ? Math.max(0, booking.totalAmount - totalPaid) : 0;
  const canCancel = booking &&
    ['PENDING', 'CONFIRMED'].includes(booking.status) &&
    new Date(booking.date) > new Date();

  const bStatus = booking ? (bookingStatusConfig[booking.status] ?? bookingStatusConfig.PENDING) : null;
  const pStatus = booking ? (paymentStatusConfig[booking.paymentStatus] ?? paymentStatusConfig.UNPAID) : null;

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-[100] bg-black/50 transition-opacity duration-350 backdrop-blur-sm',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
      />

      {/* ── Sheet ───────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[101] flex justify-center',
          'transition-transform duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform',
          visible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div
          ref={contentRef}
          className="w-full max-w-lg bg-[#FAF8F5] rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* ── Handle bar ────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
            <div className="w-10 h-1 rounded-full bg-[#D4C9BA] mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
            <div className="flex-1" />
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white border border-[#E8E0D4] flex items-center justify-center hover:bg-[#F0EBE3] transition-colors active:scale-95"
            >
              <X className="w-4 h-4 text-[#8B7355]" />
            </button>
          </div>

          {/* ── Scrollable content ────────────────────────────── */}
          <div className="overflow-y-auto flex-1 px-4 pb-8 space-y-4">
            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-4 animate-pulse pt-2">
                <div className="h-32 bg-[#E8E0D4] rounded-2xl" />
                <div className="h-16 bg-white rounded-2xl border border-[#E8E0D4]" />
                <div className="h-24 bg-white rounded-2xl border border-[#E8E0D4]" />
                <div className="h-40 bg-white rounded-2xl border border-[#E8E0D4]" />
              </div>
            )}

            {!loading && booking && bStatus && pStatus && (() => {
              const BStatusIcon = bStatus.icon;
              const PStatusIcon = pStatus.icon;
              return (
                <>
                  {/* Hero card */}
                  <div className="relative bg-gradient-to-br from-[#2C1E12] via-[#3D2A18] to-[#2C1E12] rounded-2xl overflow-hidden shadow-lg">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C8A97E]/10 rounded-full" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
                    <div className="relative z-10 p-5 text-center">
                      <p className="text-[10px] font-bold text-[#C8A97E]/60 uppercase tracking-[0.3em] mb-1.5">Mã đặt lịch</p>
                      <p className="text-2xl font-bold tracking-widest text-[#C8A97E] mb-3">{booking.bookingCode}</p>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border', bStatus.bg, bStatus.text, bStatus.border)}>
                          <BStatusIcon className="w-3 h-3" />
                          {BOOKING_STATUS[booking.status]?.label || booking.status}
                        </span>
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border', pStatus.bg, pStatus.text, pStatus.border)}>
                          <PStatusIcon className="w-3 h-3" />
                          {PAYMENT_STATUS[booking.paymentStatus]?.label || booking.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="bg-white rounded-2xl border border-[#E8E0D4] shadow-sm overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-[#E8E0D4]">
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#F0EBE3] flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-[#C8A97E]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Ngày</p>
                          <p className="text-sm font-bold text-[#2C1E12]">{formatDate(booking.date)}</p>
                        </div>
                      </div>
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#F0EBE3] flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5 text-[#C8A97E]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Giờ</p>
                          <p className="text-sm font-bold text-[#2C1E12]">{booking.timeSlot}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salon */}
                  <div className="bg-white rounded-2xl border border-[#E8E0D4] shadow-sm p-4">
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-2">Địa điểm</p>
                    <h2 className="text-base font-bold text-[#2C1E12] mb-1">{booking.salon.name}</h2>
                    <p className="text-xs text-[#5C4A32] flex items-start gap-1.5 mb-3 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-[#C8A97E] shrink-0 mt-0.5" />
                      {booking.salon.address}
                    </p>
                    <a
                      href={`tel:${booking.salon.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0EBE3] hover:bg-[#E8E0D4] rounded-xl transition-colors text-xs font-bold text-[#2C1E12]"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#C8A97E]" />
                      {booking.salon.phone}
                    </a>
                  </div>

                  {/* Barber */}
                  <div className="bg-white rounded-2xl border border-[#E8E0D4] shadow-sm p-4 flex items-center gap-3">
                    {booking.staff ? (
                      <Avatar src={booking.staff.user.avatar} name={booking.staff.user.name} size="md" variant="circle" className="shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#F0EBE3] flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[#C8A97E]" />
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-0.5">Thợ cắt</p>
                      <p className="text-sm font-bold text-[#2C1E12]">{booking.staff?.user.name ?? 'Thợ bất kỳ'}</p>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="bg-white rounded-2xl border border-[#E8E0D4] shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#F0EBE3] flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-[#C8A97E]" />
                      <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Dịch vụ đã chọn</p>
                    </div>
                    <div className="divide-y divide-[#F0EBE3]">
                      {booking.services.map(item => (
                        <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-[#2C1E12]">{item.service.name}</p>
                            <p className="text-xs text-[#8B7355] mt-0.5">{item.duration} phút</p>
                          </div>
                          <p className="text-sm font-bold text-[#2C1E12]">{formatPrice(item.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial */}
                  <div className="bg-white rounded-2xl border border-[#E8E0D4] shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#F0EBE3] flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-[#C8A97E]" />
                      <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Thanh toán</p>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between border-b border-[#F0EBE3]">
                      <span className="text-sm text-[#5C4A32] font-medium">Tổng dịch vụ</span>
                      <span className="text-base font-bold text-[#2C1E12]">{formatPrice(booking.totalAmount)}</span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-[#F0EBE3]">
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-1">Đã thanh toán</p>
                        <p className="text-sm font-bold text-emerald-600">{formatPrice(totalPaid)}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-1">Còn lại</p>
                        <p className="text-sm font-bold text-[#2C1E12]">{formatPrice(remainingAmount)}</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 bg-[#FAF8F5] flex items-center justify-between border-t border-[#F0EBE3]">
                      <span className="text-xs text-[#8B7355] font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C8A97E]" /> Tổng thời gian
                      </span>
                      <span className="text-xs font-bold text-[#5C4A32]">{booking.totalDuration} phút</span>
                    </div>
                  </div>

                  {/* Review */}
                  {booking.review && (
                    <div className="bg-white rounded-2xl border border-[#C8A97E]/30 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider mb-1">Đánh giá</p>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={cn('w-3.5 h-3.5', booking.review && s <= booking.review.rating ? 'text-[#C8A97E] fill-current' : 'text-[#E8E0D4]')} />
                            ))}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#F0EBE3] flex items-center justify-center">
                          <MessageSquare className="w-3.5 h-3.5 text-[#C8A97E]" />
                        </div>
                      </div>
                      <p className="text-xs text-[#5C4A32] italic leading-relaxed">&ldquo;{booking.review?.comment}&rdquo;</p>
                      {booking.review?.images && booking.review.images.length > 0 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                          {booking.review.images.map((img: string, i: number) => (
                            <div key={i} className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#E8E0D4] shrink-0">
                              <Image src={img} alt="Review" fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2.5 pb-2">
                    {(booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'PENDING') &&
                      ['PENDING', 'CONFIRMED'].includes(booking.status) && (
                        <a
                          href={`/payment/${booking.id}`}
                          className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#C8A97E] hover:bg-[#B8975E] text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-[#C8A97E]/20"
                        >
                          <CreditCard className="w-4 h-4" />
                          Thanh toán cọc giữ chỗ
                        </a>
                      )}

                    {canCancel && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full py-3 text-[#8B7355] hover:text-red-600 font-bold text-sm bg-white border border-[#E8E0D4] hover:border-red-200 rounded-2xl transition-all hover:bg-red-50"
                      >
                        Huỷ lịch hẹn
                      </button>
                    )}

                    {booking.status === 'COMPLETED' && !booking.review && (
                      isWithinReviewPeriod(booking.updatedAt) ? (
                        <button
                          onClick={() => setShowReviewModal(true)}
                          className="w-full py-3.5 bg-[#2C1E12] hover:bg-[#1C130B] text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <Star className="w-4 h-4 fill-[#C8A97E] text-[#C8A97E]" />
                          Đánh giá dịch vụ
                        </button>
                      ) : (
                        <p className="text-xs text-[#8B7355] text-center py-2">⏳ Đã hết thời hạn 3 ngày để đánh giá.</p>
                      )
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Review Modal ────────────────────────────────────────── */}
      {booking && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          bookingId={booking.id}
          salonName={booking.salon.name}
          staffName={booking.staff?.user.name}
          onSuccess={async () => {
            const updated = await bookingApi.getById(booking.id);
            setBooking(updated);
          }}
        />
      )}

      {/* ── Cancel Confirmation ─────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-[102] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2C1E12]">Huỷ lịch hẹn?</h3>
                <p className="text-xs text-[#8B7355]">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Lý do huỷ (không bắt buộc)..."
              rows={3}
              className="w-full p-3.5 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl mb-4 focus:outline-none focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E]/20 transition-all text-sm text-[#2C1E12] placeholder:text-[#C4B9A8] resize-none"
            />
            <div className="flex gap-2.5">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-[#F0EBE3] text-[#5C4A32] rounded-xl font-bold text-sm hover:bg-[#E8E0D4] transition-colors">
                Không
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {cancelling ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang huỷ...</> : 'Xác nhận huỷ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
