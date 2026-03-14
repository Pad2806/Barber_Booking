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
import { cn } from '@/lib/utils';
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

  const { data: staff } = useQuery({
    queryKey: ['staff', 'barbers'],
    queryFn: () => staffApi.getAvailableSlots(new Date().toISOString(), '', 0), // Fetching staff via slots for now or custom
    // Actually simpler: just get all staff for branch
    // managerApi.getStaff would work too if cashier allowed
  });

  // Reusing manager staff fetch since cashier is allowed
  const { data: branchStaff } = useQuery({
    queryKey: ['cashier', 'staff-list'],
    queryFn: () => cashierApi.getAvailableBarbers(dayjs().format('YYYY-MM-DD'), dayjs().format('HH:mm')),
  });

  const walkinMutation = useMutation({
    mutationFn: (data: any) => cashierApi.createWalkinBooking(data),
    onSuccess: () => {
      toast.success('Đã tạo lịch hẹn thành công!');
      setFormData({ customerName: '', phone: '', serviceIds: [], staffId: '', note: '' });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'bookings'] });
    },
    onError: () => toast.error('Lỗi khi tạo lịch đặt.')
  });

  const queueMutation = useMutation({
    mutationFn: (data: any) => cashierApi.addToQueue(data),
    onSuccess: () => {
      toast.success('Đã thêm khách vào hàng chờ!');
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

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Walk-in <span className="text-[#C8A97E]">Customers</span>
           </h1>
           <p className="text-slate-500 font-medium font-serif italic">Tiếp nhận khách vãng lai và quản lý hàng chờ thời gian thực.</p>
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
                        <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Registration Form</CardTitle>
                        <CardDescription className="font-bold text-slate-400 uppercase text-[9px] tracking-widest">Chi tiết khách vãng lai mới</CardDescription>
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
                             placeholder="VD: Nguyễn Văn A" 
                             value={formData.customerName}
                             onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                             className="pl-12 border-slate-100 bg-slate-50 h-14 rounded-2xl font-bold focus:ring-[#C8A97E]/20"
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Số điện thoại (Tùy chọn)</label>
                        <div className="relative">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <Input 
                             placeholder="VD: 0987xxxxxx" 
                             value={formData.phone}
                             onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                             className="pl-12 border-slate-100 bg-slate-50 h-14 rounded-2xl font-bold focus:ring-[#C8A97E]/20"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Gói dịch vụ (Chọn nhiều)</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {services?.data?.map((svc: any) => (
                           <div 
                             key={svc.id}
                             onClick={() => toggleService(svc.id)}
                             className={cn(
                                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group",
                                formData.serviceIds.includes(svc.id)
                                 ? "border-[#C8A97E] bg-amber-50/50 shadow-md"
                                 : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
                             )}
                           >
                              <div className="flex justify-between items-start">
                                 <Scissors className={cn("w-4 h-4", formData.serviceIds.includes(svc.id) ? "text-[#C8A97E]" : "text-slate-300")} />
                                 {formData.serviceIds.includes(svc.id) && <CheckCircle2 className="w-4 h-4 text-[#C8A97E] fill-amber-50" />}
                              </div>
                              <div className="mt-1">
                                 <p className="font-black text-[11px] text-slate-900 uppercase tracking-tighter truncate">{svc.name}</p>
                                 <p className="font-black text-[10px] text-[#C8A97E] tracking-tight">{Number(svc.price).toLocaleString()}đ</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Chọn Barber (Tùy chọn)</label>
                        <Select value={formData.staffId} onValueChange={(v) => setFormData({ ...formData, staffId: v })}>
                           <SelectTrigger className="h-14 border-slate-100 bg-slate-50 rounded-2xl font-bold">
                              <SelectValue placeholder="Để hệ thống tự gán" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-slate-100">
                              {branchStaff?.map((s: any) => (
                                 <SelectItem key={s.id} value={s.id} disabled={!s.isAvailable} className="font-bold py-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                       <Avatar className="h-6 w-6">
                                          <AvatarImage src={s.avatar} />
                                          <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                                       </Avatar>
                                       <span>{s.name} {!s.isAvailable && `(${s.reason})`}</span>
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Ghi chú phục vụ</label>
                        <Input 
                          placeholder="VD: Cạo sát chân tóc, dùng wax..." 
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
                        <ListOrdered className="w-4 h-4 mr-2" /> Add to Queue
                     </Button>
                     <Button 
                       onClick={() => walkinMutation.mutate(formData)}
                       disabled={walkinMutation.isPending || queueMutation.isPending || !formData.customerName || formData.serviceIds.length === 0}
                       className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] h-14 font-black italic uppercase text-xs tracking-[0.2em] shadow-2xl shadow-slate-900/40 group"
                     >
                        {walkinMutation.isPending ? 'Propagating...' : 'Start Immediate Session'}
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
                  Quick <span className="text-[#C8A97E]">Search</span> <Search className="w-4 h-4 text-[#C8A97E]" />
               </h3>
               <div className="space-y-4">
                  <div className="relative">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                     <Input 
                       placeholder="SĐT hoặc tên khách..." 
                       className="pl-12 bg-white/10 border-white/10 h-14 rounded-2xl font-bold placeholder:text-slate-500"
                     />
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center italic">Tìm kiếm lịch sử khách hàng để tư vấn tốt hơn</p>
               </div>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black italic uppercase tracking-tighter">Bonus <span className="text-[#C8A97E]">Feature</span></h3>
                  <Badge className="bg-amber-50 text-amber-600 border-none font-bold text-[8px] uppercase tracking-widest">AI Suggest</Badge>
               </div>
               
               <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 space-y-3">
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest italic flex items-center gap-2">
                     <PlusCircle className="w-3.5 h-3.5" /> Upsell Opportunity
                  </p>
                  <p className="text-xs font-medium text-amber-900 leading-relaxed font-serif italic">&quot;Nếu khách đặt **Haircut**, hãy gợi ý thêm combo **Hair Wash + Massage** để tăng 30% doanh thu!&quot;</p>
               </div>

               <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gợi ý Combo Hot:</p>
                  <div className="flex flex-wrap gap-2">
                     <Badge variant="outline" className="rounded-full border-slate-100 font-bold py-1 px-3 text-[10px] cursor-pointer hover:bg-[#C8A97E] hover:text-white transition-colors">Combo Cắt + Gội</Badge>
                     <Badge variant="outline" className="rounded-full border-slate-100 font-bold py-1 px-3 text-[10px] cursor-pointer hover:bg-[#C8A97E] hover:text-white transition-colors">Uốn + Nhuộm</Badge>
                     <Badge variant="outline" className="rounded-full border-slate-100 font-bold py-1 px-3 text-[10px] cursor-pointer hover:bg-[#C8A97E] hover:text-white transition-colors">Massage Facial</Badge>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
