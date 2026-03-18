'use client';

import { useState } from 'react';
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
  Plus,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function CheckoutPage() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR'>('CASH');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['cashier', 'checkout-eligible'],
    queryFn: cashierApi.getCheckoutEligibleBookings,
    refetchInterval: 15000,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => cashierApi.checkout(selectedBooking.id, paymentMethod),
    onSuccess: () => {
      toast.success('Thanh toán thành công!');
      setSelectedBooking(null);
      queryClient.invalidateQueries({ queryKey: ['cashier'] });
    },
    onError: () => toast.error('Lỗi khi thực hiện thanh toán'),
  });

  const total = selectedBooking?.services?.reduce(
    (acc: number, s: any) => acc + Number(s.price || s.service?.price || 0), 0
  ) || Number(selectedBooking?.totalAmount || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Thanh toán</h1>
        <p className="text-slate-500 mt-1">Xử lý thanh toán cho các booking đã sẵn sàng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Booking List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Booking sẵn sàng thanh toán</CardTitle>
                  <CardDescription>Chọn booking để xử lý thanh toán</CardDescription>
                </div>
                {bookings?.length > 0 && (
                  <Badge className="bg-primary/10 text-primary border-none">{bookings.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : !bookings?.length ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Receipt className="w-12 h-12 text-slate-200" />
                  <p className="text-slate-400 font-medium">Không có booking nào sẵn sàng thanh toán</p>
                </div>
              ) : (
                bookings.map((b: any) => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer',
                      selectedBooking?.id === b.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200',
                    )}
                  >
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
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatPrice(Number(b.totalAmount))}</p>
                      <Badge className={cn('text-[9px] border mt-1',
                        b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      )}>
                        {b.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Đang phục vụ'}
                      </Badge>
                    </div>
                    {selectedBooking?.id === b.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Bill Detail */}
          {selectedBooking && (
            <Card className="border-none shadow-sm bg-white animate-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="border-b border-slate-50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">
                    Hóa đơn <span className="text-slate-300 font-normal text-sm">#{selectedBooking.id?.slice(-6).toUpperCase()}</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs">
                    <Printer className="w-3.5 h-3.5 mr-1.5" /> In
                  </Button>
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
                        <p className="text-[11px] text-slate-400">{s.duration} phút</p>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-900">{formatPrice(Number(s.price))}</p>
                  </div>
                ))}

                <div className="h-px bg-slate-100" />

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
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
                    <span className="font-semibold">{selectedBooking.services?.length} item</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Thanh toán</span>
                    <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
                  </div>
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
                Xác nhận Thanh toán
              </Button>

              {!selectedBooking && (
                <p className="text-xs text-slate-500 text-center">Vui lòng chọn booking để thanh toán</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
