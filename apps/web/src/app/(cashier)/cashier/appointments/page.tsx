'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi } from '@/lib/api';
import {
  Search,
  Calendar,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  PENDING: { label: 'Chờ duyệt', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED: { label: 'Đã xác nhận', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  IN_PROGRESS: { label: 'Đang phục vụ', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Hoàn thành', style: 'bg-slate-50 text-slate-600 border-slate-200' },
  CANCELLED: { label: 'Đã hủy', style: 'bg-rose-50 text-rose-600 border-rose-200' },
};

const FILTER_TABS = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [apptPage, setApptPage] = useState(1);
  const APPT_LIMIT = 15;

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['cashier', 'bookings', { status: statusFilter, date: dateFilter, search: searchTerm }],
    queryFn: () => cashierApi.getBookings({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      date: dateFilter || undefined,
      search: searchTerm || undefined,
    }),
  });

  // Client-side pagination
  const allBookings: any[] = Array.isArray(bookings) ? bookings : [];
  const totalApptPages = Math.ceil(allBookings.length / APPT_LIMIT);
  const pagedBookings = useMemo(
    () => allBookings.slice((apptPage - 1) * APPT_LIMIT, apptPage * APPT_LIMIT),
    [allBookings, apptPage]
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => cashierApi.updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      queryClient.invalidateQueries({ queryKey: ['cashier'] });
      setSelectedBooking(null);
    },
    onError: () => toast.error('Không thể cập nhật trạng thái'),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Lịch hẹn</h1>
          <p className="text-slate-500 mt-1">Quản lý tất cả booking tại chi nhánh</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary" />
            <Input
              placeholder="Tìm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-56 rounded-xl h-10 border-slate-200"
            />
          </div>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setApptPage(1); }}
            className="w-40 rounded-xl h-10 border-slate-200"
          />
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setApptPage(1); }}>
        <TabsList className="bg-slate-100/50 p-1 rounded-xl h-10 border border-slate-100">
          {FILTER_TABS.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              {s === 'ALL' ? 'Tất cả' : STATUS_CONFIG[s]?.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : !bookings?.length ? (
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="py-20 flex flex-col items-center gap-4">
            <Calendar className="w-12 h-12 text-slate-200" />
            <p className="text-slate-400 font-medium">Không tìm thấy lịch hẹn nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pagedBookings.map((b: any) => (
            <Card key={b.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Time */}
                  <div className="w-24 shrink-0 bg-slate-50 flex flex-col items-center justify-center p-4 border-r border-slate-100 text-center">
                    <p className="text-lg font-bold text-slate-900">{b.timeSlot}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{b.endTime}</p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={b.customer?.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {b.customer?.name?.charAt(0) || 'K'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{b.customer?.name}</p>
                        <p className="text-xs text-slate-400">{b.customer?.phone || 'Không có SĐT'}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {b.services?.slice(0, 3).map((s: any) => (
                            <Badge key={s.id} variant="outline" className="text-[9px] border-slate-200 text-slate-500 h-5">
                              {s.service?.name}
                            </Badge>
                          ))}
                          {b.services?.length > 3 && (
                            <Badge variant="outline" className="text-[9px] h-5">+{b.services.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {b.staff && (
                        <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={b.staff?.user?.avatar} />
                            <AvatarFallback className="bg-slate-200 text-[10px]">{b.staff?.user?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-slate-600">{b.staff?.user?.name}</span>
                        </div>
                      )}
                      <Badge className={cn('text-[10px] border', STATUS_CONFIG[b.status]?.style)}>
                        {STATUS_CONFIG[b.status]?.label || b.status}
                      </Badge>
                      <span className="text-sm font-bold text-primary">{formatPrice(Number(b.totalAmount))}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-primary"
                        onClick={() => setSelectedBooking(b)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalApptPages > 1 && (
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-xs text-slate-400">
            Trang {apptPage}/{totalApptPages} ({allBookings.length} lịch hẹn)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setApptPage(p => Math.max(1, p - 1))}
              disabled={apptPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalApptPages) }, (_, i) => {
              const p = apptPage <= 3 ? i + 1 : apptPage + i - 2;
              if (p < 1 || p > totalApptPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setApptPage(p)}
                  className={cn(
                    'w-7 h-7 rounded-lg text-xs font-bold',
                    p === apptPage ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setApptPage(p => Math.min(totalApptPages, p + 1))}
              disabled={apptPage >= totalApptPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Booking Detail Sheet */}
      <Sheet open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold font-heading italic text-primary">
              Chi tiết lịch hẹn
            </SheetTitle>
            <SheetDescription>
              #{selectedBooking?.bookingCode}
            </SheetDescription>
          </SheetHeader>

          {selectedBooking && (
            <div className="space-y-6 mt-6">
              {/* Customer */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={selectedBooking.customer?.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {selectedBooking.customer?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">{selectedBooking.customer?.name}</p>
                    <p className="text-sm text-slate-400">{selectedBooking.customer?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedBooking.timeSlot} - {selectedBooking.endTime}</p>
                  <p className="text-sm text-slate-400">{dayjs(selectedBooking.date).format('DD/MM/YYYY')}</p>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Dịch vụ</p>
                {selectedBooking.services?.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-600">{s.service?.name}</span>
                    <span className="text-sm font-semibold">{formatPrice(Number(s.price))}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="font-bold text-primary text-lg">{formatPrice(Number(selectedBooking.totalAmount))}</span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Cập nhật trạng thái</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedBooking.status === 'CONFIRMED' && (
                    <Button
                      className="rounded-xl bg-blue-600 hover:bg-blue-700"
                      onClick={() => statusMutation.mutate({ id: selectedBooking.id, status: 'IN_PROGRESS' })}
                      disabled={statusMutation.isPending}
                    >
                      Bắt đầu phục vụ
                    </Button>
                  )}
                  {(selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'IN_PROGRESS') && (
                    <Button
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => statusMutation.mutate({ id: selectedBooking.id, status: 'COMPLETED' })}
                      disabled={statusMutation.isPending}
                    >
                      Hoàn thành
                    </Button>
                  )}
                  {selectedBooking.status !== 'COMPLETED' && selectedBooking.status !== 'CANCELLED' && (
                    <Button
                      variant="outline"
                      className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => statusMutation.mutate({ id: selectedBooking.id, status: 'CANCELLED' })}
                      disabled={statusMutation.isPending}
                    >
                      Hủy booking
                    </Button>
                  )}
                </div>
              </div>

              {selectedBooking.note && (
                <div className="bg-amber-50 p-3 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Ghi chú</p>
                  <p className="text-sm text-amber-600">{selectedBooking.note}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
