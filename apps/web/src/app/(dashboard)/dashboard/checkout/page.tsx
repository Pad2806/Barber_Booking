'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi } from '@/lib/api';
import {
  CreditCard,
  Banknote,
  QrCode,
  Loader2,
  Check,
  Printer,
  Scissors,
  ArrowRight,
  Receipt,
  AlertCircle,
  CheckCircle2,
  History,
  Download,
  Calendar,
  Clock,
  Wallet,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

// ─── INVOICE PRINT COMPONENT ────────────────────────────────

function InvoicePrint({ booking, paymentInfo, paymentMethod }: {
  booking: any;
  paymentInfo: { total: number; depositPaid: number; remaining: number };
  paymentMethod: string;
}) {
  return (
    <div className="p-6 max-w-[300px] mx-auto font-mono text-sm bg-white text-black">
      {/* Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <h2 className="text-lg font-bold uppercase tracking-wider">
          {booking.salon?.name || 'RETRO BARBER'}
        </h2>
        <p className="text-[10px] mt-0.5">{booking.salon?.address || ''}</p>
        <p className="text-[10px]">{booking.salon?.phone || ''}</p>
      </div>

      {/* Invoice info */}
      <div className="text-center mb-3">
        <p className="font-bold text-xs uppercase tracking-widest">Hóa Đơn Thanh Toán</p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          #{booking.bookingCode || booking.id?.slice(-8).toUpperCase()}
        </p>
      </div>

      <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-3 mb-3">
        <div className="flex justify-between">
          <span>Ngày:</span>
          <span>{dayjs(booking.date).format('DD/MM/YYYY')}</span>
        </div>
        <div className="flex justify-between">
          <span>Giờ:</span>
          <span>{booking.timeSlot} - {booking.endTime}</span>
        </div>
        <div className="flex justify-between">
          <span>Khách:</span>
          <span>{booking.customer?.name || 'Khách vãng lai'}</span>
        </div>
        {booking.staff && (
          <div className="flex justify-between">
            <span>Thợ:</span>
            <span>{booking.staff?.user?.name}</span>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        <p className="font-bold text-[10px] uppercase mb-2">Dịch vụ</p>
        {booking.services?.map((s: any) => (
          <div key={s.id} className="flex justify-between text-[11px] mb-1">
            <span className="flex-1 truncate pr-2">{s.service?.name}</span>
            <span className="shrink-0">{formatPrice(Number(s.price))}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Tổng dịch vụ:</span>
          <span>{formatPrice(paymentInfo.total)}</span>
        </div>
        {paymentInfo.depositPaid > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Đã cọc online:</span>
            <span>-{formatPrice(paymentInfo.depositPaid)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-400 pt-2 mt-2">
          <span>Thanh toán:</span>
          <span>{formatPrice(paymentInfo.remaining)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Phương thức:</span>
          <span>{paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-400">
        <p className="text-[10px] font-semibold">Cảm ơn quý khách!</p>
        <p className="text-[9px] text-gray-400 mt-1">Hẹn gặp lại</p>
        <p className="text-[9px] text-gray-400 mt-2">
          In lúc: {dayjs().format('DD/MM/YYYY HH:mm')}
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────

export default function CheckoutPage() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR'>('CASH');
  const [activeTab, setActiveTab] = useState<'checkout' | 'history'>('checkout');
  const [showInvoice, setShowInvoice] = useState<any>(null);
  const [historyDate, setHistoryDate] = useState(dayjs().format('YYYY-MM-DD'));
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Checkout tab: client-side search by customer name/phone
  const [checkoutSearch, setCheckoutSearch] = useState('');
  // History tab: search + payment method filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyMethod, setHistoryMethod] = useState('ALL');

  // Checkout eligible bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['cashier', 'checkout-eligible'],
    queryFn: cashierApi.getCheckoutEligibleBookings,
    refetchInterval: 15000,
    enabled: activeTab === 'checkout',
  });

  // Payment history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['cashier', 'payment-history', historyDate],
    queryFn: () => cashierApi.getPaymentHistory(historyDate || dayjs().format('YYYY-MM-DD')),
    enabled: activeTab === 'history',
  });

  // Filtered checkout bookings (client-side)
  const filteredCheckoutBookings = useMemo(() => {
    if (!bookings?.length) return [];
    if (!checkoutSearch) return bookings;
    const s = checkoutSearch.toLowerCase();
    return bookings.filter((b: any) =>
      b.customer?.name?.toLowerCase().includes(s) ||
      b.customer?.phone?.toLowerCase().includes(s)
    );
  }, [bookings, checkoutSearch]);

  // Filtered history (client-side)
  const filteredHistory = useMemo(() => {
    if (!historyData?.bookings) return [];
    return historyData.bookings.filter((b: any) => {
      const matchSearch = !historySearch ||
        b.customer?.name?.toLowerCase().includes(historySearch.toLowerCase()) ||
        b.bookingCode?.toLowerCase().includes(historySearch.toLowerCase());
      const matchMethod = historyMethod === 'ALL' ||
        b.payments?.some((p: any) => p.method === historyMethod);
      return matchSearch && matchMethod;
    });
  }, [historyData, historySearch, historyMethod]);

  const checkoutMutation = useMutation({
    mutationFn: () => cashierApi.checkout(selectedBooking.id, paymentMethod),
    onSuccess: (_, __, ___) => {
      toast.success('Thanh toán thành công!');
      setShowInvoice({
        booking: selectedBooking,
        paymentInfo: getPaymentInfo(selectedBooking),
        paymentMethod,
      });
      setSelectedBooking(null);
      queryClient.invalidateQueries({ queryKey: ['cashier'] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Lỗi khi thực hiện thanh toán'),
  });

  const getPaymentInfo = (booking: any) => {
    if (!booking) return { total: 0, depositPaid: 0, remaining: 0 };
    const total = Number(booking.totalAmount || 0);
    const depositPaid = (booking.payments || [])
      .filter((p: any) => p.status === 'PAID')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const remaining = total - depositPaid;
    return { total, depositPaid, remaining: remaining > 0 ? remaining : total };
  };

  const paymentInfo = getPaymentInfo(selectedBooking);

  const getStatusBadge = (booking: any) => {
    if (booking.status === 'COMPLETED' && booking.paymentStatus === 'DEPOSIT_PAID') {
      return { label: 'Đã cắt xong — Chờ TT', class: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (booking.paymentStatus === 'DEPOSIT_PAID') {
      return { label: 'Đã cọc — Đang phục vụ', class: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (booking.status === 'CONFIRMED') {
      return { label: 'Đã xác nhận', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (booking.status === 'IN_PROGRESS') {
      return { label: 'Đang phục vụ', class: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { label: booking.status, class: 'bg-slate-50 text-slate-600 border-slate-200' };
  };

  // Print invoice — uses hidden iframe to avoid popup blockers.
  // The iframe is appended to the current document, content is written,
  // print() fires on the iframe window, then iframe is cleaned up.
  const handlePrint = useCallback(() => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printCSS = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; }
      .container { width: 300px; margin: 0 auto; padding: 16px; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
      .flex { display: flex; }
      .justify-between { justify-content: space-between; }
      .border-dashed { border-bottom: 1px dashed #999; }
      .mb-2 { margin-bottom: 8px; }
      .mt-2 { margin-top: 8px; }
      .pb-2 { padding-bottom: 8px; }
      .pt-2 { padding-top: 8px; }
      .text-sm { font-size: 11px; }
      .text-xs { font-size: 10px; }
      .text-lg { font-size: 16px; }
      .uppercase { text-transform: uppercase; }
      .tracking-wider { letter-spacing: 2px; }
      .text-gray { color: #888; }
      .text-green { color: #059669; }
      @media print { @page { margin: 0; size: 80mm auto; } }
    `;

    // Create hidden iframe — never blocked by popup blockers
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:400px;height:600px;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }

    doc.open();
    doc.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>Hóa đơn</title>
          <meta charset="utf-8" />
          <style>${printCSS}</style>
        </head>
        <body>
          <div class="container">${printContent.innerHTML}</div>
        </body>
      </html>
    `);
    doc.close();

    // Wait for iframe to fully render then print
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Clean up after a short delay (print dialog keeps a reference)
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1000);
    };
  }, []);

  // Export summary as text/CSV
  const handleExportSummary = () => {
    if (!historyData) return;
    const { bookings: hBookings, summary } = historyData;

    let csv = 'Mã đơn,Khách hàng,Thợ,Dịch vụ,Tổng tiền,Đã cọc,Thu thêm,Phương thức,Giờ thanh toán\n';

    hBookings.forEach((b: any) => {
      const services = b.services?.map((s: any) => s.service?.name).join(' + ') || '';
      const total = Number(b.totalAmount);
      const deposit = b.payments?.filter((p: any) => p.type === 'DEPOSIT').reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
      const finalPmt = b.payments?.filter((p: any) => p.type !== 'DEPOSIT').reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
      const method = b.payments?.map((p: any) => p.method === 'CASH' ? 'Tiền mặt' : 'CK').join(', ') || '';
      const time = b.payments?.[0]?.paidAt ? dayjs(b.payments[0].paidAt).format('HH:mm') : '';

      csv += `${b.bookingCode || ''},${b.customer?.name || ''},${b.staff?.user?.name || ''},"${services}",${total},${deposit},${finalPmt},${method},${time}\n`;
    });

    csv += `\nTỔNG KẾT\n`;
    csv += `Tổng giao dịch,${summary.totalTransactions}\n`;
    csv += `Tổng thu,${summary.totalAmount}\n`;
    csv += `Tiền mặt,${summary.totalCash}\n`;
    csv += `Chuyển khoản,${summary.totalTransfer}\n`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lich-su-thanh-toan-${historyDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file CSV');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Thanh toán</h1>
          <p className="text-slate-500 mt-1">Xử lý thanh toán & lịch sử giao dịch</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-slate-100/50 p-1 rounded-xl h-10 border border-slate-100">
            <TabsTrigger
              value="checkout"
              className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Thanh toán
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <History className="w-3.5 h-3.5 mr-1.5" /> Lịch sử
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ─── CHECKOUT TAB ──────────────────────────────────────── */}
      {activeTab === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Booking List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-slate-50 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base font-bold">Booking sẵn sàng thanh toán</CardTitle>
                    <CardDescription>Chọn booking để xử lý thanh toán</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {bookings?.length > 0 && (
                      <Badge className="bg-primary/10 text-primary border-none">{bookings.length}</Badge>
                    )}
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        placeholder="Tìm khách hàng..."
                        value={checkoutSearch}
                        onChange={e => setCheckoutSearch(e.target.value)}
                        className="h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-44"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : !filteredCheckoutBookings?.length ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Receipt className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-medium">{checkoutSearch ? 'Không tìm thấy khách hàng phù hợp' : 'Không có booking nào sẵn sàng thanh toán'}</p>
                  </div>
                ) : (
                  filteredCheckoutBookings.map((b: any) => {
                    const badge = getStatusBadge(b);
                    const info = getPaymentInfo(b);
                    const isReady = b.status === 'COMPLETED' && b.paymentStatus === 'DEPOSIT_PAID';

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer',
                          selectedBooking?.id === b.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : isReady
                              ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
                              : 'border-slate-100 hover:border-slate-200',
                        )}
                      >
                        {isReady && (
                          <div className="w-2 h-full min-h-[40px] bg-amber-400 rounded-full shrink-0" />
                        )}
                        <Avatar className="h-11 w-11 shrink-0">
                          <AvatarImage src={b.customer?.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {b.customer?.name?.charAt(0) || 'K'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900">{b.customer?.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span>{b.timeSlot}</span>
                            <span>•</span>
                            <span>{b.services?.length} dịch vụ</span>
                            {b.staff && (
                              <>
                                <span>•</span>
                                <span>Thợ: {b.staff.user?.name}</span>
                              </>
                            )}
                          </div>
                          <Badge className={cn('text-[9px] border mt-1.5', badge.class)}>
                            {badge.label}
                          </Badge>
                        </div>
                        <div className="text-right shrink-0">
                          {info.depositPaid > 0 ? (
                            <>
                              <p className="text-[10px] text-emerald-600 font-semibold">
                                Đã cọc {formatPrice(info.depositPaid)}
                              </p>
                              <p className="font-bold text-primary text-lg">
                                {formatPrice(info.remaining)}
                              </p>
                              <p className="text-[10px] text-slate-400">còn lại</p>
                            </>
                          ) : (
                            <p className="font-bold text-primary">{formatPrice(info.total)}</p>
                          )}
                        </div>
                        {selectedBooking?.id === b.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Bill Detail */}
            {selectedBooking && (
              <Card className="border-none shadow-sm bg-white animate-in slide-in-from-bottom-2 duration-300">
                <CardHeader className="border-b border-slate-50 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">
                      Hóa đơn <span className="text-slate-300 font-normal text-sm">#{selectedBooking.bookingCode || selectedBooking.id?.slice(-6).toUpperCase()}</span>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {selectedBooking.services?.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <Scissors className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{s.service?.name}</p>
                          <p className="text-[11px] text-slate-400">{s.duration || s.service?.duration} phút</p>
                        </div>
                      </div>
                      <p className="font-semibold text-slate-900">{formatPrice(Number(s.price))}</p>
                    </div>
                  ))}

                  <div className="h-px bg-slate-100" />

                  {paymentInfo.depositPaid > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Tổng dịch vụ</span>
                        <span className="font-semibold text-slate-900">{formatPrice(paymentInfo.total)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600">Đã đặt cọc online</span>
                        </div>
                        <span className="font-semibold text-emerald-600">-{formatPrice(paymentInfo.depositPaid)}</span>
                      </div>
                      <div className="h-px bg-slate-100" />
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {paymentInfo.depositPaid > 0 ? 'Còn phải thanh toán' : 'Tổng cộng'}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(paymentInfo.remaining)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Payment */}
          <div className="space-y-4">
            <Card className="border-none shadow-sm bg-slate-900 text-white">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold">Phương thức thanh toán</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Chọn hình thức thanh toán</p>
                </div>

                <div className="space-y-3">
                  <div
                    onClick={() => setPaymentMethod('CASH')}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer',
                      paymentMethod === 'CASH'
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10',
                    )}
                  >
                    <div className={cn('p-3 rounded-xl', paymentMethod === 'CASH' ? 'bg-primary text-white' : 'bg-white/10')}>
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Tiền mặt</p>
                      <p className="text-[11px] text-slate-400">Thanh toán trực tiếp tại quầy</p>
                    </div>
                    {paymentMethod === 'CASH' && <Check className="w-4 h-4 text-primary ml-auto" />}
                  </div>

                  <div
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer',
                      paymentMethod === 'VIETQR'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10',
                    )}
                  >
                    <div className={cn('p-3 rounded-xl', paymentMethod === 'VIETQR' ? 'bg-emerald-500 text-white' : 'bg-white/10')}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Chuyển khoản / QR</p>
                      <p className="text-[11px] text-slate-400">VietQR tự động xác nhận</p>
                    </div>
                    {paymentMethod === 'VIETQR' && <Check className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </div>
                </div>

                {selectedBooking && (
                  <div className="bg-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Khách hàng</span>
                      <span className="font-semibold">{selectedBooking.customer?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Dịch vụ</span>
                      <span
                        className="font-semibold underline decoration-dotted decoration-slate-400 cursor-help"
                        title={selectedBooking.services?.map((s: any) => s.service?.name).join('\n')}
                      >
                        {selectedBooking.services?.length} dịch vụ
                      </span>
                    </div>
                    {paymentInfo.depositPaid > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-400">Đã cọc</span>
                        <span className="font-semibold text-emerald-400">{formatPrice(paymentInfo.depositPaid)}</span>
                      </div>
                    )}
                    <div className="h-px bg-white/10" />
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Thanh toán</span>
                      <span className="text-xl font-bold text-primary">{formatPrice(paymentInfo.remaining)}</span>
                    </div>
                  </div>
                )}

                {selectedBooking?.status === 'COMPLETED' && selectedBooking?.paymentStatus === 'DEPOSIT_PAID' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-200">
                      Thợ đã hoàn tất phục vụ. Khách đã cọc trước {formatPrice(paymentInfo.depositPaid)}, cần thu thêm <strong>{formatPrice(paymentInfo.remaining)}</strong>.
                    </p>
                  </div>
                )}

                <Button
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold"
                  disabled={!selectedBooking || checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate()}
                >
                  {checkoutMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-5 h-5 mr-2" />
                  )}
                  Xác nhận Thanh toán {selectedBooking ? formatPrice(paymentInfo.remaining) : ''}
                </Button>

                {!selectedBooking && (
                  <p className="text-xs text-slate-500 text-center">Vui lòng chọn booking để thanh toán</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── HISTORY TAB ───────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Summary Cards + Date Filter + Search/Method */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value || dayjs().format('YYYY-MM-DD'))}
                  className="w-44 rounded-xl h-10 border-slate-200"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-10 text-xs font-semibold"
                  onClick={() => setHistoryDate(dayjs().format('YYYY-MM-DD'))}
                >
                  Hôm nay
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-10 text-xs font-semibold"
                onClick={handleExportSummary}
                disabled={!historyData?.bookings?.length}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Xuất CSV
              </Button>
            </div>
            {/* Search + method filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  placeholder="Tìm tên khách, mã booking..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="h-9 pl-8 pr-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-56"
                />
              </div>
              <select
                title="Payment method filter"
                value={historyMethod}
                onChange={e => setHistoryMethod(e.target.value)}
                className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="ALL">Tất cả PTTT</option>
                <option value="CASH">Tiền mặt</option>
                <option value="VIETQR">Chuyển khoản / QR</option>
              </select>
              {(historySearch || historyMethod !== 'ALL') && (
                <button
                  onClick={() => { setHistorySearch(''); setHistoryMethod('ALL'); }}
                  className="text-xs font-semibold text-amber-700 hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-rose-50 border border-amber-200 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Xoá lọc
                </button>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          {historyData?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tổng thu</span>
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Wallet className="w-3.5 h-3.5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{formatPrice(historyData.summary.totalAmount)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{historyData.summary.totalTransactions} giao dịch</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tiền mặt</span>
                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">{formatPrice(historyData.summary.totalCash)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Chuyển khoản</span>
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{formatPrice(historyData.summary.totalTransfer)}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lượt TT</span>
                    <div className="p-1.5 bg-amber-50 rounded-lg">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{historyData.summary.totalPayments}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* History List */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-base font-bold">
                Lịch sử thanh toán — {historyDate ? dayjs(historyDate).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')}
              </CardTitle>
              <CardDescription>Danh sách tất cả giao dịch trong ngày để kết toán ca</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : !filteredHistory?.length ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <History className="w-12 h-12 text-slate-200" />
                  <p className="text-slate-400 font-medium">{historySearch || historyMethod !== 'ALL' ? 'Không tìm thấy giao dịch phù hợp' : 'Không có giao dịch nào trong ngày này'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((b: any) => {
                    const total = Number(b.totalAmount);
                    const paidPayments = b.payments || [];
                    const totalPaid = paidPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
                    const methods = [...new Set(paidPayments.map((p: any) => p.method))];

                    return (
                      <div
                        key={b.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all cursor-pointer"
                        onClick={() => setShowInvoice({
                          booking: b,
                          paymentInfo: { total, depositPaid: 0, remaining: totalPaid },
                          paymentMethod: paidPayments[paidPayments.length - 1]?.method || 'CASH',
                        })}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={b.customer?.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {b.customer?.name?.charAt(0) || 'K'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-slate-900">{b.customer?.name}</p>
                            <Badge variant="outline" className="text-[9px] h-5 border-slate-200">
                              #{b.bookingCode?.slice(-6) || b.id?.slice(-6)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{b.timeSlot}</span>
                            <span>•</span>
                            <span>{b.services?.length} dịch vụ</span>
                            {b.staff && (
                              <>
                                <span>•</span>
                                <span>{b.staff.user?.name}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {methods.includes('CASH') && (
                              <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 border">
                                <Banknote className="w-2.5 h-2.5 mr-0.5" /> Tiền mặt
                              </Badge>
                            )}
                            {(methods.includes('VIETQR') || methods.includes('BANK_TRANSFER')) && (
                              <Badge className="text-[9px] bg-blue-50 text-blue-700 border-blue-200 border">
                                <QrCode className="w-2.5 h-2.5 mr-0.5" /> CK
                              </Badge>
                            )}
                            {b.paymentStatus === 'PAID' && (
                              <Badge className="text-[9px] bg-emerald-50 text-emerald-700 border-none">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Đã TT đủ
                              </Badge>
                            )}
                            {b.paymentStatus === 'DEPOSIT_PAID' && (
                              <Badge className="text-[9px] bg-amber-50 text-amber-700 border-none">
                                Chỉ cọc
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-bold text-primary">{formatPrice(totalPaid)}</p>
                          {totalPaid < total && (
                            <p className="text-[10px] text-slate-400">/ {formatPrice(total)}</p>
                          )}
                          {paidPayments[0]?.paidAt && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {dayjs(paidPayments[0].paidAt).format('HH:mm')}
                            </p>
                          )}
                        </div>

                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary shrink-0">
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── INVOICE SHEET ──────────────────────────────────────── */}
      <Sheet open={!!showInvoice} onOpenChange={() => setShowInvoice(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold font-heading italic text-primary">
              Hóa đơn thanh toán
            </SheetTitle>
            <SheetDescription>
              Xem trước và in hóa đơn
            </SheetDescription>
          </SheetHeader>

          {showInvoice && (
            <div className="mt-4 space-y-4">
              {/* Invoice Preview */}
              <div ref={invoiceRef} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <InvoicePrint
                  booking={showInvoice.booking}
                  paymentInfo={showInvoice.paymentInfo}
                  paymentMethod={showInvoice.paymentMethod}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 font-semibold"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4 mr-2" /> In hóa đơn
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl font-semibold"
                  onClick={() => {
                    setShowInvoice(null);
                    toast.success('Đã đóng hóa đơn');
                  }}
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
