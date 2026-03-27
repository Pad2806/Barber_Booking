'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi, staffApi, usersApi } from '@/lib/api';
import {
  MapPin,
  Clock,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Scissors,
  CalendarDays,
  CreditCard,
  Play,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BarberBookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['bookings', 'barber', me?.staff?.id, search],
    queryFn: () =>
      bookingApi.getAll({
        staffId: me?.staff?.id,
        search: search || undefined,
        limit: 50,
      }),
    enabled: !!me?.staff?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      staffApi.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Cập nhật trạng thái thành công');
      // Refresh selected booking in dialog
      if (selectedBooking) {
        const updatedBookings = response?.data || [];
        const refreshed = updatedBookings.find((b: any) => b.id === selectedBooking.id);
        if (refreshed) setSelectedBooking(refreshed);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    },
  });

  const allBookings = response?.data || [];

  // Filter bookings by status
  const bookings = statusFilter === 'ALL'
    ? allBookings
    : allBookings.filter((b: any) => b.status === statusFilter);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Chờ xác nhận', class: 'bg-slate-50 text-slate-600 border-slate-200' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', class: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'IN_PROGRESS':
        return { label: 'Đang phục vụ', class: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'COMPLETED':
        return { label: 'Hoàn tất', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CANCELLED':
        return { label: 'Đã hủy', class: 'bg-rose-50 text-rose-600 border-rose-200' };
      default:
        return { label: status, class: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  const statusFilters = [
    { key: 'ALL', label: 'Tất cả', count: allBookings.length },
    { key: 'CONFIRMED', label: 'Đã xác nhận', count: allBookings.filter((b: any) => b.status === 'CONFIRMED').length },
    { key: 'IN_PROGRESS', label: 'Đang phục vụ', count: allBookings.filter((b: any) => b.status === 'IN_PROGRESS').length },
    { key: 'COMPLETED', label: 'Hoàn tất', count: allBookings.filter((b: any) => b.status === 'COMPLETED').length },
    { key: 'CANCELLED', label: 'Đã hủy', count: allBookings.filter((b: any) => b.status === 'CANCELLED').length },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-6xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C1E12] tracking-tight">
            Booking được phân công
          </h1>
          <p className="text-sm text-[#8B7355] mt-0.5">
            Danh sách các khách hàng bạn sẽ phục vụ
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]/50" />
            <Input
              placeholder="Tìm theo tên khách, mã booking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-[#E8E0D4] bg-white focus:ring-[#C8A97E]/20 focus:border-[#C8A97E] text-sm font-medium"
            />
          </div>
        </div>
        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                statusFilter === f.key
                  ? 'bg-[#1C1612] text-white border-[#1C1612]'
                  : 'bg-white text-[#8B7355] border-[#E8E0D4] hover:border-[#C8A97E] hover:text-[#C8A97E]'
              )}
            >
              {f.label}
              {f.count > 0 && (
                <span className={cn(
                  'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md',
                  statusFilter === f.key ? 'bg-white/20' : 'bg-[#FAF8F5]'
                )}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Booking list */}
      <div className="space-y-3">
        {bookings.length > 0 ? (
          bookings.map((booking: any) => {
            const statusInfo = getStatusInfo(booking.status);
            return (
              <Card
                key={booking.id}
                className={cn(
                  'border border-[#E8E0D4]/60 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow group',
                  booking.status === 'IN_PROGRESS' && 'ring-2 ring-amber-300/50 border-amber-200'
                )}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Date & Time */}
                    <div className="md:w-40 bg-[#FAF8F5] p-4 md:p-5 flex md:flex-col items-center justify-center gap-3 md:gap-1 border-b md:border-b-0 md:border-r border-[#E8E0D4]/40 shrink-0">
                      <p className="text-[10px] font-semibold uppercase text-[#8B7355] tracking-wider">
                        {format(new Date(booking.date), 'EEEE', { locale: vi })}
                      </p>
                      <p className="text-2xl font-bold text-[#2C1E12] leading-none">
                        {format(new Date(booking.date), 'dd/MM')}
                      </p>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-[#E8E0D4]/50 shadow-sm">
                        <Clock className="w-3 h-3 text-[#C8A97E]" />
                        <span className="text-xs font-semibold text-[#2C1E12]">
                          {booking.timeSlot}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-4 md:p-5 flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex gap-4">
                        <Avatar className="h-12 w-12 border-2 border-[#E8E0D4] shrink-0">
                          <AvatarImage src={booking.customer?.avatar} />
                          <AvatarFallback className="bg-[#FAF8F5] text-[#C8A97E] font-bold text-sm">
                            {booking.customer?.name?.charAt(0) || 'K'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5 min-w-0">
                          <div>
                            <h3 className="text-sm font-bold text-[#2C1E12] truncate">
                              {booking.customer?.name || 'Khách lẻ'}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'rounded-md font-semibold text-[10px] px-2 py-0',
                                  statusInfo.class
                                )}
                              >
                                {statusInfo.label}
                              </Badge>
                              <span className="text-[10px] text-[#8B7355]">
                                {booking.bookingCode}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs text-[#8B7355]">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{booking.services?.length || 0} Dịch vụ</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-blue-500" />
                              <span>{booking.salon?.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex flex-col justify-between items-end gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] font-semibold text-[#8B7355] uppercase tracking-wider">
                            Tổng tiền
                          </p>
                          <p className="text-lg font-bold text-[#C8A97E]">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(booking.totalAmount)}
                          </p>
                        </div>

                        {/* Action buttons inline */}
                        <div className="flex items-center gap-2">
                          {booking.status === 'CONFIRMED' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({
                                  id: booking.id,
                                  status: 'IN_PROGRESS',
                                });
                              }}
                              disabled={updateStatusMutation.isPending}
                              className="bg-[#1C1612] hover:bg-[#2C1E12] text-white rounded-xl h-9 px-4 text-xs font-semibold"
                            >
                              <Play className="w-3.5 h-3.5 mr-1.5" /> Bắt đầu cắt
                            </Button>
                          )}
                          {booking.status === 'IN_PROGRESS' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({
                                  id: booking.id,
                                  status: 'COMPLETED',
                                });
                              }}
                              disabled={updateStatusMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-4 text-xs font-semibold shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Hoàn tất
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsDetailOpen(true);
                            }}
                            variant="outline"
                            className="rounded-xl border-[#E8E0D4] text-[#8B7355] hover:text-[#C8A97E] hover:border-[#C8A97E] h-9 px-4 text-xs font-semibold"
                          >
                            Chi tiết
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl p-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#E8E0D4]">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-[#C8A97E]/25" />
            </div>
            <h3 className="text-lg font-bold text-[#2C1E12] mb-1">Không tìm thấy booking</h3>
            <p className="text-sm text-[#8B7355] max-w-sm">
              Bạn chưa được phân công bất kỳ lịch đặt nào hoặc không có booking phù hợp với tìm
              kiếm.
            </p>
          </div>
        )}
      </div>

      {/* Booking Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[540px] border border-[#E8E0D4] shadow-xl bg-white rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 bg-[#FAF8F5] border-b border-[#E8E0D4]/40 text-left">
            <div className="flex items-center gap-3 mb-3">
              <Badge
                className={cn(
                  'rounded-md font-semibold text-[10px] px-2 py-0.5 border',
                  getStatusInfo(selectedBooking?.status).class
                )}
              >
                {getStatusInfo(selectedBooking?.status).label}
              </Badge>
              <span className="text-[10px] text-[#8B7355] font-medium">
                {selectedBooking?.bookingCode}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-[#2C1E12]">
              Chi tiết booking
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8B7355]">
              Thông tin chi tiết lịch hẹn
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-[#E8E0D4] shrink-0">
                  <AvatarImage src={selectedBooking?.customer?.avatar} />
                  <AvatarFallback className="bg-[#FAF8F5] text-[#C8A97E] text-lg font-bold">
                    {selectedBooking?.customer?.name?.charAt(0) || 'K'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[10px] font-semibold text-[#8B7355] uppercase tracking-wider">
                    Khách hàng
                  </p>
                  <h4 className="text-lg font-bold text-[#2C1E12]">
                    {selectedBooking?.customer?.name || 'Khách vãng lai'}
                  </h4>
                  <p className="text-xs text-[#8B7355]">
                    {selectedBooking?.customer?.phone || 'Chưa có SĐT'}
                  </p>
                </div>
              </div>

              {/* Schedule & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E0D4]/40">
                  <div className="flex items-center gap-1.5 text-[#C8A97E] mb-2">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      Thời gian
                    </span>
                  </div>
                  <p className="font-bold text-[#2C1E12] text-sm">
                    {selectedBooking?.date &&
                      format(new Date(selectedBooking.date), 'dd/MM/yyyy')}
                  </p>
                  <div className="text-xs text-[#8B7355] mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {selectedBooking?.timeSlot}
                  </div>
                </div>
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E0D4]/40">
                  <div className="flex items-center gap-1.5 text-[#C8A97E] mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      Chi nhánh
                    </span>
                  </div>
                  <p className="font-bold text-[#2C1E12] text-sm truncate">
                    {selectedBooking?.salon?.name}
                  </p>
                  <p className="text-xs text-[#8B7355] mt-0.5 truncate">
                    {selectedBooking?.salon?.address}
                  </p>
                </div>
              </div>

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">
                    Dịch vụ
                  </h5>
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-[#FAF8F5] text-[#8B7355] border border-[#E8E0D4]/50"
                  >
                    {selectedBooking?.services?.length} mục
                  </Badge>
                </div>
                <div className="space-y-2">
                  {selectedBooking?.services?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-white border border-[#E8E0D4]/40 rounded-xl hover:border-[#C8A97E]/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#C8A97E] group-hover:bg-[#C8A97E]/10 transition-colors">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#2C1E12]">
                            {item.service?.name}
                          </p>
                          <p className="text-[10px] text-[#8B7355]">
                            {item.duration || item.service?.duration} phút
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-[#2C1E12] text-sm">{formatPrice(Number(item.price || item.service?.price || 0))}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              {selectedBooking?.note && (
                <div>
                  <h5 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">
                    Ghi chú
                  </h5>
                  <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl relative">
                    <FileText className="absolute top-4 right-4 w-6 h-6 text-amber-900/5" />
                    <p className="text-sm text-amber-900/70 leading-relaxed">
                      &quot;{selectedBooking.note}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className="bg-[#1C1612] rounded-xl p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#C8A97E]/10 blur-[40px] rounded-full" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between text-white/40">
                    <p className="text-[10px] font-semibold uppercase tracking-wider">
                      Tổng thanh toán
                    </p>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white/70">Tổng cộng</span>
                    <span className="text-xl font-bold text-[#C8A97E]">
                      {formatPrice(selectedBooking?.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dialog footer with action buttons */}
          <DialogFooter className="p-4 border-t border-[#E8E0D4]/40">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
              {/* Show action buttons based on booking status */}
              {selectedBooking?.status === 'CONFIRMED' && (
                <>
                  <Button
                    onClick={() => {
                      updateStatusMutation.mutate(
                        { id: selectedBooking.id, status: 'IN_PROGRESS' },
                        {
                          onSuccess: () => {
                            setSelectedBooking((prev: any) =>
                              prev ? { ...prev, status: 'IN_PROGRESS' } : prev
                            );
                          },
                        }
                      );
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="bg-[#1C1612] hover:bg-[#2C1E12] text-white rounded-xl h-11 flex-1 font-semibold text-sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Bắt đầu phục vụ
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn hủy lịch này?')) {
                        updateStatusMutation.mutate(
                          { id: selectedBooking.id, status: 'CANCELLED' },
                          {
                            onSuccess: () => {
                              setSelectedBooking((prev: any) =>
                                prev ? { ...prev, status: 'CANCELLED' } : prev
                              );
                            },
                          }
                        );
                      }
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-11 font-medium text-sm"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Hủy lịch
                  </Button>
                </>
              )}

              {selectedBooking?.status === 'IN_PROGRESS' && (
                <Button
                  onClick={() => {
                    updateStatusMutation.mutate(
                      { id: selectedBooking.id, status: 'COMPLETED' },
                      {
                        onSuccess: () => {
                          setSelectedBooking((prev: any) =>
                            prev ? { ...prev, status: 'COMPLETED' } : prev
                          );
                        },
                      }
                    );
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 flex-1 font-semibold text-sm shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Đã hoàn tất — Xong
                </Button>
              )}

              {selectedBooking?.status === 'PENDING' && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex-1">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Khách chưa thanh toán. Chờ chuyển khoản để xác nhận.
                  </p>
                </div>
              )}

              {(selectedBooking?.status === 'COMPLETED' || selectedBooking?.status === 'CANCELLED') && (
                <Button
                  variant="ghost"
                  onClick={() => setIsDetailOpen(false)}
                  className="w-full h-11 rounded-xl font-medium text-sm text-[#8B7355] hover:bg-[#FAF8F5]"
                >
                  Đóng
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
