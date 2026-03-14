'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi, salonApi } from '@/lib/api';
import { 
  Search, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Scissors, 
  User, 
  Plus, 
  QrCode,
  ArrowRight,
  Printer,
  ChevronRight,
  Info,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function CheckoutPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR'>('CASH');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Search bookings ready for checkout
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['cashier', 'checkout-eligible', searchTerm],
    queryFn: () => cashierApi.searchCustomers(searchTerm), // Reusing search or specific endpoint
    enabled: searchTerm.length > 2,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => cashierApi.checkout(selectedBooking.id, paymentMethod),
    onSuccess: () => {
      toast.success('Thanh toán thành công!');
      setIsCheckoutOpen(false);
      setSelectedBooking(null);
      queryClient.invalidateQueries({ queryKey: ['cashier', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'revenue'] });
    },
    onError: () => toast.error('Lỗi khi thực hiện thanh toán.')
  });

  const calculateTotal = (booking: any) => {
    if (!booking) return 0;
    return (booking.services || []).reduce((acc: number, s: any) => acc + Number(s.price || 0), 0);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Terminal <span className="text-[#C8A97E]">Checkout</span>
           </h1>
           <p className="text-slate-500 font-medium font-serif italic text-sm">Hệ thống quyết toán và xử lý giao dịch tại quầy.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
         {/* Search & Select Section */}
         <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-8 group">
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="p-4 rounded-[1.5rem] bg-slate-900 text-[#C8A97E]">
                        <Search className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Locate Patient</h3>
                        <p className="font-bold text-slate-400 uppercase text-[9px] tracking-widest leading-none">Tìm kiếm khách hàng cần thanh toán</p>
                     </div>
                  </div>
                  
                  <div className="relative">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#C8A97E]" />
                     <Input 
                       placeholder="Nhập tên khách hoặc số điện thoại..." 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="h-16 pl-14 pr-6 border-slate-100 bg-slate-50/50 rounded-2xl font-bold text-lg focus:ring-[#C8A97E]/20 transition-all placeholder:text-slate-300"
                     />
                  </div>

                  <div className="space-y-4 pt-4">
                     {isLoading && (
                        <div className="flex flex-col items-center py-10 gap-2">
                           <Loader2 className="w-6 h-6 text-[#C8A97E] animate-spin" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Repository...</p>
                        </div>
                     )}

                     {!isLoading && bookings && bookings.length > 0 ? (
                        bookings.map((booking: any) => (
                           <div 
                             key={booking.id}
                             onClick={() => setSelectedBooking(booking)}
                             className={cn(
                               "p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group/item",
                               selectedBooking?.id === booking.id 
                                 ? "border-[#C8A97E] bg-amber-50/50 shadow-lg" 
                                 : "border-slate-50 bg-white hover:border-slate-200"
                             )}
                           >
                              <div className="flex items-center gap-5">
                                 <Avatar className="h-14 w-14 border-4 border-white shadow-xl ring-2 ring-slate-100">
                                    <AvatarFallback className="bg-slate-900 text-white font-black italic text-xl">
                                       {booking.customerName?.charAt(0) || 'C'}
                                    </AvatarFallback>
                                 </Avatar>
                                 <div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-tighter italic text-lg leading-tight">{booking.customerName}</h4>
                                    <p className="text-[10px] font-black text-[#C8A97E] uppercase tracking-widest mt-1">{booking.timeSlot} • {dayjs(booking.date).format('DD/MM')}</p>
                                 </div>
                              </div>
                              <div className="text-right flex items-center gap-6">
                                 <div className="hidden md:block">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Total Bill</p>
                                    <p className="text-xl font-black text-slate-900 italic tracking-tighter">{calculateTotal(booking).toLocaleString()}đ</p>
                                 </div>
                                 <div className={cn(
                                   "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                   selectedBooking?.id === booking.id ? "bg-[#C8A97E] text-white" : "bg-slate-100 text-slate-300 group-hover/item:text-[#C8A97E] group-hover/item:bg-amber-50"
                                 )}>
                                    <ChevronRight className="w-5 h-5" />
                                 </div>
                              </div>
                           </div>
                        ))
                     ) : searchTerm.length > 2 && !isLoading ? (
                        <div className="text-center py-10">
                           <p className="text-slate-400 font-black italic uppercase text-xs">No active sessions found for "{searchTerm}"</p>
                        </div>
                     ) : null}
                  </div>
               </div>
            </Card>

            {/* Bill Details */}
            {selectedBooking && (
               <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                  <CardHeader className="p-10 pb-0 border-b border-slate-50 mb-10">
                     <div className="flex items-center justify-between pb-10">
                        <div>
                           <CardTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                              Order <span className="text-[#C8A97E]">Summary</span> <span className="text-slate-200 text-sm font-light">#{selectedBooking.id.slice(-6)}</span>
                           </CardTitle>
                           <CardDescription className="font-medium text-slate-500 italic">Kiểm tra chi tiết dịch vụ trước khi in hóa đơn.</CardDescription>
                        </div>
                        <Button variant="outline" className="rounded-2xl border-slate-100 h-11 font-bold text-xs">
                           <Printer className="w-4 h-4 mr-2" /> In hóa đơn
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent className="p-10 pt-0 space-y-10">
                     <div className="space-y-4">
                        {selectedBooking.services?.map((s: any) => (
                           <div key={s.id} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-white rounded-2xl shadow-sm text-[#C8A97E]">
                                    <Scissors className="w-4 h-4" />
                                 </div>
                                 <div>
                                    <p className="font-black text-slate-900 uppercase tracking-tighter italic text-sm">{s.name}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Professional Service</p>
                                 </div>
                              </div>
                              <p className="font-black text-slate-900 italic tracking-tighter text-lg">{Number(s.price).toLocaleString()}đ</p>
                           </div>
                        ))}
                        
                        <Button variant="ghost" className="w-full h-16 rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-400 hover:text-[#C8A97E] hover:border-[#C8A97E] hover:bg-amber-50 transition-all font-black italic uppercase text-[10px] tracking-widest">
                           <Plus className="w-4 h-4 mr-2" /> Thêm dịch vụ phát sinh
                        </Button>
                     </div>

                     <div className="pt-10 border-t border-slate-100 flex flex-col items-center">
                        <div className="w-full max-w-sm space-y-6">
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Sub-total:</span>
                              <span className="text-lg font-black text-slate-900 italic tracking-tighter">{calculateTotal(selectedBooking).toLocaleString()}đ</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Discount:</span>
                              <span className="text-lg font-black text-emerald-500 italic tracking-tighter">0đ</span>
                           </div>
                           <div className="h-px w-full bg-slate-100 my-4"></div>
                           <div className="flex items-center justify-between">
                              <span className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Total Amount:</span>
                              <div className="text-right">
                                 <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{calculateTotal(selectedBooking).toLocaleString()}đ</h2>
                                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic">Paid in full (Cash/QR)</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            )}
         </div>

         {/* Payment Action Section */}
         <div className="space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-[#0f172a] text-white p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C8A97E] to-transparent opacity-10 blur-3xl transition-opacity group-hover:opacity-30"></div>
               
               <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                  Select <span className="text-[#C8A97E]">Method</span>
               </h3>

               <div className="space-y-4">
                  <div 
                    onClick={() => setPaymentMethod('CASH')}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-5",
                      paymentMethod === 'CASH' 
                        ? "border-[#C8A97E] bg-[#C8A97E]/10" 
                        : "border-white/5 bg-white/5 hover:bg-white/10"
                    )}
                  >
                     <div className={cn("p-4 rounded-2xl", paymentMethod === 'CASH' ? "bg-[#C8A97E] text-white" : "bg-white/10 text-slate-400")}>
                        <Banknote className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="font-black italic uppercase tracking-tighter text-lg">Tiền mặt</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Physical Settlement</p>
                     </div>
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-5",
                      paymentMethod === 'VIETQR' 
                        ? "border-emerald-500 bg-emerald-500/10" 
                        : "border-white/5 bg-white/5 hover:bg-white/10"
                    )}
                  >
                     <div className={cn("p-4 rounded-2xl", paymentMethod === 'VIETQR' ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400")}>
                        <QrCode className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="font-black italic uppercase tracking-tighter text-lg">Chuyển khoản / QR</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">SePay Auto Terminal</p>
                     </div>
                  </div>
               </div>

               <Button 
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending || !selectedBooking}
                className="w-full mt-12 bg-[#C8A97E] hover:bg-amber-600 text-white rounded-[2rem] h-20 font-black italic uppercase text-lg tracking-[0.2em] shadow-3xl shadow-[#C8A97E]/30 relative group overflow-hidden"
               >
                  <span className="relative z-10 flex items-center gap-4">
                     {checkoutMutation.isPending ? 'Propagating...' : 'Authorize Checkout'} 
                     <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
               </Button>
               
               {!selectedBooking && (
                  <div className="mt-8 flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                     <Info className="w-4 h-4 text-[#C8A97E] mt-1 shrink-0" />
                     <p className="text-[10px] font-medium text-slate-400 italic leading-relaxed">Vui lòng tìm và chọn khách hàng bên trái để mở khóa Terminal Checkout.</p>
                  </div>
               )}
            </Card>

            <Card className="border-none shadow-xl rounded-[3rem] bg-white p-10 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                     <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="font-black italic uppercase tracking-tighter text-lg">Revenue Shield</h3>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Hệ thống bảo vệ doanh thu & kiểm soát gian lận</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                     <span className="text-slate-500 font-bold italic">Audit Status:</span>
                     <Badge className="bg-emerald-50 text-emerald-600 border-none font-black italic tracking-widest">SECURE</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                     <span className="text-slate-500 font-bold italic">Last Refresh:</span>
                     <span className="font-bold text-slate-900">Just now</span>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
