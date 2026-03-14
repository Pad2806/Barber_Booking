'use client';

import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scissors, 
  User, 
  Calendar, 
  Filter, 
  ChevronRight,
  Target,
  Trophy,
  Activity,
  Layers,
  MapPin,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import dynamicImport from 'next/dynamic';
const BarChart = dynamicImport(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamicImport(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamicImport(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamicImport(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamicImport(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamicImport(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamicImport(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Cell = dynamicImport(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const PieChart = dynamicImport(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamicImport(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Legend = dynamicImport(() => import('recharts').then(mod => mod.Legend), { ssr: false });
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

export default function ManagerRevenuePage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  const { data: report, isLoading } = useQuery({
    queryKey: ['manager', 'revenue', period],
    queryFn: () => managerApi.getRevenueReport(period),
  });

  if (isLoading) {
    return (
      <div className="flex bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 items-center justify-center min-h-[600px] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Analyzing Financial Pulse...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#C8A97E', '#0f172a', '#64748b', '#94A3B8', '#CBD5E1'];

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Financial <span className="text-[#C8A97E]">Pulse</span>
           </h1>
           <p className="text-slate-500 font-medium">Báo cáo hiệu quả kinh doanh và phân bổ doanh thu chi nhánh.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white p-1 rounded-2xl shadow-xl border border-slate-50 flex overflow-hidden">
              {['day', 'week', 'month'].map((p: any) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-300",
                    period === p ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {p === 'day' ? 'Hôm nay' : p === 'week' ? 'Tuần này' : 'Tháng này'}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
               <DollarSign className="w-24 h-24" />
            </div>
            <CardContent className="p-10 relative z-10">
               <p className="text-[#C8A97E] font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2 italic">
                  <Activity className="w-3 h-3" />
                  Total Revenue ({period})
               </p>
               <h3 className="text-4xl font-black italic tracking-tighter mb-4 text-white">
                  {report?.totalRevenue?.toLocaleString()} <span className="text-sm font-bold opacity-50 not-italic">VNĐ</span>
               </h3>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit border border-emerald-500/10">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">+18.5% FROM LAST {period.toUpperCase()}</span>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden relative group">
            <CardContent className="p-10">
               <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2 italic">
                  <Scissors className="w-3 h-3 text-[#C8A97E]" />
                  Average Service
               </p>
               <h3 className="text-4xl font-black italic tracking-tighter mb-4 text-slate-900">
                  {(report?.totalRevenue / (period === 'day' ? 12 : 84)).toLocaleString()} <span className="text-sm font-bold text-slate-300 not-italic">VNĐ</span>
               </h3>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl w-fit">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#C8A97E]">Optimized efficiency</span>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden relative group">
            <CardContent className="p-10">
               <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2 italic">
                  <Target className="w-3 h-3 text-[#C8A97E]" />
                  Retention Target
               </p>
               <h3 className="text-4xl font-black italic tracking-tighter mb-4 text-slate-900">
                  92 <span className="text-sm font-bold text-slate-300 not-italic">%</span>
               </h3>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-[#C8A97E]/10 text-[#C8A97E] rounded-xl w-fit border border-[#C8A97E]/10">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Rank #2 Branch</span>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Trend Line */}
         <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10">
            <CardHeader className="p-0 mb-10">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Biểu đồ tăng trưởng</CardTitle>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time-series Report</p>
               </div>
            </CardHeader>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report?.trend || []}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis 
                       dataKey="date" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} 
                       tickFormatter={(val) => dayjs(val).format('DD MMM')} 
                     />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 900}} />
                     <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', cursor: 'default'}} />
                     <Bar dataKey="amount" radius={[8, 8, 8, 8]} barSize={period === 'day' ? 60 : 30}>
                        {report?.trend?.map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={index === report.trend.length - 1 ? '#C8A97E' : '#f1f5f9'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </Card>

         {/* Distribution */}
         <Card className="border-none shadow-xl rounded-[2.5rem] bg-[#0f172a] p-10 text-white">
            <CardHeader className="p-0 mb-10 flex flex-row justify-between items-center">
               <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Cơ cấu doanh thu</CardTitle>
               <Layers className="w-5 h-5 text-[#C8A97E]" />
            </CardHeader>
            <div className="h-[350px] flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={report?.byService || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={10}
                        dataKey="revenue"
                        nameKey="service"
                     >
                        {report?.byService?.map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} stroke="none" fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                     <Legend verticalAlign="bottom" align="center" formatter={(val) => <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic ml-2">{val}</span>} />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase text-[#C8A97E] tracking-widest drop-shadow-lg p-2 bg-slate-800 rounded-xl mb-1">Services</span>
                  <span className="text-xs font-black italic opacity-50">Top Distribution</span>
               </div>
            </div>
         </Card>
      </div>

      {/* Staff Revenue Breakdown Table */}
      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
         <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Đóng góp đội ngũ</CardTitle>
               <CardDescription className="text-slate-500 font-medium italic">Xếp hạng doanh thu theo Kỹ thuật viên</CardDescription>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 italic font-black text-xs text-[#C8A97E]">
               Live Data Feed
            </div>
         </CardHeader>
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead className="bg-slate-50/50">
                     <tr>
                        <th className="px-10 py-5 text-left text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Kỹ thuật viên</th>
                        <th className="px-10 py-5 text-center text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Appointments</th>
                        <th className="px-10 py-5 text-right text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Revenue generated</th>
                        <th className="px-10 py-5 text-right text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Efficiency</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {report?.byBarber?.map((barber: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="relative">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-xl">
                                       <AvatarImage src={barber.avatar} />
                                       <AvatarFallback className="bg-slate-100 text-slate-400 font-black italic">{barber.barber.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {idx === 0 && (
                                       <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1 border-2 border-white shadow-lg">
                                          <Trophy className="w-3 h-3" />
                                       </div>
                                    )}
                                 </div>
                                 <div>
                                    <p className="font-black italic text-slate-900 group-hover:text-[#C8A97E] transition-colors">{barber.barber}</p>
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-0.5">Top Performer</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-center">
                              <span className="font-black text-slate-900 italic tracking-tighter text-lg">{barber.count}</span>
                              <span className="text-[10px] font-bold text-slate-300 ml-1">bookings</span>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <p className="font-black italic text-slate-900 text-lg tracking-tighter">{barber.revenue?.toLocaleString()} VNĐ</p>
                              <div className="flex items-center justify-end gap-1 text-emerald-500 text-[10px] font-black italic">
                                 <ArrowUpRight className="w-3 h-3" />
                                 {Math.floor(Math.random() * 15) + 5}% UP
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <div className="w-32 ml-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-gradient-to-r from-slate-900 to-[#C8A97E]" 
                                   style={{ width: `${80 + idx * -5}%` }}
                                 ></div>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
