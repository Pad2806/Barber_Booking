'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi } from '@/lib/api';
import {
  Smartphone,
  Check,
  X,
  Clock,
  User,
  Scissors,
  Loader2,
  Inbox,
  ShieldCheck,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  UNPAID: { label: 'Chưa thanh toán', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  PENDING: { label: 'Chờ thanh toán', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  DEPOSIT_PAID: { label: 'Đã cọc', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAID: { label: 'Đã thanh toán', color: 'bg-green-50 text-green-700 border-green-200' },
};

export default function OnlineBookingsPage() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [sheetMode, setSheetMode] = useState<'approve' | 'reject' | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['cashier', 'pending-bookings'],
    queryFn: cashierApi.getPendingBookings,
    refetchInterval: 15000,
  });

  // Only fetch barbers if customer hasn't chosen one yet
  const hasBarber = !!selectedBooking?.staffId;
  const hasDeposit = selectedBooking?.paymentStatus === 'DEPOSIT_PAID';

  const { data: barbers } = useQuery({
    queryKey: ['cashier', 'barbers', selectedBooking?.date, selectedBooking?.timeSlot],
    queryFn: () => cashierApi.getAvailableBarbers(
      dayjs(selectedBooking.date).format('YYYY-MM-DD'),
      selectedBooking.timeSlot,
    ),
    enabled: !!selectedBooking && sheetMode === 'approve' && !hasBarber,
  });

  const approveMutation = useMutation({
    mutationFn: () => cashierApi.approveBooking(selectedBooking.id, {
      staffId: hasBarber ? undefined : (selectedStaffId || undefined),
    }),
    onSuccess: () => {
      toast.success('Đã duyệt lịch hẹn');
      closeSheet();
      queryClient.invalidateQueries({ queryKey: ['cashier'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể duyệt lịch hẹn'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => cashierApi.rejectBooking(selectedBooking.id, rejectReason),
    onSuccess: () => {
      toast.success('Đã từ chối lịch hẹn');
      closeSheet();
      queryClient.invalidateQueries({ queryKey: ['cashier'] });
    },
    onError: () => toast.error('Không thể từ chối lịch hẹn'),
  });

  const closeSheet = () => {
    setSelectedBooking(null);
    setSheetMode(null);
    setSelectedStaffId('');
    setRejectReason('');
  };

  // Can approve? If no barber chosen, must select one first
  const canApprove = hasBarber || !!selectedStaffId;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Duyệt lịch Online</h1>
          <p className="text-slate-500 mt-1">Xem và duyệt các booking từ website</p>
        </div>
        {bookings?.length > 0 && (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-sm px-3 py-1">
            {bookings.length} chờ duyệt
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : !bookings?.length ? (
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="py-20 flex flex-col items-center gap-4">
            <div className="p-6 rounded-full bg-slate-50">
              <Inbox className="w-12 h-12 text-slate-200" />
            </div>
            <p className="text-slate-400 font-medium">Không có booking nào chờ duyệt</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((b: any) => {
            const bHasBarber = !!b.staffId;
            const bHasDeposit = b.paymentStatus === 'DEPOSIT_PAID';
            const paymentInfo = paymentStatusLabels[b.paymentStatus] || paymentStatusLabels.UNPAID;

            return (
              <Card key={b.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 shrink-0 border-2 border-primary/10">
                      <AvatarImage src={b.customer?.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {b.customer?.name?.charAt(0) || 'K'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{b.customer?.name || 'Khách hàng'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.customer?.phone}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {b.timeSlot} • {dayjs(b.date).format('DD/MM/YYYY')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {b.services?.map((s: any) => (
                          <Badge key={s.id} variant="outline" className="text-[10px] border-slate-200 text-slate-500">
                            {s.service?.name}
                          </Badge>
                        ))}
                      </div>

                      {/* Barber & Payment status indicators */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {bHasBarber && (
                          <Badge className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Đã chọn thợ: {b.staff?.user?.name}
                          </Badge>
                        )}
                        <Badge className={cn('text-[10px]', paymentInfo.color)}>
                          <CreditCard className="w-3 h-3 mr-1" />
                          {paymentInfo.label}
                        </Badge>
                      </div>

                      <p className="text-sm font-bold text-primary mt-2">
                        {formatPrice(Number(b.totalAmount))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10"
                      onClick={() => { setSelectedBooking(b); setSheetMode('approve'); }}
                    >
                      <Check className="w-4 h-4 mr-2" /> Duyệt
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl h-10"
                      onClick={() => { setSelectedBooking(b); setSheetMode('reject'); }}
                    >
                      <X className="w-4 h-4 mr-2" /> Từ chối
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Sheet */}
      <Sheet open={sheetMode === 'approve'} onOpenChange={() => closeSheet()}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold font-heading italic text-primary">
              Duyệt lịch hẹn
            </SheetTitle>
            <SheetDescription>
              {hasBarber
                ? hasDeposit
                  ? 'Khách đã chọn thợ và đặt cọc — chỉ cần duyệt'
                  : 'Khách đã chọn thợ — chỉ cần duyệt'
                : 'Khách chưa chọn thợ — hãy chọn thợ cho khách'}
            </SheetDescription>
          </SheetHeader>

          {selectedBooking && (
            <div className="space-y-6 mt-6">
              {/* Booking info */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="font-semibold text-slate-900">{selectedBooking.customer?.name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedBooking.timeSlot} • {dayjs(selectedBooking.date).format('DD/MM/YYYY')}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedBooking.services?.map((s: any) => (
                    <Badge key={s.id} variant="outline" className="text-[10px]">
                      {s.service?.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm font-bold text-primary mt-2">
                  {formatPrice(Number(selectedBooking.totalAmount))}
                </p>
              </div>

              {/* Case 1: Customer already chose barber */}
              {hasBarber && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-700">Khách đã chọn thợ</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedBooking.staff?.user?.avatar} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-bold">
                        {selectedBooking.staff?.user?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedBooking.staff?.user?.name}
                      </p>
                      <p className="text-[11px] text-slate-500">Thợ do khách hàng chọn</p>
                    </div>
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                  </div>

                  {hasDeposit && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Đã thanh toán cọc</p>
                        <p className="text-[11px] text-emerald-600/70">
                          Khách đã đặt cọc {formatPrice(Number(selectedBooking.totalAmount) * 0.25)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: Customer hasn't chosen barber — show picker */}
              {!hasBarber && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-700">
                      Khách chưa chọn thợ — vui lòng chọn giùm
                    </p>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {barbers?.map((barber: any) => (
                      <div
                        key={barber.id}
                        onClick={() => barber.isAvailable && setSelectedStaffId(barber.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer',
                          selectedStaffId === barber.id
                            ? 'border-primary bg-primary/5'
                            : barber.isAvailable
                              ? 'border-slate-100 hover:border-slate-200'
                              : 'border-slate-50 opacity-50 cursor-not-allowed',
                        )}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={barber.avatar} />
                          <AvatarFallback className="bg-slate-100 text-xs">{barber.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{barber.name}</p>
                          <p className="text-[11px] text-slate-400">{barber.reason}</p>
                        </div>
                        {selectedStaffId === barber.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending || !canApprove}
              >
                {approveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {hasBarber
                  ? hasDeposit
                    ? 'Xác nhận duyệt (Đã cọc)'
                    : 'Xác nhận duyệt'
                  : selectedStaffId
                    ? 'Xác nhận duyệt & gán thợ'
                    : 'Vui lòng chọn thợ để duyệt'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Sheet */}
      <Sheet open={sheetMode === 'reject'} onOpenChange={() => closeSheet()}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold font-heading italic text-rose-600">
              Từ chối lịch hẹn
            </SheetTitle>
            <SheetDescription>
              Nhập lý do từ chối để thông báo cho khách hàng
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            <Textarea
              placeholder="Lý do từ chối (VD: Salon hết chỗ, đang bảo trì...)"
              className="min-h-[120px] rounded-xl"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <Button
              className="w-full rounded-xl h-11 bg-rose-600 hover:bg-rose-700"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
            >
              {rejectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác nhận từ chối
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

