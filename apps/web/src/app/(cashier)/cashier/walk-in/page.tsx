'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi, serviceApi, staffApi } from '@/lib/api';
import { 
  UserPlus, 
  Scissors, 
  Search, 
  Phone, 
  Clock, 
  User, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  PlusCircle,
  X,
  ListOrdered
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn, formatPrice } from '@/lib/utils';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function WalkinPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    serviceIds: [] as string[],
    staffId: '',
    note: ''
  });

  const { data: services } = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => serviceApi.getAll({ limit: 100 }),
  });

  const { data: branchStaff } = useQuery({
    queryKey: ['cashier', 'staff-list'],
    queryFn: () => cashierApi.getAvailableBarbers(dayjs().format('YYYY-MM-DD'), dayjs().format('HH:mm')),
  });

  const walkinMutation = useMutation({
    mutationFn: (data: any) => cashierApi.createWalkinBooking(data),
    onSuccess: () => {
      toast.success('Đã bắt đầu phục vụ khách hàng!');
      setFormData({ customerName: '', phone: '', serviceIds: [], staffId: '', note: '' });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'queue'] });
    },
    onError: () => toast.error('Lỗi khi tiếp nhận khách.')
  });

  const queueMutation = useMutation({
    mutationFn: (data: any) => cashierApi.addToQueue(data),
    onSuccess: () => {
      toast.success('Đã thêm khách vào hàng chờ thành công!');
      setFormData({ customerName: '', phone: '', serviceIds: [], staffId: '', note: '' });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'queue'] });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'stats'] });
    },
    onError: () => toast.error('Lỗi khi thêm vào hàng chờ.')
  });

  const toggleService = (id: string) => {
    setFormData(prev => ({
        ...prev,
        serviceIds: prev.serviceIds.includes(id) 
            ? prev.serviceIds.filter(s => s !== id) 
            : [...prev.serviceIds, id]
    }));
  };

  const totalPrice = services?.data
    ?.filter((s: any) => formData.serviceIds.includes(s.id))
    ?.reduce((acc: number, curr: any) => acc + Number(curr.price), 0) || 0;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
              Tiếp nhận <span className="text-[#C8A97E]">Khách vãng lai</span>
           </h1>
           <p className="text-slate-500 font-medium italic text-sm">Tạo lịch phục vụ nhanh hoặc thêm vào hàng chờ cho khách không đặt trước.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Form Section */}
         <div className="xl:col-span-2 space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group">
               <CardHeader className="p-10 pb-0">
                  <div className="flex items-center gap-4">
                     <div className="p-4 rounded-[1.5rem] bg-slate-900 text-[#C8A97E] shadow-xl group-hover:scale-110 transition-transform">
                        <UserPlus className="w-6 h-6" />
                     </div>
                     <div>
                        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Phiếu tiếp nhận</CardTitle>
                        <CardDescription className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">Thông tin khách hàng mới</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Họ và tên khách</label>
                        <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <Input 
                             placeholder="VD: Anh Tuấn" 
                             value={formData.customerName}
                             onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                             className="pl-12 border-slate-100 bg-slate-50 h-14 rounded-2xl font-bold focus:ring-[#C8A97E]/20"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Số điện thoại (Nếu có)</label>
                        <div className="relative">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <Input 
                             placeholder="VD: 0912345678" 
                             value={formData.phone}
                             onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                             className="pl-12 border-slate-100 bg-slate-50 h-14 rounded-2xl font-bold focus:ring-[#C8A97E]/20"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Chọn dịch vụ phục vụ</label>
                        {totalPrice > 0 && (
                            <Badge className="bg-[#C8A97E] text-white border-none font-black italic px-3 py-1">
                                TỔNG: {formatPrice(totalPrice)}
                            </Badge>
                        )}
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {services?.data?.map((svc: any) => (
                           <div 
                             key={svc.id}
                             onClick={() => toggleService(svc.id)}
                             className={cn(
                                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group",
                                formData.serviceIds.includes(svc.id)
                                 ? "border-[#C8A97E] bg-amber-50/50 shadow-md scale-[1.02]"
                                 : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
                             )}
                           >
                              <div className="flex justify-between items-start">
                                 <Scissors className={cn("w-4 h-4", formData.serviceIds.includes(svc.id) ? "text-[#C8A97E]" : "text-slate-300")} />
                                 {formData.serviceIds.includes(svc.id) && <CheckCircle2 className="w-4 h-4 text-[#C8A97E] fill-amber-50" />}
                              </div>
                              <div className="mt-1">
                                 <p className="font-black text-[11px] text-slate-900 uppercase tracking-tighter truncate">{svc.name}</p>
                                 <p className="font-black text-[10px] text-[#C8A97E] tracking-tight">{formatPrice(svc.price)}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Phân công Barber</label>
                        <Select value={formData.staffId} onValueChange={(v) => setFormData({ ...formData, staffId: v })}>
                           <SelectTrigger className="h-14 border-slate-100 bg-slate-50 rounded-2xl font-bold">
                              <SelectValue placeholder="Chọn thợ đang trống" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-slate-100">
                              {branchStaff?.map((s: any) => (
                                 <SelectItem key={s.id} value={s.id} disabled={!s.isAvailable} className="font-bold py-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                       <Avatar className="h-6 w-6 border border-slate-100">
                                          <AvatarImage src={s.avatar} />
                                          <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                                       </Avatar>
                                       <span>{s.name} {!s.isAvailable && <span className="text-[10px] text-rose-400 font-medium ml-1">({s.reason || 'Bận'})</span>}</span>
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Ghi chú yêu cầu</label>
                        <Input 
                           placeholder="VD: Cắt kỹ 2 bên mai, dùng sáp xịn..." 
                           value={formData.note}
                           onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                           className="border-slate-100 bg-slate-50 h-14 rounded-2xl font-bold focus:ring-[#C8A97E]/20"
                        />
                     </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                     <Button 
                       onClick={() => queueMutation.mutate({ customerName: formData.customerName, serviceId: formData.serviceIds[0], staffId: formData.staffId })}
                       disabled={queueMutation.isPending || walkinMutation.isPending || !formData.customerName}
                       className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-100 rounded-[1.5rem] h-14 font-black italic uppercase text-xs tracking-[0.2em] shadow-xl shadow-slate-200/50"
                     >
                        <ListOrdered className="w-4 h-4 mr-2" /> Thêm vào Chàng chờ
                     </Button>
                     <Button 
                       onClick={() => walkinMutation.mutate(formData)}
                       disabled={walkinMutation.isPending || queueMutation.isPending || !formData.customerName || formData.serviceIds.length === 0}
                       className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] h-14 font-black italic uppercase text-xs tracking-[0.2em] shadow-2xl shadow-slate-900/40 group"
                     >
                        {walkinMutation.isPending ? 'Đang khởi tạo...' : 'Bắt đầu Phục vụ ngay'}
                        <ArrowRight className="w-5 h-5 ml-3 text-[#C8A97E] group-hover:translate-x-2 transition-transform" />
                     </Button>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Info Right Section */}
         <div className="space-y-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] to-slate-900 text-white p-8">
               <h3 className="text-xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                  Tra cứu <span className="text-[#C8A97E]">Nhanh</span> <Search className="w-4 h-4 text-[#C8A97E]" />
               </h3>
               <div className="space-y-4">
                  <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                     <Input 
                       placeholder="SĐT hoặc tên khách..." 
                       className="pl-12 bg-white/10 border-white/10 h-14 rounded-2xl font-bold placeholder:text-slate-500"
                     />
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center italic">Xem lịch sử để tư vấn dịch vụ phù hợp nhất</p>
               </div>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black italic uppercase tracking-tighter">Gợi ý <span className="text-[#C8A97E]">Upsell</span></h3>
                  <Badge className="bg-amber-50 text-amber-600 border-none font-bold text-[8px] uppercase tracking-widest">AI SUGGEST</Badge>
               </div>
               
               <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 space-y-3">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest italic flex items-center gap-2">
                     <PlusCircle className="w-3.5 h-3.5" /> Cơ hội tăng doanh thu
                  </p>
                  <p className="text-xs font-medium text-amber-900 leading-relaxed italic">&quot;Khách cắt tóc thường muốn được gội đầu thư giãn. Hãy gợi ý thêm **Combo Relax** để tăng sự hài lòng!&quot;</p>
               </div>

               <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ đi kèm phổ biến:</p>
                  <div className="flex flex-wrap gap-2">
                     <Badge variant="outline" className="rounded-full border-slate-100 font-bold py-1 px-3 text-[10px] cursor-pointer hover:bg-[#C8A97E] hover:text-white transition-colors">Combo Shave</Badge>
                     <Badge variant="outline" className="rounded-full border-slate-100 font-bold py-1 px-3 text-[10px] cursor-pointer hover:bg-[#C8A97E] hover:text-white transition-colors">Gội Massage</Badge>
                     <Badge variant="outline" className="rounded-full border-slate-100 font-bold py-1 px-3 text-[10px] cursor-pointer hover:bg-[#C8A97E] hover:text-white transition-colors">Tẩy da chết</Badge>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
