'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi, staffApi } from '@/lib/api';
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
  AlertCircle,
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
  const [rateModalOpen, setRateModalOpen] = useState(false);

  // Fetch profile (includes bio, specialties, gallery, achievements, reviews)
  const { data: profile, isLoading: isLoadingProfile, error } = useQuery({
    queryKey: ['staff', 'profile', id],
    queryFn: () => staffApi.getProfile(id),
  });

  // Fetch manager-specific data (analytics, shifts, leaves)
  const { data: managerData } = useQuery({
    queryKey: ['manager', 'staff', id],
    queryFn: () => managerApi.getStaffById(id),
  });

  const rateStaffMutation = useMutation({
    mutationFn: (data: any) => managerApi.rateStaff(id, data),
    onSuccess: () => {
      toast.success('Đã gửi đánh giá hiệu suất');
      setRateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['staff', 'profile', id] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'staff', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể gửi đánh giá'),
  });

  const chartData = useMemo(() => {
    if (!managerData?.analytics?.history) return [];
    return managerData.analytics.history.map((item: any) => ({
      name: format(new Date(item.createdAt), 'dd/MM'),
      performance: (item.serviceQuality + item.punctuality + item.customerSatisfaction) / 3,
    }));
  }, [managerData]);

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C8A97E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4 opacity-40" />
        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md">Nhân viên này không thuộc quyền quản lý của bạn.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-6 rounded-xl px-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  const staff = profile;
  const DAYS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ═══ HERO SECTION ═══ */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#C8A97E] via-[#D4B990] to-amber-300/60" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14">
            <Avatar className="h-28 w-28 border-4 border-white shadow-xl ring-2 ring-[#C8A97E]/20">
              <AvatarImage src={staff?.user?.avatar || ''} />
              <AvatarFallback className="text-3xl font-bold bg-slate-900 text-white">
                {staff?.user?.name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {staff?.user?.name}
                    <Badge className="bg-[#C8A97E]/10 text-[#C8A97E] border-none text-[10px] font-semibold">
                      {STAFF_POSITIONS[staff?.position as keyof typeof STAFF_POSITIONS] || staff?.position}
                    </Badge>
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">{staff?.bio || 'Chưa có mô tả ngắn'}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/manager/staff/${id}/profile`)}
                    className="rounded-xl gap-1.5 border-slate-200"
                  >
                    <Edit className="w-3.5 h-3.5" /> Sửa hồ sơ
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setRateModalOpen(true)}
                    className="rounded-xl gap-1.5 bg-[#C8A97E] hover:bg-[#B5966A] shadow-lg shadow-[#C8A97E]/20"
                  >
                    <Star className="w-3.5 h-3.5" /> Đánh giá
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
                  <span className="text-xs text-slate-400">({staff?.totalReviews || 0})</span>
                </div>
                {staff?.experience && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Briefcase className="w-3.5 h-3.5" /> {staff.experience} năm KN
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5" /> {staff?.user?.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5" /> {staff?.salon?.name || 'N/A'}
                </div>
              </div>
              {staff?.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {staff.specialties.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-[10px] font-semibold border-[#C8A97E]/20 text-[#C8A97E] bg-[#C8A97E]/5 rounded-full px-3">
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
        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-3 opacity-10"><TrendingUp size={60} /></div>
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-[#C8A97E] rounded-xl text-white"><TrendingUp className="w-4 h-4" /></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(managerData?.analytics?.totalRevenue || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white ring-1 ring-amber-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><Star className="w-4 h-4 fill-amber-500" /></div>
              <span className="text-[10px] font-bold text-amber-600 uppercase">Rating</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{staff?.rating?.toFixed(1) || '5.0'} / 5</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white ring-1 ring-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><CheckCircle className="w-4 h-4" /></div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Hoàn thành</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{managerData?.analytics?.totalCustomers || staff?._count?.bookings || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white ring-1 ring-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Award className="w-4 h-4" /></div>
              <span className="text-[10px] font-bold text-blue-600 uppercase">Thành tích</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{staff?.achievements?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ GRID CONTENT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Giới thiệu */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C8A97E]" /> Giới thiệu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {staff?.longDescription ? (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{staff.longDescription}</p>
            ) : (
              <div className="text-center py-8 text-slate-300">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Chưa có mô tả chi tiết</p>
                <Button variant="link" size="sm" className="mt-2 text-[#C8A97E]" onClick={() => router.push(`/manager/staff/${id}/profile`)}>
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
              <Sparkles className="w-4 h-4 text-[#C8A97E]" /> Chuyên môn & Tác phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {staff?.specialties?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {staff.specialties.map((s: string) => (
                  <Badge key={s} className="bg-[#C8A97E]/10 text-[#C8A97E] border-none font-semibold text-xs">{s}</Badge>
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
              <Award className="w-4 h-4 text-[#C8A97E]" /> Thành tích & Chứng chỉ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {staff?.achievements?.length > 0 ? (
              <div className="space-y-3">
                {staff.achievements.map((ach: any) => (
                  <div key={ach.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80">
                    <div className="w-9 h-9 rounded-xl bg-[#C8A97E]/5 flex items-center justify-center text-lg shrink-0">
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ca làm việc tuần này */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C8A97E]" /> Ca làm việc tuần này
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {managerData?.shifts?.length > 0 ? (
              <div className="space-y-2">
                {managerData.shifts.map((shift: any) => (
                  <div key={shift.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[#C8A97E]" />
                      <div>
                        <p className="font-semibold text-sm text-slate-800">
                          {format(new Date(shift.date), 'EEEE, dd/MM', { locale: vi })}
                        </p>
                        <p className="text-[11px] text-slate-400">{shift.type}</p>
                      </div>
                    </div>
                    <Badge className="bg-[#C8A97E] text-white border-none text-xs font-semibold px-3">
                      {format(new Date(shift.shiftStart), 'HH:mm')} - {format(new Date(shift.shiftEnd), 'HH:mm')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-300">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Không có ca làm việc</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ PERFORMANCE CHART ═══ */}
      {chartData.length > 0 && (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-0 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C8A97E]" /> Biểu đồ hiệu suất
              </CardTitle>
              <CardDescription className="text-xs">Đánh giá từ quản lý theo thời gian</CardDescription>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-semibold">REAL-TIME</Badge>
          </CardHeader>
          <CardContent className="p-6 pt-8">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8A97E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#C8A97E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} domain={[0, 5]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                  />
                  <Area type="monotone" dataKey="performance" stroke="#C8A97E" strokeWidth={3} fillOpacity={1} fill="url(#colorPerf)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ BOTTOM ROW: Reviews + Leaves ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đánh giá từ khách */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C8A97E]" /> Đánh giá từ khách
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
              <CalendarDays className="w-4 h-4 text-[#C8A97E]" /> Nhật ký nghỉ phép
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!managerData?.leaves || managerData.leaves.length === 0 ? (
              <div className="text-center py-8 text-slate-300">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Chưa có ngày nghỉ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {managerData.leaves.map((leave: any) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-[#C8A97E]" />
                      <div>
                        <p className="font-semibold text-xs text-slate-800">
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

      {/* ═══ RATE PERFORMANCE MODAL ═══ */}
      {rateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-lg border-none shadow-2xl overflow-hidden rounded-2xl">
            <CardHeader className="bg-[#C8A97E] text-white pb-6 pt-6 px-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Star className="w-5 h-5 fill-white" /> Đánh giá hiệu suất
              </CardTitle>
              <CardDescription className="text-white/80 mt-1 font-medium text-sm">
                Đánh giá cho {staff?.user?.name}
              </CardDescription>
            </CardHeader>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              rateStaffMutation.mutate({
                serviceQuality: Number(formData.get('serviceQuality')),
                punctuality: Number(formData.get('punctuality')),
                customerSatisfaction: Number(formData.get('customerSatisfaction')),
                comment: formData.get('comment'),
              });
            }} className="p-6 space-y-6 bg-white">
              {[
                { name: 'serviceQuality', label: 'Chất lượng tay nghề', desc: 'Kỹ thuật cắt & xử lý' },
                { name: 'punctuality', label: 'Tác phong & Giờ giấc', desc: 'Đúng ca, đúng lịch' },
                { name: 'customerSatisfaction', label: 'Độ hài lòng của khách', desc: 'Giao tiếp & Phục vụ' },
              ].map(field => (
                <div key={field.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <label className="text-xs font-bold text-slate-700">{field.label}</label>
                      <p className="text-[11px] text-slate-400">{field.desc}</p>
                    </div>
                    <span className="text-sm font-bold text-[#C8A97E]">/ 5</span>
                  </div>
                  <input name={field.name} type="range" min="1" max="5" defaultValue="5" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#C8A97E]" />
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>1</span><span>5</span>
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Ghi chú</label>
                <textarea
                  name="comment"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 h-24 text-sm resize-none focus:ring-2 focus:ring-[#C8A97E]/20"
                  placeholder="Nhận xét về nhân viên..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setRateModalOpen(false)} className="flex-1 rounded-xl h-11 border-slate-200">Hủy</Button>
                <Button type="submit" className="flex-[2] rounded-xl h-11 bg-slate-900 hover:bg-[#C8A97E] shadow-xl" disabled={rateStaffMutation.isPending}>
                  {rateStaffMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Lưu đánh giá
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
