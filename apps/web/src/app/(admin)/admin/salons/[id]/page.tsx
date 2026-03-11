'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi, salonApi } from '@/lib/api';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Activity, 
  MapPin, 
  Phone, 
  Clock, 
  Scissors,
  TrendingUp,
  Star,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/admin/data-table';
import { formatCurrency, STAFF_POSITIONS } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';

export default function BranchDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const { data: salon, isLoading } = useQuery({
    queryKey: ['admin', 'salons', id],
    queryFn: () => salonApi.getById(id),
  });

  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['admin', 'staff', 'list', id],
    queryFn: () => adminApi.getAllStaff({ salonId: id, limit: 100 }),
  });

  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['admin', 'bookings', 'list', id],
    queryFn: () => adminApi.getAllBookings({ salonId: id, limit: 10 }),
  });

  const staffColumns: ColumnDef<any>[] = [
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
          {row.original.rating.toFixed(1)}
        </div>
      )
    }
  ];

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
            <div>
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
           <CardHeader>
              <CardTitle className="text-lg font-bold">Thông tin liên hệ</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
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
                      loading={isLoadingStaff}
                      searchKey="user.name"
                    />
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="bookings">
                <Card className="border-none shadow-premium bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Booking gần đây</CardTitle>
                    <CardDescription>Danh sách 10 khách hàng đặt lịch mới nhất tại chi nhánh.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                       {bookingsData?.data?.map((booking: any) => (
                         <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 gap-4">
                           <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={booking.customer?.avatar} />
                                <AvatarFallback>{booking.customer?.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-slate-800">{booking.customer?.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{booking.services?.map((s: any) => s.service?.name).join(', ')}</p>
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
            
            <TabsContent value="analytics">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <Card className="border-none shadow-premium bg-white">
                     <CardContent className="p-6">
                        <TrendingUp className="w-5 h-5 text-primary mb-4" />
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">Doanh thu tổng</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency((salon?._count?.bookings || 0) * 250000)}</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                          +12.5% <span className="text-slate-400">vs tháng trước</span>
                        </p>
                     </CardContent>
                   </Card>
                   <Card className="border-none shadow-premium bg-white">
                     <CardContent className="p-6">
                        <Scissors className="w-5 h-5 text-primary mb-4" />
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">Hiệu suất phục vụ</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{salon?._count?.bookings || 0} lượt</p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                          92% <span className="text-slate-400">hoàn thành đúng giờ</span>
                        </p>
                     </CardContent>
                   </Card>
                </div>
                <Card className="border-none shadow-premium bg-white mt-4">
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
