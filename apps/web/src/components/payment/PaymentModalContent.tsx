'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, Clock, Copy, Check,
  RefreshCw, QrCode, Shield, Banknote, CreditCard, AlertTriangle,
} from 'lucide-react';
import { bookingApi, paymentApi, Booking } from '@/lib/api';
import { useBookingStore } from '@/lib/store';
import { formatPrice, cn } from '@/lib/utils';

type PaymentTab = 'qr' | 'bank';
type Status = 'PENDING' | 'PAID' | 'FAILED';

interface PaymentModalContentProps {
  bookingId: string;
  /** Called when user wants to close/dismiss the modal */
  onClose: () => void;
  /** If true: shows backdrop + slide-up animation (modal mode).
   *  If false: no backdrop, renders inline (full-page mode). */
  asModal?: boolean;
}

export default function PaymentModalContent({
  bookingId,
  onClose,
  asModal = true,
}: PaymentModalContentProps) {
  const router = useRouter();
  const { reset } = useBookingStore();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [qrData, setQrData] = useState<{
    qrCode: string;
    qrContent: string;
    amount: number;
    bankCode: string;
    bankAccount: string;
    bankName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<Status>('PENDING');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(600);
  const [activeTab, setActiveTab] = useState<PaymentTab>('qr');

  // ── Exit confirmation state ───────────────────────────────────
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Animate in (for modal mode)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (asModal) {
      document.body.style.overflow = 'hidden';
    }
    requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => {
      if (asModal) document.body.style.overflow = '';
    };
  }, [asModal]);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingData, qr] = await Promise.all([
        bookingApi.getById(bookingId),
        paymentApi.generateQR(bookingId),
      ]);
      setBooking(bookingData);
      setQrData(qr);
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { if (bookingId) void fetchData(); }, [bookingId, fetchData]);

  // ── Poll status ──────────────────────────────────────────────
  useEffect(() => {
    if (paymentStatus !== 'PENDING') return;
    const interval = setInterval(async () => {
      try {
        const s = await paymentApi.getStatus(bookingId);
        if (s.paymentStatus === 'PAID') { setPaymentStatus('PAID'); reset(); }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [bookingId, paymentStatus, reset]);

  // ── Countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (paymentStatus !== 'PENDING' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setPaymentStatus('FAILED');
          bookingApi.cancel(bookingId, 'Hết thời gian thanh toán cọc')
            .catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStatus, countdown, bookingId]);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const depositAmount = qrData?.amount
    || (booking?.totalAmount ? Math.round(booking.totalAmount * 0.25) : 0);
  const isUrgent = countdown <= 60;

  // ── Attempt close — guard during PENDING ─────────────────────
  const handleAttemptClose = () => {
    if (paymentStatus === 'PENDING') {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  // ── Confirmed exit: cancel booking + reset store slot ────────
  const handleConfirmExit = async () => {
    setCancelling(true);
    try {
      await bookingApi.cancel(bookingId, 'Người dùng huỷ thanh toán');
    } catch { /* ignore — slot will expire naturally */ }
    reset(); // clears selectedTimeSlot so it won't appear as "selected"
    setCancelling(false);
    setShowExitConfirm(false);
    onClose();
  };

  // ── CopyBtn ──────────────────────────────────────────────────
  const CopyBtn = ({ field, value }: { field: string; value: string }) => (
    <button
      onClick={() => copyToClipboard(value, field)}
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all active:scale-95 cursor-pointer',
        copiedField === field
          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
          : 'bg-[#FAF8F5] border-[#E8E0D4] text-[#8B7355] hover:border-[#C8A97E] hover:text-[#C8A97E]'
      )}
    >
      {copiedField === field ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  // ── Exit Confirmation Dialog ──────────────────────────────────
  const ExitConfirmDialog = () => (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-black/20 rounded-t-3xl md:rounded-3xl">
      <div className={cn(
        'bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transition-all duration-200',
        showExitConfirm ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      )}>
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-amber-50 border-2 border-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-base font-bold text-[#2C1E12] text-center mb-2">
          Huỷ thanh toán?
        </h3>
        <p className="text-sm text-[#8B7355] text-center leading-relaxed mb-5">
          Giao dịch đang chờ xác nhận. Nếu thoát,{' '}
          <strong className="text-[#2C1E12]">slot giờ sẽ được giải phóng</strong>{' '}
          và bạn cần đặt lại.
        </p>

        {/* Remaining time indicator */}
        <div className="flex items-center justify-center gap-2 mb-5 px-3 py-2 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4]">
          <Clock className="w-3.5 h-3.5 text-[#C8A97E]" />
          <span className="text-xs font-semibold text-[#8B7355]">
            Còn <span className="text-[#2C1E12] font-bold">{formatTime(countdown)}</span> để hoàn tất thanh toán
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => setShowExitConfirm(false)}
            className="w-full py-3 bg-[#C8A97E] text-white rounded-xl font-bold text-sm hover:bg-[#B8975E] transition-all active:scale-[0.98] cursor-pointer"
          >
            Tiếp tục thanh toán
          </button>
          <button
            onClick={handleConfirmExit}
            disabled={cancelling}
            className="w-full py-3 bg-[#F0EBE3] text-[#5C4A32] rounded-xl font-bold text-sm hover:bg-[#E8E0D4] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {cancelling
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang huỷ...</>
              : 'Thoát & huỷ đặt lịch'
            }
          </button>
        </div>
      </div>
    </div>
  );

  // ── Card content ─────────────────────────────────────────────
  const cardContent = loading ? (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
      <div className="w-10 h-10 border-[3px] border-[#E8E0D4] border-t-[#C8A97E] rounded-full animate-spin" />
      <p className="text-sm font-medium text-[#8B7355]">Đang tạo giao dịch...</p>
    </div>
  ) : paymentStatus === 'PAID' ? (
    /* ── SUCCESS ── */
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-5">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#2C1E12] mb-1">Đặt cọc thành công!</h2>
        <p className="text-sm text-[#8B7355] max-w-xs mx-auto leading-relaxed">
          Cảm ơn bạn! Phần còn lại sẽ thanh toán tại salon.
        </p>
      </div>
      {booking && (
        <div className="bg-gradient-to-br from-[#2C1E12] to-[#3D2E1F] rounded-2xl p-5 w-full text-center">
          <p className="text-[10px] font-bold text-[#C8A97E] uppercase tracking-[0.2em] mb-1">Mã đặt lịch</p>
          <p className="text-2xl font-bold text-white tracking-wider mb-3">{booking.bookingCode}</p>
          <div className="flex justify-center gap-8 pt-3 border-t border-white/10">
            <div>
              <p className="text-[10px] text-white/40 uppercase mb-0.5">Đã cọc</p>
              <p className="text-sm font-bold text-[#C8A97E]">{formatPrice(depositAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase mb-0.5">Còn lại</p>
              <p className="text-sm font-bold text-white">{formatPrice((booking.totalAmount || 0) - depositAmount)}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={() => router.replace(`/my-bookings/${bookingId}`)}
          className="w-full py-3.5 bg-[#C8A97E] text-white rounded-xl font-bold hover:bg-[#B8975E] transition-all active:scale-[0.98] shadow-md shadow-[#C8A97E]/20 cursor-pointer"
        >
          Xem chi tiết đặt lịch
        </button>
        <button
          onClick={onClose}
          className="text-sm font-bold text-[#8B7355] py-2 hover:text-[#5C4A32] transition-colors cursor-pointer"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  ) : paymentStatus === 'FAILED' ? (
    /* ── FAILED ── */
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-5">
      <div className="w-20 h-20 bg-red-50 border-2 border-red-100 rounded-full flex items-center justify-center">
        <XCircle className="w-10 h-10 text-red-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#2C1E12] mb-1">Hết thời gian thanh toán</h2>
        <p className="text-sm text-[#8B7355] max-w-xs mx-auto">
          Phiên giao dịch đã hết hạn. Thử lại hoặc thanh toán tại salon.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={() => { setPaymentStatus('PENDING'); setCountdown(600); fetchData(); }}
          className="w-full py-3.5 bg-[#C8A97E] text-white rounded-xl font-bold hover:bg-[#B8975E] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Thử lại
        </button>
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-[#F0EBE3] text-[#5C4A32] rounded-xl font-bold hover:bg-[#E8E0D4] transition-all active:scale-[0.98] cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  ) : (
    /* ── PENDING ── */
    <>
      {/* Header strip */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#F0EBE3] shrink-0">
        {/* Drag handle (mobile modal) */}
        {asModal && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[#E8E0D4]" />
        )}
        {/* Amount */}
        <div>
          <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Thanh toán cọc</p>
          <p className="text-xl font-bold text-[#2C1E12]">{formatPrice(depositAmount)}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <CreditCard className="w-3 h-3 text-[#C8A97E]" />
            <span className="text-[11px] font-semibold text-[#8B7355]">{booking?.bookingCode}</span>
            <button onClick={() => booking && copyToClipboard(booking.bookingCode, 'header-code')} className="cursor-pointer">
              {copiedField === 'header-code'
                ? <Check className="w-3 h-3 text-emerald-500" />
                : <Copy className="w-3 h-3 text-[#C4B9A8] hover:text-[#C8A97E] transition-colors" />}
            </button>
          </div>
        </div>
        {/* Timer */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all',
          isUrgent ? 'bg-red-50 border-red-200' : 'bg-[#FAF8F5] border-[#E8E0D4]'
        )}>
          <div className="relative w-8 h-8 shrink-0">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" className="stroke-[#E8E0D4]" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                className={cn('transition-all duration-1000', isUrgent ? 'stroke-red-400' : 'stroke-[#C8A97E]')}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(countdown / 600) * 87.96} 87.96`}
              />
            </svg>
            <Clock className={cn(
              'absolute inset-0 m-auto w-3.5 h-3.5',
              isUrgent ? 'text-red-500 animate-pulse' : 'text-[#C8A97E]'
            )} />
          </div>
          <span className={cn('text-sm font-bold tabular-nums', isUrgent ? 'text-red-600' : 'text-[#2C1E12]')}>
            {formatTime(countdown)}
          </span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mx-5 mt-4 p-1 bg-[#F0EBE3] rounded-xl shrink-0">
        {([
          { key: 'qr', label: 'Quét mã QR', icon: QrCode },
          { key: 'bank', label: 'Chuyển khoản', icon: Banknote },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer',
              activeTab === key ? 'bg-white text-[#2C1E12] shadow-sm' : 'text-[#8B7355] hover:text-[#5C4A32]'
            )}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* QR TAB */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-[#8B7355] text-center">
              Mở app ngân hàng → Quét mã QR → Kiểm tra thông tin → Xác nhận
            </p>
            {qrData?.qrCode ? (
              <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-[#E8E0D4] inline-block shadow-sm">
                <Image src={qrData.qrCode} alt="QR Code" width={220} height={220} unoptimized className="block rounded-xl" />
              </div>
            ) : (
              <div className="w-[220px] h-[220px] flex flex-col items-center justify-center gap-3 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E0D4]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#C8A97E]" />
                <span className="text-xs font-bold text-[#8B7355]">Đang tạo mã...</span>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1">
                {[0, 0.2, 0.4].map(delay => (
                  <div key={delay} className="w-1.5 h-1.5 bg-[#C8A97E] rounded-full animate-pulse" style={{ animationDelay: `${delay}s` }} />
                ))}
              </div>
              <p className="text-xs text-[#8B7355] font-medium">Đang chờ xác nhận thanh toán...</p>
            </div>
          </div>
        )}

        {/* BANK TAB */}
        {activeTab === 'bank' && (
          <div className="rounded-2xl border border-[#E8E0D4] overflow-hidden">
            {[
              { label: 'Ngân hàng', value: qrData?.bankName || qrData?.bankCode || '—', field: 'bank', extraClass: 'uppercase', noCopy: true },
              { label: 'Số tài khoản', value: qrData?.bankAccount || '—', field: 'account' },
              { label: 'Nội dung (bắt buộc)', value: booking?.bookingCode || '—', field: 'content', highlight: true },
              { label: 'Số tiền', value: formatPrice(depositAmount), field: 'amount', rawValue: String(depositAmount) },
            ].map(({ label, value, field, extraClass, noCopy, highlight, rawValue }, i, arr) => (
              <div
                key={field}
                className={cn(
                  'flex items-center justify-between px-4 py-3.5',
                  i < arr.length - 1 && 'border-b border-[#F0EBE3]',
                  highlight ? 'bg-[#FAF8F5]' : 'bg-white'
                )}
              >
                <div className="min-w-0">
                  <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-0.5', highlight ? 'text-[#C8A97E]' : 'text-[#8B7355]')}>
                    {label}
                  </p>
                  <p className={cn('text-sm font-bold text-[#2C1E12] truncate', extraClass)}>{value}</p>
                </div>
                {!noCopy && <CopyBtn field={field} value={rawValue || value} />}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/80 border border-amber-200/60 rounded-xl">
          <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Tiền cọc <strong>25%</strong> sẽ được khấu trừ khi thanh toán tại salon.
          </p>
        </div>

        <button
          className="w-full py-3 text-[#5C4A32] bg-white hover:bg-[#F0EBE3] border border-[#E8E0D4] rounded-xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer mb-2"
          onClick={() => { reset(); router.replace(`/my-bookings/${bookingId}`); }}
        >
          Thanh toán tại salon
        </button>
      </div>
    </>
  );

  // ── Modal wrapper ────────────────────────────────────────────
  if (asModal) {
    return (
      <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
        {/* Backdrop — clicks trigger exit confirmation during PENDING */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity duration-300',
            mounted ? 'opacity-100' : 'opacity-0'
          )}
          onClick={handleAttemptClose}
        />
        {/* Card */}
        <div
          className={cn(
            'relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl',
            'max-h-[92vh] md:max-h-[88vh] flex flex-col overflow-hidden',
            'transition-all duration-300 ease-out will-change-transform',
            mounted
              ? 'translate-y-0 md:scale-100 opacity-100'
              : 'translate-y-full md:translate-y-0 md:scale-95 opacity-0'
          )}
        >
          {cardContent}
          {/* Exit confirmation dialog — overlays on top of card */}
          {showExitConfirm && <ExitConfirmDialog />}
        </div>
      </div>
    );
  }

  // ── Full-page wrapper (direct URL visit) ─────────────────────
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-end md:items-center justify-center">
      <div className={cn(
        'relative w-full md:max-w-md bg-white md:rounded-3xl shadow-lg md:my-8',
        'max-h-screen md:max-h-[88vh] flex flex-col overflow-hidden',
        'transition-all duration-300',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}>
        {/* Back button for full-page mode */}
        <div className="flex justify-end px-5 pt-4 shrink-0">
          <button onClick={handleAttemptClose} className="text-xs font-bold text-[#8B7355] hover:text-[#5C4A32] transition-colors cursor-pointer flex items-center gap-1">
            ← Quay lại
          </button>
        </div>
        {cardContent}
        {/* Exit confirmation dialog */}
        {showExitConfirm && <ExitConfirmDialog />}
      </div>
    </div>
  );
}
