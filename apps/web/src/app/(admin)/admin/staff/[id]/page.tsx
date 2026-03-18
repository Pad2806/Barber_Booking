'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, staffApi } from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Star,
  CheckCircle,
  Clock,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Activity,
  Loader2,
  Award,
  Image as ImageIcon,
  Sparkles,
  Edit,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { STAFF_POSITIONS, cn, formatCurrency } from '@/lib/utils';
import dynamicImport from 'next/dynamic';

const AreaChart = dynamicImport(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamicImport(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamicImport(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamicImport(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamicImport(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamicImport(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamicImport(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function StaffDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Fetch profile (includes bio, specialties, gallery, achievements, reviews)
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['staff', 'profile', id],
    queryFn: () => staffApi.getProfile(id),
  });

  // Fetch analytics (revenue, chart data)
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['admin', 'staff', 'analytics', id],
    queryFn: () => adminApi.getStaffAnalytics(id),
  });

  // Fetch leaves
  const { data: leaves } = useQuery({
    queryKey: ['admin', 'staff', 'leaves', id],
    queryFn: () => adminApi.getStaffLeaves(id),
  });

  const registerLeaveMutation = useMutation({
    mutationFn: (data: any) => adminApi.registerStaffLeave(id, data),
    onSuccess: () => {
      toast.success('Đã đăng ký ngày nghỉ');
      setLeaveModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff', 'leaves', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể đăng ký nghỉ'),
  });

  const chartData = useMemo(() => {
    if (!analytics?.monthlyRevenue) return [];
    return analytics.monthlyRevenue.map((item: any) => ({
      name: format(new Date(item.date), 'dd/MM'),
      revenue: item.revenue,
    }));
  }, [analytics]);

  if (isLoadingProfile || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const staff = profile;
  const DAYS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ═══ HERO SECTION ═══ */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/80 via-primary to-amber-600/60" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14">
            <Avatar className="h-28 w-28 border-4 border-white shadow-xl ring-2 ring-primary/20">
              <AvatarImage src={staff?.user?.avatar || ''} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {staff?.user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {staff?.user?.name}
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-semibold">
                      {STAFF_POSITIONS[staff?.position as keyof typeof STAFF_POSITIONS] || staff?.position}
                    </Badge>
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">{staff?.bio || 'Chưa có mô tả ngắn'}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/staff/${id}/profile`)}
                    className="rounded-xl gap-1.5 border-slate-200"
                  >
                    <Edit className="w-3.5 h-3.5" /> Sửa hồ sơ
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setLeaveModalOpen(true)}
                    className="rounded-xl gap-1.5 shadow-lg shadow-primary/20"
                  >
                    <CalendarDays className="w-3.5 h-3.5" /> Đăng ký nghỉ
                  </Button>
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('w-3.5 h-3.5', i < Math.round(staff?.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200')} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{staff?.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-xs text-slate-400">({staff?.totalReviews || 0} đánh giá)</span>
                </div>
                {staff?.experience && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Briefcase className="w-3.5 h-3.5" /> {staff.experience} năm kinh nghiệm
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="w-3.5 h-3.5" /> {staff?.user?.email || 'N/A'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5" /> {staff?.user?.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5" /> {staff?.salon?.name}
                </div>
              </div>
              {staff?.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {staff.specialties.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary bg-primary/5 rounded-full px-3">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-white ring-1 ring-primary/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><TrendingUp className="w-4 h-4" /></div>
              <span className="text-[10px] font-bold text-primary uppercase">Doanh thu</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(analytics?.stats?.totalRevenue && !isNaN(Number(analytics.stats.totalRevenue)) ? Number(analytics.stats.totalRevenue) : 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white ring-1 ring-amber-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><Star className="w-4 h-4 fill-amber-500" /></div>
              <span className="text-[10px] font-bold text-amber-600 uppercase">Đánh giá</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{analytics?.stats?.avgRating || '5.0'} / 5</p>
            <p className="text-[11px] text-slate-400 mt-1">{analytics?.stats?.totalReviews || 0} đánh giá</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white ring-1 ring-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><CheckCircle className="w-4 h-4" /></div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Hoàn thành</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{analytics?.stats?.completedBookings || staff?._count?.bookings || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Lượt phục vụ</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white ring-1 ring-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Award className="w-4 h-4" /></div>
              <span className="text-[10px] font-bold text-blue-600 uppercase">Thành tích</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{staff?.achievements?.length || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Giải thưởng & chứng chỉ</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ GRID CONTENT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Giới thiệu */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Giới thiệu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {staff?.longDescription ? (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{staff.longDescription}</p>
            ) : (
              <div className="text-center py-8 text-slate-300">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Chưa có mô tả chi tiết</p>
                <Button variant="link" size="sm" className="mt-2 text-primary" onClick={() => router.push(`/admin/staff/${id}/profile`)}>
                  Thêm mô tả →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chuyên môn & Gallery */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Chuyên môn & Tác phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {staff?.specialties?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {staff.specialties.map((s: string) => (
                  <Badge key={s} className="bg-primary/10 text-primary border-none font-semibold text-xs">{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-300">Chưa có chuyên môn</p>
            )}
            {staff?.gallery?.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {staff.gallery.slice(0, 6).map((url: string, i: number) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100">
                    <img src={url} alt={`work-${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-300">
                <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-30" />
                <p className="text-xs">Chưa có ảnh tác phẩm</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thành tích */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Thành tích & Chứng chỉ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {staff?.achievements?.length > 0 ? (
              <div className="space-y-3">
                {staff.achievements.map((ach: any) => (
                  <div key={ach.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-lg shrink-0">
                      {ach.icon || '🏆'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800">{ach.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ach.year && <Badge variant="secondary" className="text-[10px] bg-slate-100 border-none">{ach.year}</Badge>}
                        {ach.description && <p className="text-xs text-slate-400 truncate">{ach.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-300">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Chưa có thành tích</p>
                <Button variant="link" size="sm" className="mt-2 text-primary" onClick={() => router.push(`/admin/staff/${id}/profile`)}>
                  Thêm thành tích →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lịch trình cố định */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Lịch trình cố định
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DAYS.map((day, idx) => {
                const daySchedule = staff?.schedules?.find((s: any) => s.dayOfWeek === idx);
                return (
                  <div key={idx} className={cn(
                    'flex items-center justify-between p-2.5 rounded-xl border transition-all',
                    daySchedule?.isOff ? 'bg-slate-50 border-slate-50' : 'bg-white border-slate-100'
                  )}>
                    <span className="font-semibold text-xs text-slate-700">{day}</span>
                    {daySchedule?.isOff ? (
                      <Badge variant="destructive" className="text-[10px] px-2 font-bold">NGHỈ</Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-semibold">
                        {daySchedule?.startTime} - {daySchedule?.endTime}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ REVENUE CHART (FULL WIDTH) ═══ */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-0 border-b border-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Biểu đồ doanh thu
            </CardTitle>
            <CardDescription className="text-xs">Hiệu suất đóng góp 180 ngày qua</CardDescription>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-semibold">LIVE</Badge>
        </CardHeader>
        <CardContent className="p-6 pt-8">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C8A97E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value: any) => [formatCurrency(value), 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C8A97E" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ═══ BOTTOM ROW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đánh giá gần đây */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Đánh giá gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {staff?.reviews?.length > 0 ? (
              <div className="space-y-4">
                {staff.reviews.map((review: any) => (
                  <div key={review.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={review.customer?.avatar || ''} />
                      <AvatarFallback className="text-xs bg-slate-100">{review.customer?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{review.customer?.name}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn('w-3 h-3', i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200')} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{review.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-300">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Chưa có đánh giá</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nghỉ phép */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Nghỉ phép
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!leaves || leaves.length === 0 ? (
              <div className="text-center py-8 text-slate-300">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Chưa có ngày nghỉ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((leave: any) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 rounded-xl">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">
                          {format(new Date(leave.startDate), 'dd MMM', { locale: vi })} - {format(new Date(leave.endDate), 'dd MMM', { locale: vi })}
                        </p>
                        <p className="text-[11px] text-slate-400">{leave.reason || 'Nghỉ phép'}</p>
                      </div>
                    </div>
                    <Badge className={cn('text-[10px] font-semibold border-none',
                      leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      leave.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    )}>
                      {leave.status === 'APPROVED' ? 'Đã duyệt' : leave.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ LEAVE MODAL ═══ */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden rounded-2xl">
            <CardHeader className="bg-primary text-white pb-6 pt-6 px-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <CalendarDays className="w-5 h-5" /> Đăng ký nghỉ phép
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 mt-1 font-medium text-sm">
                Thiết lập thời gian vắng mặt cho {staff?.user?.name}
              </CardDescription>
            </CardHeader>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              registerLeaveMutation.mutate({
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                reason: formData.get('reason'),
              });
            }} className="p-6 space-y-4 bg-white">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Bắt đầu</label>
                  <input name="startDate" type="date" required className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 bg-slate-50 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Kết thúc</label>
                  <input name="endDate" type="date" required className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 bg-slate-50 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Lý do</label>
                <textarea name="reason" className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 bg-slate-50 h-24 text-sm resize-none" placeholder="vd: Việc gia đình, ốm đau..." />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setLeaveModalOpen(false)} className="flex-1 rounded-xl h-11 border-slate-200">Đóng</Button>
                <Button type="submit" className="flex-[2] rounded-xl h-11 shadow-lg shadow-primary/20" disabled={registerLeaveMutation.isPending}>
                  {registerLeaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Xác nhận
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
