'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cashierApi } from '@/lib/api';
import { 
  Search, 
  Calendar, 
  Smartphone, 
  XCircle,
  Clock,
  User,
  Scissors,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export default function CashierAppointmentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(dayjs().format('YYYY-MM-DD'));

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['cashier', 'bookings', { status: statusFilter, date: dateFilter, search: searchTerm }],
    queryFn: () => cashierApi.getBookings({ 
        status: statusFilter === 'ALL' ? undefined : statusFilter, 
        date: dateFilter,
        search: searchTerm
    }),
  });

  const statusColors: any = {
    CONFIRMED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    COMPLETED: 'bg-blue-50 text-blue-600 border-blue-100',
    CANCELLED: 'bg-rose-50 text-rose-600 border-rose-100',
    PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-600 border-indigo-100'
  };

  const statusLabels: any = {
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
    PENDING: 'Chờ xử lý',
    IN_PROGRESS: 'Đang phục vụ'
  };

  if (isLoading) {
    return (
      <div className="flex bg-white rounded-[2rem] border border-slate-100 items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">Đang tải danh sách lịch hẹn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
                 Lịch trình <span className="text-[#C8A97E]">Phục vụ</span>
              </h1>
              <p className="text-slate-500 font-medium italic text-sm">Quản lý toàn bộ các ca làm việc tại chi nhánh.</p>
           </div>
           <div className="flex flex-wrap items-center gap-3">
              <div className="relative group flex-1 md:flex-none">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C8A97E]" />
                 <Input 
                   placeholder="Tìm khách hàng..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-12 w-full md:w-64 border-slate-100 bg-white rounded-2xl h-12 shadow-sm font-bold focus-visible:ring-[#C8A97E]/20"
                 />
              </div>
              <Input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full md:w-44 border-slate-100 bg-white rounded-2xl h-12 shadow-sm font-bold text-slate-900 focus-visible:ring-[#C8A97E]/20"
              />
           </div>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
           <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-14 w-full md:w-auto flex overflow-x-auto no-scrollbar justify-start border border-slate-100 shadow-inner">
              {['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
                <TabsTrigger key={s} value={s} className="rounded-xl px-6 font-black italic uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#C8A97E] data-[state=active]:shadow-xl transition-all h-full">
                  {s === 'ALL' ? 'Tất cả' : statusLabels[s]}
                </TabsTrigger>
              ))}
           </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {bookings?.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 shadow-sm group">
             <div className="p-8 rounded-full bg-slate-50 text-slate-200 mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-16 h-16" />
             </div>
             <p className="text-slate-400 font-black italic uppercase text-xs tracking-widest">Không tìm thấy lịch hẹn nào</p>
          </div>
        ) : (
          bookings?.map((booking: any) => (
            <Card key={booking.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden">
               <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row items-stretch">
                     {/* Time Side */}
                     <div className="lg:w-48 bg-slate-50 p-8 flex lg:flex-col items-center justify-center lg:border-r border-slate-100 text-center gap-4 relative">
                        <div className="space-y-1">
                           <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{booking.timeSlot}</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dayjs(booking.date).format('DD/MM/YYYY')}</p>
                        </div>
                        <Badge className={cn("border-none px-4 py-1.5 font-black italic uppercase text-[8px] tracking-[0.1em] rounded-xl shadow-sm", statusColors[booking.status])}>
                           {statusLabels[booking.status]}
                        </Badge>
                     </div>

                     {/* Main Content */}
                     <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                           <div className="relative">
                              <Avatar className="h-16 w-16 border-4 border-white shadow-xl ring-2 ring-slate-50">
                                 <AvatarFallback className="bg-slate-900 text-white font-black italic text-xl">
                                    {booking.customerName?.charAt(0) || 'C'}
                                 </AvatarFallback>
                              </Avatar>
                           </div>
                           <div className="space-y-1">
                              <h3 className="text-xl font-black text-slate-900 italic tracking-tight">{booking.customerName}</h3>
                              <div className="flex items-center gap-2 text-slate-400">
                                 <Smartphone className="w-3.5 h-3.5" />
                                 <span className="text-xs font-bold">{booking.customerPhone || 'Ẩn số'}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                 {booking.services?.map((s: any) => (
                                    <Badge key={s.id} variant="outline" className="border-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wide py-1">
                                       {s.name || s.service?.name}
                                    </Badge>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 min-w-[240px] hover:bg-white hover:shadow-lg transition-all">
                           <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                              <AvatarImage src={booking.staff?.user?.avatar} />
                              <AvatarFallback className="bg-slate-200 text-slate-400 font-black text-xs">{booking.staff?.user?.name?.charAt(0)}</AvatarFallback>
                           </Avatar>
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 italic">Thợ thực hiện</p>
                              <p className="text-xs font-black text-slate-900 italic uppercase">
                                 {booking.staff?.user?.name || 'Đang chờ điều phối'}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <Button 
                             className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black italic uppercase text-[10px] tracking-widest h-12 px-6 shadow-xl transition-all hover:scale-105 group"
                           >
                              Chi tiết <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                           </Button>
                           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50">
                              <XCircle className="w-5 h-5" />
                           </Button>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
