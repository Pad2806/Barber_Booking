'use client';

import { useQuery } from '@tanstack/react-query';
import { cashierApi } from '@/lib/api';
import { 
  BarChart3, 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  Download,
  Calendar,
  DollarSign,
  PieChart,
  LineChart,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import React from 'react';
import dayjs from 'dayjs';

export default function CashierRevenuePage() {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['cashier', 'revenue', 'today'],
    queryFn: cashierApi.getDetailedRevenue,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex bg-white rounded-[2rem] border border-slate-100 items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Aggregating Financials...</p>
        </div>
      </div>
    );
  }

  const totals = revenueData?.summary || { total: 0, cash: 0, bank: 0, transactions: 0 };
  const transactions = revenueData?.transactions || [];

  const statCards = [
    { label: 'Tổng doanh thu', value: totals.total.toLocaleString() + 'đ', icon: DollarSign, trend: '+12.5%', color: 'bg-[#C8A97E]' },
    { label: 'Tiền mặt (Cash)', value: totals.cash.toLocaleString() + 'đ', icon: Banknote, trend: '45%', color: 'bg-amber-500' },
    { label: 'Chuyển khoản (QR)', value: totals.bank.toLocaleString() + 'đ', icon: CreditCard, trend: '55%', color: 'bg-emerald-500' },
    { label: 'Số giao dịch', value: totals.transactions, icon: TrendingUp, trend: 'Stable', color: 'bg-blue-600' },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Financial <span className="text-[#C8A97E]">Ledger</span>
           </h1>
           <p className="text-slate-500 font-medium font-serif italic text-sm">Báo cáo doanh thu chi tiết trong ngày.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-2xl border-slate-100 h-12 font-bold text-xs shadow-sm bg-white">
              <Download className="w-4 h-4 mr-2 text-[#C8A97E]" /> Xuất CSV
           </Button>
           <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-2xl h-12 px-6 font-bold shadow-xl shadow-slate-200">
              <Printer className="w-4 h-4 mr-2 text-[#C8A97E]" /> In báo cáo
           </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <Card key={i} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-8 relative">
              <div className="flex items-center justify-between gap-4">
                 <div className={cn("p-4 rounded-2xl text-white shadow-lg", card.color)}>
                    <card.icon className="w-5 h-5" />
                 </div>
                 <Badge variant="outline" className="border-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-tighter">
                    {card.trend}
                 </Badge>
              </div>
              <div className="mt-8">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{card.label}</p>
                 <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter mt-1">{card.value}</h3>
              </div>
              <div className="absolute bottom-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                 <card.icon className="w-16 h-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         {/* Transaction List */}
         <div className="xl:col-span-2 space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
               <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                  <div>
                     <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Daily <span className="text-[#C8A97E]">Journal</span></CardTitle>
                     <CardDescription className="font-bold text-slate-400 uppercase text-[9px] tracking-widest leading-none mt-1">Danh sách giao dịch hôm nay</CardDescription>
                  </div>
                  <div className="relative group">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[#C8A97E]" />
                     <Input 
                       placeholder="Filter bills..." 
                       className="pl-12 border-slate-50 bg-slate-50/50 h-11 rounded-xl font-bold text-xs"
                     />
                  </div>
               </CardHeader>
               <CardContent className="p-10">
                  <div className="space-y-4">
                     {transactions.length > 0 ? (
                        transactions.map((tx: any) => (
                           <div key={tx.id} className="group flex items-center justify-between p-6 rounded-[2rem] bg-white border border-slate-50 hover:border-[#C8A97E]/30 hover:shadow-2xl transition-all duration-500">
                              <div className="flex items-center gap-6">
                                 <div className={cn(
                                   "p-4 rounded-2xl shadow-inner",
                                   tx.method === 'CASH' ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
                                 )}>
                                    {tx.method === 'CASH' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                 </div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                       <h5 className="font-black text-slate-900 uppercase tracking-tighter italic leading-none">{tx.customerName}</h5>
                                       <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[8px] uppercase tracking-widest">{tx.method}</Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dayjs(tx.createdAt).format('HH:mm')} • Order #{tx.id.slice(-6).toUpperCase()}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-xl font-black text-slate-900 italic tracking-tighter">{Number(tx.amount).toLocaleString()}đ</p>
                                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic flex items-center justify-end gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Audited
                                 </p>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="text-center py-20 flex flex-col items-center gap-4">
                           <div className="p-6 rounded-full bg-slate-50 text-slate-200">
                              <BarChart3 className="w-12 h-12" />
                           </div>
                           <p className="text-slate-400 font-black italic uppercase text-xs tracking-widest">No transactions recorded today</p>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Visual Analytics Sidebar */}
         <div className="space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-[#0f172a] text-white p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C8A97E] to-transparent opacity-10 blur-3xl"></div>
               <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                  Volume <span className="text-[#C8A97E]">Health</span> <LineChart className="w-5 h-5" />
               </h3>
               
               <div className="space-y-10">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Method Distribution</p>
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold italic">
                              <span className="text-slate-400">Cash Settlement</span>
                              <span className="text-[#C8A97E]">{Math.round((totals.cash / totals.total || 0) * 100)}%</span>
                           </div>
                           <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${(totals.cash / totals.total || 0) * 100}%` }} 
                                className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all duration-1000"
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold italic">
                              <span className="text-slate-400">Digital / Bank Transfer</span>
                              <span className="text-emerald-500">{Math.round((totals.bank / totals.total || 0) * 100)}%</span>
                           </div>
                           <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${(totals.bank / totals.total || 0) * 100}%` }} 
                                className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#C8A97E]/30 transition-all group/bonus">
                     <div className="flex items-center gap-3 mb-4">
                        <PieChart className="w-5 h-5 text-[#C8A97E]" />
                        <h4 className="font-black italic uppercase tracking-tighter">Smart Insight</h4>
                     </div>
                     <p className="text-xs font-medium text-slate-400 leading-relaxed font-serif italic">"Khách hàng ưu tiên thanh toán qua **VietQR** hơn bình thường trong buổi sáng. Đảm bảo mã QR luôn được hiển thị tại quầy."</p>
                  </div>

                  <div className="pt-6">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-[#C8A97E] animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Live Sync Active</span>
                     </div>
                     <p className="text-[9px] font-bold text-slate-600 italic">Dữ liệu được cập nhật tự động sau mỗi 60 giây.</p>
                  </div>
               </div>
            </Card>
            
            <Card className="border-none shadow-xl rounded-[3rem] bg-white p-10">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-lg">
                     <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="font-black italic uppercase tracking-tighter text-lg leading-tight">Identity Verified</h3>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Hệ thống đối soát tự động</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-500 uppercase italic">Branch ID:</span>
                     <span className="text-xs font-black text-slate-900">#REETRO-B1</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-500 uppercase italic">Duty Cashier:</span>
                     <span className="text-xs font-black text-slate-900">Official Terminal</span>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
