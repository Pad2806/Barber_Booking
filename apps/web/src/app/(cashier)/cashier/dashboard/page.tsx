'use client';

import { useQuery } from '@tanstack/react-query';
import { cashierApi } from '@/lib/api';
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  UserPlus, 
  DollarSign,
  Loader2,
  Clock,
  ListOrdered,
  Bell,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CashierDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['cashier', 'stats'],
    queryFn: cashierApi.getDashboardStats,
    refetchInterval: 15000, // Refresh every 15s for cashier real-time feel
  });

  const { data: queue } = useQuery({
    queryKey: ['cashier', 'queue'],
    queryFn: cashierApi.getQueue,
  });

  if (isLoading) {
    return (
      <div className="flex bg-white rounded-3xl border border-slate-100 items-center justify-center min-h-[600px] shadow-sm">
        <div className="flex flex-col items-center gap-4">
           <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-50 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin absolute top-0"></div>
           </div>
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Front Desk...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Lịch hẹn hôm nay', value: stats?.todayAppointments || 0, icon: CalendarCheck, color: 'from-[#C8A97E] to-amber-600', sub: 'Tổng lượt đặt' },
    { label: 'Khách đang chờ', value: stats?.waitingCustomers || 0, icon: ListOrdered, color: 'from-orange-500 to-rose-500', sub: 'Walk-in queue' },
    { label: 'Đã hoàn tất', value: stats?.completedServices || 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', sub: 'Dịch vụ xong' },
    { label: 'Doanh thu ngày', value: (stats?.todayRevenue || 0).toLocaleString() + 'đ', icon: DollarSign, color: 'from-blue-600 to-indigo-700', sub: 'Thực thu' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Front Desk Live</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Operational <span className="text-[#C8A97E]">Hub</span>
           </h1>
           <p className="text-slate-500 font-medium font-serif italic text-sm">Welcome back. Ready for a busy day?</p>
        </div>
        
        <div className="flex gap-3">
           <Button className="bg-[#0f172a] text-white hover:bg-slate-800 rounded-2xl h-11 px-6 font-bold shadow-xl shadow-slate-200" asChild>
              <Link href="/cashier/walk-in">
                 <UserPlus className="w-4 h-4 mr-2" /> Khách vãng lai
              </Link>
           </Button>
           <Button className="bg-[#C8A97E] text-white hover:bg-amber-600 rounded-2xl h-11 px-6 font-bold shadow-xl shadow-amber-200" asChild>
              <Link href="/cashier/checkout">
                 <DollarSign className="w-4 h-4 mr-2" /> Thanh toán mới
              </Link>
           </Button>
        </div>
      </div>

      {/* Quick Alerts - Bonus Smart Feature */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
               <Bell className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10 flex items-center gap-5">
               <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg animate-bounce">
                  <Clock className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-white font-black italic uppercase tracking-tighter text-lg">Next Appointment</h4>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Expected in 12 minutes (09:30)</p>
               </div>
            </div>
            <Button variant="link" className="text-[#C8A97E] font-black italic uppercase text-[10px] tracking-widest group-hover:translate-x-2 transition-transform">
               View Details <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
         </div>

         <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-xl border border-slate-50 group">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner">
                  <AlertCircle className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-slate-900 font-black italic uppercase tracking-tighter text-lg">Online Requests</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <Badge className="bg-rose-500 text-white border-none font-bold">3 PENDING</Badge>
                     <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Waiting for approval</p>
                  </div>
               </div>
            </div>
            <Button className="bg-[#F8FAFC] text-slate-600 hover:bg-[#C8A97E] hover:text-white rounded-xl h-9 px-4 font-black italic text-[10px] uppercase tracking-widest transition-all" asChild>
               <Link href="/cashier/online-bookings">Duyệt ngay</Link>
            </Button>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <Card key={i} className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white">
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br transition-opacity duration-500", card.color)}></div>
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className={cn("p-4 rounded-2xl bg-gradient-to-br text-white shadow-xl shadow-slate-100", card.color)}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-8">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{card.label}</p>
                <div className="flex items-end gap-2 mt-1">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none">{card.value}</h3>
                   <span className="text-[9px] font-bold text-slate-500 uppercase pb-1">{card.sub}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Waiting Queue Preview */}
        <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-0">
             <div className="flex items-center justify-between">
                <div>
                   <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Waiting Queue</CardTitle>
                   <CardDescription className="font-medium font-serif italic text-slate-500">Thứ tự ưu tiên khách vãng lai</CardDescription>
                </div>
                <Button variant="ghost" className="rounded-xl text-[#C8A97E] font-bold hover:bg-amber-50" asChild>
                   <Link href="/cashier/queue">Quản lý toàn bộ</Link>
                </Button>
             </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="space-y-4">
               {Array.isArray(queue) && queue.length > 0 ? (
                 queue.slice(0, 4).map((item: any, idx: number) => (
                   <div key={item.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100 group">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-lg font-black italic text-slate-400 group-hover:text-[#C8A97E] transition-colors">
                            {idx + 1}
                         </div>
                         <div>
                            <h5 className="font-black text-slate-900 uppercase tracking-tighter italic">{item.customerName}</h5>
                            <p className="text-[10px] font-black text-[#C8A97E] uppercase tracking-widest mt-0.5">{item.service?.name || 'Walk-in Service'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrival</p>
                            <p className="font-bold text-slate-900 italic">{new Date(item.arrivalTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                         </div>
                         <Badge 
                           className={cn(
                             "px-4 py-1.5 rounded-xl font-black italic text-[9px] uppercase tracking-widest",
                             item.status === 'SERVING' ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"
                           )}
                         >
                            {item.status}
                         </Badge>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No one is waiting currently</p>
                    <Button variant="link" className="text-[#C8A97E] mt-2 font-black italic uppercase text-[10px]" asChild>
                       <Link href="/cashier/walk-in">Add First Customer</Link>
                    </Button>
                 </div>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Revenue Insights */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-[#0f172a] text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C8A97E] to-transparent opacity-20 blur-3xl"></div>
           <CardHeader className="p-10">
              <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Snap <span className="text-[#C8A97E]">Revenue</span></CardTitle>
              <CardDescription className="text-slate-400 font-medium italic">Thống kê nhanh trong ngày</CardDescription>
           </CardHeader>
           <CardContent className="p-10 pt-0 space-y-10">
              <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Total Cash Collected</p>
                 <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black tracking-tighter italic">{(stats?.todayRevenue || 0).toLocaleString()} <span className="text-[#C8A97E] text-2xl">đ</span></h2>
                    <div className="p-3 rounded-2xl bg-[#C8A97E]/10 border border-[#C8A97E]/20">
                       <TrendingUp className="w-5 h-5 text-[#C8A97E]" />
                    </div>
                 </div>
                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#C8A97E] to-amber-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(200,169,126,0.5)]"></div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-800 transition-colors hover:border-[#C8A97E]/40">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank/E-Wallet</p>
                    <p className="text-lg font-black italic mt-1 uppercase">70%</p>
                 </div>
                 <div className="p-6 rounded-3xl bg-slate-800/40 border border-slate-800 transition-colors hover:border-[#C8A97E]/40">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cash</p>
                    <p className="text-lg font-black italic mt-1 uppercase">30%</p>
                 </div>
              </div>

              <Button className="w-full bg-[#C8A97E] hover:bg-amber-600 text-white rounded-[1.5rem] h-14 font-black italic uppercase text-xs tracking-[0.2em] shadow-2xl shadow-[#C8A97E]/20" asChild>
                 <Link href="/cashier/revenue">View Detailed Report</Link>
              </Button>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
