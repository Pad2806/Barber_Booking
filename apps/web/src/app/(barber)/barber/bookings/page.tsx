'use client';

import { useQuery } from '@tanstack/react-query';
import { bookingApi, usersApi } from '@/lib/api';
import { 
  MapPin, 
  Clock, 
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  CreditCard,
  Scissors,
  CalendarDays
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
  DialogFooter
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils';

export default function BarberBookingsPage() {
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
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
                                <Button 
                                    onClick={() => {
                                        setSelectedBooking(booking);
                                        setIsDetailOpen(true);
                                    }}
                                    className="rounded-2xl bg-[#2C1E12] hover:bg-[#0f172a] text-white px-6 font-black uppercase text-xs tracking-widest group"
                                >
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

      {/* Booking Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white rounded-[3rem] p-0 overflow-hidden">
          <DialogHeader className="p-10 pb-6 bg-[#FAF8F5] relative overflow-hidden text-left">
             <div className="absolute top-0 right-0 p-10 opacity-5">
                <Scissors className="w-40 h-40 text-[#2C1E12]" />
             </div>
             <div className="relative z-10 flex flex-col items-start gap-4">
               <Badge className={cn("rounded-xl font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1 border-none shadow-sm", getStatusColor(selectedBooking?.status))}>
                  {selectedBooking?.status}
               </Badge>
               <DialogTitle className="text-4xl font-black italic text-[#2C1E12] uppercase tracking-tighter leading-none">
                  Booking <span className="text-[#C8A97E]">Detail</span>
               </DialogTitle>
               <DialogDescription className="text-[#8B7355] font-bold text-xs uppercase tracking-widest italic flex items-center gap-2">
                  <span className="opacity-50">Reference:</span> {selectedBooking?.bookingCode}
               </DialogDescription>
             </div>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto">
            <div className="p-10 space-y-10">
              {/* Customer Info */}
              <div className="flex items-center gap-6">
                 <Avatar className="h-20 w-20 border-4 border-white shadow-2xl shrink-0">
                    <AvatarImage src={(selectedBooking as any)?.customer?.avatar} />
                    <AvatarFallback className="bg-[#FAF8F5] text-[#C8A97E] text-2xl font-black italic">
                       {(selectedBooking as any)?.customer?.name?.charAt(0) || 'C'}
                    </AvatarFallback>
                 </Avatar>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-[#8B7355] tracking-widest">Client Name</p>
                    <h4 className="text-2xl font-black italic text-[#2C1E12] uppercase truncate">
                       {(selectedBooking as any)?.customer?.name || 'Walk-in Client'}
                    </h4>
                    <p className="text-xs font-bold text-slate-400">{(selectedBooking as any)?.customer?.phone || 'No phone provided'}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#FAF8F5] p-6 rounded-[2rem] border border-[#F0EBE3] shadow-sm">
                    <div className="flex items-center gap-2 text-[#C8A97E] mb-2">
                       <CalendarDays className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Schedule</span>
                    </div>
                    <p className="font-black italic text-lg text-[#2C1E12]">
                       {selectedBooking?.date && format(new Date(selectedBooking.date), 'dd MMM yyyy')}
                    </p>
                    <div className="text-xs font-bold text-[#8B7355] mt-1 italic uppercase tracking-tighter flex items-center gap-2">
                       <Clock className="w-3.5 h-3.5" /> {selectedBooking?.timeSlot}
                    </div>
                 </div>
                 <div className="bg-[#FAF8F5] p-6 rounded-[2rem] border border-[#F0EBE3] shadow-sm">
                    <div className="flex items-center gap-2 text-[#C8A97E] mb-2">
                       <MapPin className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Location</span>
                    </div>
                    <p className="font-black italic text-lg text-[#2C1E12] truncate">
                       {selectedBooking?.salon?.name}
                    </p>
                    <p className="text-xs font-bold text-[#8B7355] mt-1 truncate">{selectedBooking?.salon?.address}</p>
                 </div>
              </div>

              {/* Services List */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black uppercase text-[#8B7355] tracking-[0.2em] px-4">Services Rendered</h5>
                    <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-100 text-[10px] px-3 font-bold">{selectedBooking?.services?.length} items</Badge>
                 </div>
                 <div className="space-y-2">
                    {selectedBooking?.services?.map((item: any, idx: number) => (
                       <div key={idx} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#C8A97E]/30 transition-all group">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-[#C8A97E] group-hover:bg-slate-900 group-hover:text-white transition-all">
                                <Scissors className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="font-black italic uppercase text-xs text-[#2C1E12] tracking-tight">{item.service?.name}</p>
                                <p className="text-[10px] font-bold text-[#8B7355] opacity-60 uppercase">{item.service?.duration} mins</p>
                             </div>
                          </div>
                          <p className="font-black italic text-slate-900">{formatPrice(item.price)}</p>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Note Section */}
              {selectedBooking?.note && (
                 <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-[#8B7355] tracking-[0.2em] px-4">Internal Notes</h5>
                    <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-[2rem] relative">
                       <FileText className="absolute top-6 right-6 w-8 h-8 text-amber-900/5" />
                       <p className="text-xs font-bold text-amber-900/60 italic leading-relaxed">
                          &quot;{selectedBooking.note}&quot;
                       </p>
                    </div>
                 </div>
              )}

              {/* Payment Summary */}
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8A97E]/10 blur-[60px] rounded-full" />
                 <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between text-[#C8A97E] opacity-60">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em]">Financial Summary</p>
                       <CreditCard className="w-5 h-5" />
                    </div>
                    
                    <div className="space-y-4">
                       <div className="flex items-center justify-between text-xs font-bold opacity-60 uppercase tracking-widest">
                          <span>Subtotal</span>
                          <span>{formatPrice(selectedBooking?.totalAmount)}</span>
                       </div>
                       <div className="h-px bg-white/10 w-full" />
                       <div className="flex items-center justify-between">
                          <span className="font-black italic text-lg uppercase tracking-tight">Total Payment</span>
                          <span className="text-2xl font-black italic text-[#C8A97E]">
                             {formatPrice(selectedBooking?.totalAmount)}
                          </span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-10 pt-0">
             <Button 
               variant="ghost" 
               onClick={() => setIsDetailOpen(false)}
               className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] text-[#8B7355] hover:bg-[#FAF8F5] transition-all"
             >
                Close Dossier
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
