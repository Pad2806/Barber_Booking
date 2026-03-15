'use client';

import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  DollarSign, 
  ArrowUpRight, 
  Scissors, 
  Trophy,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import dynamicImport from 'next/dynamic';
import React, { useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import dayjs from 'dayjs';

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

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function ManagerRevenuePage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  const { data: report, isLoading } = useQuery({
    queryKey: ['manager', 'revenue', period],
    queryFn: () => managerApi.getRevenueReport(period),
  });

  if (isLoading) {
    return (
      <div className="flex bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 items-center justify-center min-h-[600px] shadow-sm">
        <div className="flex flex-col items-center gap-4">
           <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Syncing Branch Finance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight text-left italic uppercase">Phân tích <span className="text-[#C8A97E]">Doanh thu</span></h1>
           <p className="text-slate-500 mt-1">Báo cáo tài chính và hiệu quả kinh doanh tại chi nhánh.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
           {['day', 'week', 'month'].map((p: any) => (
             <Button
               key={p}
               variant={period === p ? 'default' : 'ghost'}
               size="sm"
               onClick={() => setPeriod(p)}
               className={cn(
                 "px-4 h-8 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all",
                 period === p ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
               )}
             >
               {p === 'day' ? 'Hôm nay' : p === 'week' ? 'Tuần này' : 'Tháng này'}
             </Button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative group">
            <CardContent className="p-8">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-white/10 rounded-xl text-[#C8A97E]">
                     <DollarSign className="w-5 h-5" />
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-bold text-[10px]">
                     <ArrowUpRight className="w-3 h-3 mr-1" /> 18.5%
                  </Badge>
               </div>
               <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Tổng doanh thu ({period})</p>
               <h3 className="text-3xl font-black tracking-tight">{formatPrice(report?.totalRevenue || 0)}</h3>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <CardContent className="p-8">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                     <Scissors className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none font-bold text-[10px]">
                     STABLE
                  </Badge>
               </div>
               <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Trung bình dịch vụ</p>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {formatPrice(report?.totalRevenue / (period === 'day' ? 12 : 84))}
               </h3>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <CardContent className="p-8">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                     <Activity className="w-5 h-5" />
                  </div>
                  <Badge className="bg-[#C8A97E]/10 text-[#C8A97E] border-none font-bold text-[10px]">
                     <Trophy className="w-3 h-3 mr-1" /> TOP 2
                  </Badge>
               </div>
               <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Tỉ lệ quay lại</p>
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">92%</h3>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 text-left">
               <CardTitle className="text-lg font-bold">Biểu đồ tăng trưởng</CardTitle>
               <CardDescription>Xu hướng doanh thu theo thời gian</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
               <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={report?.trend || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#6b7280', fontSize: 10, fontWeight: 700}} 
                          tickFormatter={(val) => dayjs(val).format('DD/MM')} 
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10, fontWeight: 700}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="amount" radius={[4, 4, 4, 4]} fill="#0ea5e9" barSize={32}>
                           {report?.trend?.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={index === report.trend.length - 1 ? '#C8A97E' : '#e2e8f0'} />
                           ))}
                        </Bar>
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 text-left">
               <CardTitle className="text-lg font-bold">Cơ cấu doanh thu</CardTitle>
               <CardDescription>Phân bổ theo nhóm dịch vụ</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
               <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={report?.byService || []}
                           cx="50%"
                           cy="50%"
                           innerRadius={70}
                           outerRadius={100}
                           paddingAngle={5}
                           dataKey="revenue"
                           nameKey="service"
                        >
                           {report?.byService?.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} stroke="none" fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
                        <Legend verticalAlign="bottom" align="center" />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
         <CardHeader className="p-6 border-b bg-gray-50/50 text-left">
            <CardTitle className="text-lg font-bold">Hiệu suất đội ngũ</CardTitle>
            <CardDescription>Đóng góp doanh thu của từng kỹ thuật viên</CardDescription>
         </CardHeader>
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full">
                  <thead className="bg-slate-50/50">
                     <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wider">Kỹ thuật viên</th>
                        <th className="px-6 py-4 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wider">Số buổi</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold uppercase text-slate-400 tracking-wider">Doanh thu</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold uppercase text-slate-400 tracking-wider">Hiệu suất</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {report?.byBarber?.map((barber: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="relative">
                                    <Avatar className="h-10 w-10 border shadow-sm">
                                       <AvatarImage src={barber.avatar} />
                                       <AvatarFallback className="bg-slate-50 text-slate-400 font-bold">{barber.barber.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {idx === 0 && (
                                       <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-0.5 border-2 border-white shadow">
                                          <Trophy className="w-2.5 h-2.5" />
                                       </div>
                                    )}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-900 uppercase group-hover:text-[#C8A97E] transition-colors">{barber.barber}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">STYLIST</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="font-bold text-slate-900">{barber.count}</span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <p className="font-bold text-slate-900">{formatPrice(barber.revenue || 0)}</p>
                              <div className="flex items-center justify-end gap-1 text-emerald-500 text-[10px] font-bold">
                                 <ArrowUpRight className="w-3 h-3" />
                                 12%
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="w-24 ml-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-[#C8A97E]" 
                                   style={{ width: `${85 - idx * 8}%` }}
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
