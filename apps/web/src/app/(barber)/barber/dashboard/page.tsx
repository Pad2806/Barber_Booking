'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, usersApi } from '@/lib/api';
import {
  Clock,
  Calendar,
  Calendar as CalendarIcon,
  Star,
  TrendingUp,
  ChevronRight,
  MapPin,
  Play,
  CheckCircle2,
  XCircle,
  ClipboardList,
  AlertCircle,
  Users,
  Info,
  CalendarDays,
  History,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function BarberDashboard(): JSX.Element {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isDayOffDialogOpen, setIsDayOffDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [dayOffDate, setDayOffDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dayOffReason, setDayOffReason] = useState('');

  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['staff', 'dashboard-stats'],
    queryFn: () => staffApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['staff', 'today-schedule', format(new Date(), 'yyyy-MM-dd')],
    queryFn: () => staffApi.getTodaySchedule(format(new Date(), 'yyyy-MM-dd')),
  });

  const { data: customerHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['staff', 'customer-history', selectedCustomerId],
    queryFn: () =>
      selectedCustomerId ? staffApi.getCustomerHistory(selectedCustomerId) : null,
    enabled: !!selectedCustomerId && isHistoryDialogOpen,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      staffApi.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Cập nhật trạng thái thành công');
    },
    onError: () => toast.error('Có lỗi xảy ra khi cập nhật'),
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ customerId, content }: { customerId: string; content: string }) =>
      staffApi.addCustomerNote(customerId, content),
    onSuccess: () => {
      setSelectedCustomerId(null);
      setIsNoteDialogOpen(false);
      setNoteContent('');
      toast.success('Đã lưu ghi chú khách hàng');
    },
  });

  const registerDayOffMutation = useMutation({
    mutationFn: (data: { date: string; reason?: string }) =>
      staffApi.registerDayOff(data.date, data.reason),
    onSuccess: () => {
      setIsDayOffDialogOpen(false);
      toast.success('Đã gửi yêu cầu nghỉ phép. Chờ quản lý duyệt.');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Không thể đăng ký nghỉ'),
  });

  if (isLoadingStats || isLoadingSchedule) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
        <div className="h-28 bg-white rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl" />
      </div>
    );
  }

  const statItems = [
    {
      label: 'Lịch hôm nay',
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Đã hoàn thành',
      value: stats?.completedToday || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Doanh thu hôm nay',
      value: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(stats?.todayRevenue || 0),
      icon: TrendingUp,
      color: 'text-[#C8A97E]',
      bg: 'bg-[#C8A97E]/10',
    },
    {
      label: 'Đánh giá',
      value: stats?.averageRating || '5.0',
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', class: 'bg-blue-50 text-blue-700' };
      case 'IN_PROGRESS':
        return { label: 'Đang phục vụ', class: 'bg-amber-50 text-amber-700' };
      case 'COMPLETED':
        return { label: 'Hoàn tất', class: 'bg-emerald-50 text-emerald-700' };
      case 'CANCELLED':
        return { label: 'Đã hủy', class: 'bg-rose-50 text-rose-600' };
      default:
        return { label: status, class: 'bg-slate-50 text-slate-600' };
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      {/* Welcome header */}
      <div className="bg-[#1C1612] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-[3px] border-[#C8A97E]/30 shrink-0">
              <AvatarImage src={me?.avatar} className="object-cover" />
              <AvatarFallback className="bg-[#C8A97E]/20 text-[#C8A97E] text-2xl font-bold">
                {me?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[#C8A97E] text-xs font-semibold tracking-wider uppercase mb-1">
                Xin chào
              </p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                {me?.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-white/50 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{me?.staff?.salon?.name || 'Reetro Salon'}</span>
                </div>
                <span className="text-white/20">•</span>
                <span className="text-[#C8A97E]/80 font-medium">
                  {me?.staff?.position || 'Barber'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDayOffDialogOpen(true)}
              className="bg-transparent hover:bg-white/10 text-white border-white/15 rounded-xl h-11 px-5 text-sm font-medium transition-all"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Xin nghỉ phép
            </Button>
            <Link href="/barber/schedule" className="contents">
              <Button className="bg-[#C8A97E] hover:bg-[#B5966A] text-[#1C1612] rounded-xl h-11 px-5 text-sm font-semibold shadow-lg shadow-[#C8A97E]/20">
                Xem lịch tuần
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8A97E] opacity-[0.06] rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3" />
      </div>

      {/* Alert bar - next customer */}
      {stats?.nextCustomerAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                Khách tiếp theo
              </p>
              <p className="font-bold text-amber-900 text-sm">{stats.nextCustomerAlert}</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-10 px-5 text-xs font-semibold shadow-sm"
          >
            Sẵn sàng phục vụ
            <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, i) => (
          <Card
            key={i}
            className="border border-[#E8E0D4]/60 shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl', stat.bg)}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
              </div>
              <p className="text-xs font-medium text-[#8B7355] mb-0.5">{stat.label}</p>
              <p className="text-2xl font-bold text-[#2C1E12] leading-tight tracking-tight">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Schedule - Main */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-[#2C1E12]">Lịch hẹn hôm nay</h2>
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Trực tiếp
                </span>
              </div>
            </div>
            <Link href="/barber/bookings">
              <Button variant="ghost" size="sm" className="text-[#C8A97E] hover:text-[#B5966A] text-xs font-semibold">
                Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {schedule && schedule.length > 0 ? (
            <div className="space-y-3">
              {schedule.map((booking: any) => {
                const statusInfo = getStatusInfo(booking.status);
                return (
                  <Card
                    key={booking.id}
                    className={cn(
                      'border border-[#E8E0D4]/60 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white overflow-hidden',
                      booking.status === 'IN_PROGRESS' && 'ring-2 ring-amber-300/50 border-amber-200'
                    )}
                  >
                    <div className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
                      {/* Time block */}
                      <div className="flex items-center gap-4 md:min-w-[140px] shrink-0">
                        <div className="text-center bg-[#FAF8F5] rounded-xl px-4 py-3 border border-[#E8E0D4]/50">
                          <p className="text-lg font-bold text-[#2C1E12] leading-none tabular-nums">
                            {booking.timeSlot}
                          </p>
                          <p className="text-[10px] text-[#8B7355] mt-1 font-medium">
                            đến {booking.endTime}
                          </p>
                        </div>
                      </div>

                      {/* Customer info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 border-2 border-[#E8E0D4] shrink-0">
                          <AvatarImage src={booking.customer.avatar} />
                          <AvatarFallback className="bg-[#FAF8F5] text-[#C8A97E] font-bold">
                            {booking.customer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-[#2C1E12] truncate text-sm">
                              {booking.customer.name}
                            </h4>
                            <button
                              className="text-blue-500 hover:text-blue-600 shrink-0"
                              onClick={() => {
                                setSelectedCustomerId(booking.customer.id);
                                setIsHistoryDialogOpen(true);
                              }}
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {booking.services.map((s: any) => (
                              <Badge
                                key={s.id}
                                variant="secondary"
                                className="bg-[#FAF8F5] text-[#5C4A32] border border-[#E8E0D4]/60 text-[10px] font-medium px-2 py-0.5 rounded-md"
                              >
                                {s.service.name}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <Badge className={cn('text-[10px] font-semibold border-none rounded-md px-2 py-0.5', statusInfo.class)}>
                              {statusInfo.label}
                            </Badge>
                            <span className="text-[10px] text-[#8B7355]">
                              #{booking.bookingCode || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                        {booking.status === 'CONFIRMED' && (
                          <Button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: booking.id,
                                status: 'IN_PROGRESS',
                              })
                            }
                            className="bg-[#1C1612] hover:bg-[#2C1E12] text-white rounded-xl h-10 px-5 text-xs font-semibold flex-1 md:flex-none"
                          >
                            <Play className="w-3.5 h-3.5 mr-2" /> Bắt đầu
                          </Button>
                        )}
                        {booking.status === 'IN_PROGRESS' && (
                          <Button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: booking.id,
                                status: 'COMPLETED',
                              })
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 text-xs font-semibold flex-1 md:flex-none shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Hoàn tất
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl h-10 w-10 border-[#E8E0D4] text-[#8B7355] hover:text-[#C8A97E] hover:border-[#C8A97E] shrink-0"
                          onClick={() => {
                            setSelectedCustomerId(booking.customer.id);
                            setIsNoteDialogOpen(true);
                          }}
                        >
                          <ClipboardList className="w-4 h-4" />
                        </Button>
                        {booking.status !== 'COMPLETED' &&
                          booking.status !== 'CANCELLED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-10 w-10 text-slate-300 hover:text-rose-500 hover:bg-rose-50 shrink-0"
                              onClick={() => {
                                if (confirm('Bạn có chắc muốn hủy lịch này?')) {
                                  updateStatusMutation.mutate({
                                    id: booking.id,
                                    status: 'CANCELLED',
                                  });
                                }
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-[#E8E0D4]">
              <div className="p-4 bg-[#FAF8F5] rounded-2xl mb-4">
                <CalendarIcon className="w-10 h-10 text-[#C8A97E]/30" />
              </div>
              <h3 className="text-base font-bold text-[#2C1E12] mb-1">
                Hôm nay không có lịch hẹn
              </h3>
              <p className="text-sm text-[#8B7355]">Tận hưởng ngày nghỉ hoặc nâng cao kỹ năng</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick links */}
          <Card className="border border-[#E8E0D4]/60 shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5 space-y-2">
              <h3 className="text-sm font-bold text-[#2C1E12] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C8A97E]" />
                Truy cập nhanh
              </h3>

              <Link
                href="/barber/schedule"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors group cursor-pointer"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2C1E12]">Lịch tuần</p>
                  <p className="text-[11px] text-[#8B7355]">Xem tổng quan ca làm việc</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C8A97E]/50 group-hover:text-[#C8A97E] transition-colors" />
              </Link>

              <Link
                href="/barber/bookings"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAF8F5] transition-colors group cursor-pointer"
              >
                <div className="p-2 bg-[#C8A97E]/10 text-[#C8A97E] rounded-lg group-hover:bg-[#C8A97E]/15 transition-colors">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2C1E12]">Booking phân công</p>
                  <p className="text-[11px] text-[#8B7355]">Danh sách khách được phân</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C8A97E]/50 group-hover:text-[#C8A97E] transition-colors" />
              </Link>
            </CardContent>
          </Card>

          {/* Weekly target card */}
          <Card className="border border-[#E8E0D4]/60 shadow-sm rounded-2xl bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-[#8B7355] mb-2">Mục tiêu tuần</p>
              <div className="flex items-end justify-between mb-3">
                <p className="text-3xl font-bold text-[#C8A97E]">85%</p>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                  +12%
                </span>
              </div>
              <div className="h-2 bg-[#FAF8F5] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#C8A97E] to-[#D4B896] w-[85%] rounded-full transition-all duration-700" />
              </div>
            </CardContent>
          </Card>

          {/* Monthly goal */}
          <div className="bg-[#1C1612] rounded-2xl p-5 relative overflow-hidden">
            <p className="text-[10px] font-semibold text-[#8B7355] uppercase tracking-wider mb-1">
              Mục tiêu tháng
            </p>
            <p className="text-xl font-bold text-[#C8A97E] mb-3">Gold Member</p>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-emerald-500 w-[65%] rounded-full" />
            </div>
            <p className="text-[11px] text-white/40">Còn 12 lượt để thăng hạng</p>
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#C8A97E] opacity-[0.06] rounded-full blur-2xl" />
          </div>

          {/* Pro tip */}
          <div className="bg-gradient-to-br from-[#C8A97E]/10 to-[#C8A97E]/5 rounded-2xl p-5 border border-[#C8A97E]/15">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-[#C8A97E]" />
              <p className="text-xs font-bold text-[#C8A97E] uppercase tracking-wider">Mẹo hay</p>
            </div>
            <p className="text-sm text-[#5C4A32] leading-relaxed">
              &quot;Duy trì thái độ chuyên nghiệp và lắng nghe yêu cầu của khách là chìa khóa để
              đạt 5 sao tuyệt đối.&quot;
            </p>
          </div>
        </div>
      </div>

      {/* ===== DIALOGS ===== */}

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="rounded-2xl border border-[#E8E0D4] shadow-xl p-0 overflow-hidden bg-white max-w-md">
          <div className="p-6 pb-0">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-bold text-[#2C1E12]">
                Ghi chú khách hàng
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8B7355] mt-1">
                Ghi chú lại sở thích để phục vụ tốt hơn lần sau
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <Textarea
              placeholder="Ví dụ: Khách thích kiểu Side Part, thích dùng sáp vuốt tóc cứng..."
              className="rounded-xl border-[#E8E0D4] bg-[#FAF8F5] focus-visible:ring-[#C8A97E]/30 h-28 text-sm p-4 text-[#2C1E12] placeholder:text-[#C8A97E]/40 resize-none"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <Button
              className="bg-[#1C1612] hover:bg-[#2C1E12] text-white rounded-xl w-full h-12 font-semibold text-sm transition-all"
              onClick={() =>
                selectedCustomerId &&
                addNoteMutation.mutate({
                  customerId: selectedCustomerId,
                  content: noteContent,
                })
              }
            >
              Lưu ghi chú
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="rounded-2xl border border-[#E8E0D4] shadow-xl p-0 max-w-lg max-h-[80vh] overflow-hidden bg-white">
          <div className="bg-[#1C1612] p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <History className="w-6 h-6 text-[#C8A97E]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C8A97E] mb-1">
                  Hồ sơ khách hàng
                </p>
                <DialogTitle className="text-xl font-bold">Lịch sử phục vụ</DialogTitle>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto max-h-[50vh]">
            {isLoadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-[3px] border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#8B7355]">Đang tải...</p>
              </div>
            ) : customerHistory ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4]/50">
                    <p className="text-[10px] font-semibold uppercase text-[#8B7355] mb-1 tracking-wider">
                      Thợ yêu thích
                    </p>
                    <p className="font-bold text-[#2C1E12] text-sm">
                      {customerHistory.preferredBarber}
                    </p>
                  </div>
                  <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4]/50">
                    <p className="text-[10px] font-semibold uppercase text-[#8B7355] mb-1 tracking-wider">
                      Lần ghé cuối
                    </p>
                    <p className="font-bold text-[#2C1E12] text-sm">
                      {customerHistory.lastVisit
                        ? format(new Date(customerHistory.lastVisit), 'dd/MM/yyyy')
                        : 'Chưa có'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider">
                      Ghi chú
                    </h4>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-[#FAF8F5] text-[#8B7355] border border-[#E8E0D4]/50"
                    >
                      {customerHistory.notes?.length || 0} bản ghi
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {customerHistory.notes?.map((note: any) => (
                      <div
                        key={note.id}
                        className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E8E0D4]/40 hover:border-[#C8A97E]/30 transition-colors"
                      >
                        <p className="text-sm text-[#2C1E12] leading-relaxed">
                          &ldquo;{note.content}&rdquo;
                        </p>
                        <p className="text-[10px] text-[#C8A97E] font-medium mt-2">
                          {note.staff?.user?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="p-4 border-t border-[#E8E0D4]/40">
            <Button
              variant="ghost"
              className="w-full h-10 rounded-xl font-medium text-sm text-[#8B7355] hover:bg-[#FAF8F5]"
              onClick={() => setIsHistoryDialogOpen(false)}
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Off Dialog */}
      <Dialog open={isDayOffDialogOpen} onOpenChange={setIsDayOffDialogOpen}>
        <DialogContent className="rounded-2xl border border-[#E8E0D4] shadow-xl p-0 overflow-hidden bg-white max-w-md">
          <div className="p-6 pb-0">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
              <CalendarDays className="w-6 h-6 text-rose-500" />
            </div>
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-bold text-[#2C1E12]">
                Xin nghỉ phép
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8B7355] mt-1">
                Đăng ký ngày nghỉ và chờ quản lý phê duyệt
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#8B7355] mb-1.5 block">
                Ngày nghỉ
              </label>
              <Input
                type="date"
                value={dayOffDate}
                onChange={(e) => setDayOffDate(e.target.value)}
                className="rounded-xl h-11 bg-[#FAF8F5] border-[#E8E0D4] font-medium text-[#2C1E12] focus-visible:ring-[#C8A97E]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#8B7355] mb-1.5 block">Lý do</label>
              <Textarea
                placeholder="Vui lòng cung cấp lý do..."
                value={dayOffReason}
                onChange={(e) => setDayOffReason(e.target.value)}
                className="rounded-xl h-24 bg-[#FAF8F5] border-[#E8E0D4] text-sm text-[#2C1E12] focus-visible:ring-[#C8A97E]/30 p-4 placeholder:text-[#C8A97E]/40 resize-none"
              />
            </div>
            <Button
              className="bg-[#1C1612] hover:bg-[#2C1E12] text-white rounded-xl w-full h-12 font-semibold text-sm transition-all"
              onClick={() =>
                registerDayOffMutation.mutate({
                  date: dayOffDate,
                  reason: dayOffReason,
                })
              }
            >
              Gửi yêu cầu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
