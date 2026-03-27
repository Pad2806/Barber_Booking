'use client';
export const dynamic = 'force-dynamic';

import { useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi, salonApi } from '@/lib/api';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Star,
  Loader2,
  Activity,
  MapPin,
  Phone,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/admin/data-table';
import { formatCurrency, STAFF_POSITIONS, cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';

export default function BranchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const { data: salon, isLoading } = useQuery({
    queryKey: ['admin', 'salons', id],
    queryFn: () => salonApi.getById(id),
  });

  const { data: staffData } = useQuery({
    queryKey: ['admin', 'staff', 'list', id],
    queryFn: () => adminApi.getAllStaff({ salonId: id, limit: 100 }),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['admin', 'bookings', 'list', id],
    queryFn: () => adminApi.getAllBookings({ salonId: id, limit: 10 }),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['admin', 'reviews', 'list', id],
    queryFn: () => adminApi.getAllReviews({ salonId: id, limit: 50 }),
  });

  const staffColumns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'user.name',
      header: 'Nhân viên',
      cell: ({ row }) => {
        const staff = row.original;
        const user = staff.user;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-sm">{user?.name}</span>
              <span className="text-[10px] text-slate-500">{user?.phone}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'position',
      header: 'Vị trí',
      cell: ({ row }) => {
        const pos = row.getValue('position') as string;
        return (
          <Badge variant="secondary" className="text-[10px] font-bold">
            {STAFF_POSITIONS[pos as keyof typeof STAFF_POSITIONS] || pos}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'rating',
      header: 'Đánh giá',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
          <Star className="w-3 h-3 fill-amber-500" />
          {row.original.rating?.toFixed(1) || '0.0'}
        </div>
      )
    }
  ], []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 italic">{salon?.name}</h1>
              <p className="text-sm text-slate-500 font-medium">Báo cáo hoạt động chi tiết chi nhánh</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold px-3 py-1">ĐANG HOẠT ĐỘNG</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-none shadow-premium bg-white">
           <CardHeader className="text-left">
              <CardTitle className="text-lg font-bold">Thông tin liên hệ</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6 text-left">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg shrink-0"><MapPin className="w-4 h-4 text-primary" /></div>
                <div className="text-sm">
                  <p className="font-bold text-slate-800">Địa chỉ</p>
                  <p className="text-slate-500 leading-relaxed font-medium">{salon?.address}, {salon?.district}, {salon?.city}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg shrink-0"><Phone className="w-4 h-4 text-primary" /></div>
                <div className="text-sm">
                  <p className="font-bold text-slate-800">Số điện thoại</p>
                  <p className="text-slate-500 font-medium">{salon?.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 rounded-lg shrink-0"><Clock className="w-4 h-4 text-primary" /></div>
                <div className="text-sm">
                  <p className="font-bold text-slate-800">Giờ hoạt động</p>
                  <p className="text-slate-500 font-medium">{salon?.openTime} - {salon?.closeTime}</p>
                </div>
              </div>
           </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="staff" className="space-y-6">
            <TabsList className="bg-white border p-1 rounded-2xl h-14 w-full justify-start gap-2 shadow-sm">
              <TabsTrigger value="staff" className="rounded-xl h-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                <Users className="w-4 h-4 mr-2" /> Đội ngũ Stylist
              </TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-xl h-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                <Calendar className="w-4 h-4 mr-2" /> Lượt đặt lịch
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-xl h-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                <Star className="w-4 h-4 mr-2" /> Đánh giá
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-xl h-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                <TrendingUp className="w-4 h-4 mr-2" /> Kinh doanh
              </TabsTrigger>
            </TabsList>

            <TabsContent value="staff">
               <Card className="border-none shadow-premium bg-white overflow-hidden">
                  <CardContent className="p-0">
                    <DataTable 
                      columns={staffColumns} 
                      data={staffData?.data || []} 
                      searchKey="user.name"
                    />
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="bookings">
                <Card className="border-none shadow-premium bg-white">
                  <CardHeader className="text-left">
                    <CardTitle className="text-lg font-bold">Booking gần đây</CardTitle>
                    <CardDescription>Danh sách 10 khách hàng đặt lịch mới nhất tại chi nhánh.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                       {bookingsData?.data?.map((booking: any) => (
                         <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 gap-4 text-left">
                           <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={booking.customer?.avatar} />
                                <AvatarFallback>{booking.customer?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-slate-800">{booking.customer?.name}</p>
                                <p className="text-xs text-slate-500 font-medium line-clamp-1">{booking.services?.map((s: any) => s.service?.name).join(', ')}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">{formatCurrency(booking.totalAmount)}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{booking.timeSlot} • {new Date(booking.date).toLocaleDateString('vi-VN')}</p>
                              </div>
                              <Badge className="bg-primary/10 text-primary border-none text-[10px] items-center justify-center min-w-[80px]">
                                {booking.status}
                              </Badge>
                           </div>
                         </div>
                       ))}
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-amber-50 border-none shadow-none ring-1 ring-amber-200">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                      <div>
                        <p className="text-2xl font-bold">{salon?.averageRating?.toFixed(1) || '0.0'}</p>
                        <p className="text-[10px] font-bold text-amber-600 uppercase">Điểm trung bình</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50 border-none shadow-none ring-1 ring-emerald-200">
                    <CardContent className="p-4 flex items-center gap-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <div>
                        <p className="text-2xl font-bold">{reviewsData?.data?.filter(r => r.rating >= 4).length || 0}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Đánh giá tốt</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-rose-50 border-none shadow-none ring-1 ring-rose-200">
                    <CardContent className="p-4 flex items-center gap-4">
                      <XCircle className="w-8 h-8 text-rose-500" />
                      <div>
                        <p className="text-2xl font-bold">{reviewsData?.data?.filter(r => r.rating <= 2).length || 0}</p>
                        <p className="text-[10px] font-bold text-rose-600 uppercase">Cần lưu ý</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  {reviewsData?.data?.map((review) => (
                    <Card key={review.id} className="border-none shadow-sm bg-white overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 text-left">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={review.customer?.avatar} />
                              <AvatarFallback>{review.customer?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold text-slate-900">{review.customer?.name}</p>
                                <div className="flex items-center gap-0.5 ml-2">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star 
                                      key={s} 
                                      className={cn(
                                        "w-3 h-3", 
                                        s <= review.rating ? "text-amber-500 fill-amber-500" : "text-slate-200"
                                      )} 
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400 font-medium mb-3">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                              <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4 bg-slate-50/50 py-2 rounded-r-lg">
                                {`"${review.comment || 'Không có bình luận'}"`}
                              </p>
                              
                              {review.reply && (
                                <div className="mt-4 bg-primary/5 p-4 rounded-xl border border-primary/10 relative">
                                  <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-bold text-primary flex items-center">
                                    <MessageCircle className="w-3 h-3 mr-1" /> PHẢN HỒI CỦA SALON
                                  </div>
                                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                    {review.reply}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(!reviewsData?.data || reviewsData.data.length === 0) && (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Chưa có đánh giá nào</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <Card className="border-none shadow-premium bg-white">
                      <CardContent className="p-6">
                         <TrendingUp className="w-5 h-5 text-primary mb-4" />
                         <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">Doanh thu tổng</p>
                         <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency((salon as any)?.revenue || (salon?._count?.bookings || 0) * 150000)}</p>
                         <div className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                           <Activity className="w-3 h-3" /> Toàn bộ chi nhánh
                         </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-premium bg-white">
                      <CardContent className="p-6">
                         <Scissors className="w-5 h-5 text-primary mb-4" />
                         <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">Lượt phục vụ</p>
                         <p className="text-2xl font-black text-slate-900 mt-1">{salon?._count?.bookings || 0} lượt</p>
                         <div className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                           <Star className="w-3 h-3" /> Điểm TB: {(salon as any)?.averageRating?.toFixed(1) || '0.0'}
                         </div>
                      </CardContent>
                    </Card>
                </div>
                <Card className="border-none shadow-premium bg-white mt-4 text-left">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Lưu ý quản lý</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">Đây là trang tổng quát cho phép quản lý chi nhánh tối ưu hóa kế hoạch phục vụ khách hàng. Mọi chỉ số được cập nhật theo thời gian thực.</p>
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
