'use client';

import { useQuery } from '@tanstack/react-query';
import { bookingApi, usersApi } from '@/lib/api';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle
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

export default function BarberBookingsPage() {
  const [search, setSearch] = useState('');
  
  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['bookings', 'barber', me?.staff?.id, search],
    queryFn: () => bookingApi.getAll({ 
        staffId: me?.staff?.id,
        search: search || undefined,
        limit: 50
    }),
    enabled: !!me?.staff?.id,
  });

  const bookings = response?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-600 border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white rounded-3xl animate-pulse" />
            ))}
        </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tight text-[#2C1E12] uppercase mb-1">Booking được phân công</h1>
          <p className="text-[#8B7355] font-medium">Danh sách các khách hàng bạn sẽ phục vụ</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Tìm theo tên khách, mã booking..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-[#E8E0D4] bg-white focus:ring-[#C8A97E]/20 focus:border-[#C8A97E] font-medium"
          />
        </div>
        <Button variant="outline" className="h-12 rounded-2xl border-[#E8E0D4] text-[#8B7355] font-bold px-6">
            <Filter className="w-5 h-5 mr-2" /> Bộ lọc
        </Button>
      </div>

      <div className="space-y-4">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <Card key={booking.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden hover:shadow-xl hover:shadow-[#C8A97E]/5 transition-all duration-300 group">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                        {/* Time/Date Section */}
                        <div className="md:w-48 bg-[#FAF8F5] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#F0EBE3]">
                            <p className="text-[10px] font-black uppercase text-[#8B7355] mb-1">{format(new Date(booking.date), 'EEEE', { locale: vi })}</p>
                            <p className="text-3xl font-black italic text-[#2C1E12] leading-none mb-2">{format(new Date(booking.date), 'dd/MM')}</p>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-[#E8E0D4] shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-[#C8A97E]" />
                                <span className="text-xs font-black text-[#2C1E12]">{booking.timeSlot}</span>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex gap-6">
                                <Avatar className="h-16 w-16 border-2 border-[#C8A97E]/10 shrink-0">
                                    <AvatarImage src={(booking as any).customer?.avatar} />
                                    <AvatarFallback className="bg-[#FAF8F5] text-[#C8A97E] font-black italic">
                                        {(booking as any).customer?.name?.charAt(0) || 'C'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="text-xl font-black italic text-[#2C1E12] uppercase leading-tight mb-1">
                                            {(booking as any).customer?.name || 'Khách lẻ'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-[#8B7355]">
                                            <Badge variant="outline" className={cn("rounded-lg font-black text-[10px] uppercase tracking-tighter px-2 py-0", getStatusColor(booking.status))}>
                                                {booking.status}
                                            </Badge>
                                            <span className="opacity-40">•</span>
                                            <span className="uppercase tracking-widest">{booking.bookingCode}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span>{booking.services.length} Dịch vụ</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                            <span>{booking.salon.name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between items-end gap-4 shrink-0">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-[#8B7355] mb-1">Tổng thanh toán</p>
                                    <p className="text-2xl font-black italic text-[#C8A97E]">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalAmount)}
                                    </p>
                                </div>
                                <Button className="rounded-2xl bg-[#2C1E12] hover:bg-[#0f172a] text-white px-6 font-black uppercase text-xs tracking-widest group">
                                    Chi tiết <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          ))
        ) : (
          <div className="bg-white rounded-[2rem] p-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#F0EBE3]">
            <div className="w-20 h-20 rounded-full bg-[#FAF8F5] flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-[#C8A97E] opacity-20" />
            </div>
            <h3 className="text-2xl font-black italic text-[#2C1E12] uppercase mb-2">Không tìm thấy booking</h3>
            <p className="text-[#8B7355] font-medium max-w-md">Bạn chưa được phân công bất kỳ lịch đặt nào hoặc không có booking phù hợp với tìm kiếm.</p>
          </div>
        )}
      </div>
    </div>
  );
}
