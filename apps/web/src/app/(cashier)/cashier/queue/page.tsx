'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi } from '@/lib/api';
import { 
  ListOrdered, 
  Clock, 
  User, 
  Scissors, 
  PlayCircle, 
  CheckCircle2, 
  MoreHorizontal,
  XCircle,
  AlertCircle,
  Users,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import React from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function QueuePage() {
  const queryClient = useQueryClient();
  
  const { data: queue, isLoading } = useQuery({
    queryKey: ['cashier', 'queue'],
    queryFn: cashierApi.getQueue,
    refetchInterval: 10000, // Refresh every 10s
  });

  const { data: branchStaff } = useQuery({
    queryKey: ['cashier', 'staff-list'],
    queryFn: () => cashierApi.getAvailableBarbers(dayjs().format('YYYY-MM-DD'), dayjs().format('HH:mm')),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, staffId }: { id: string, status: string, staffId?: string }) => 
        cashierApi.updateQueueStatus(id, { status, staffId }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái hàng chờ');
      queryClient.invalidateQueries({ queryKey: ['cashier', 'queue'] });
      queryClient.invalidateQueries({ queryKey: ['cashier', 'stats'] });
    },
    onError: () => toast.error('Lỗi khi cập nhật trạng thái.')
  });

  if (isLoading) {
    return (
      <div className="flex bg-white rounded-[2rem] border border-slate-100 items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Syncing Queue...</p>
        </div>
      </div>
    );
  }

  const waitingList = queue?.filter((item: any) => item.status === 'WAITING') || [];
  const servingList = queue?.filter((item: any) => item.status === 'SERVING') || [];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Waiting <span className="text-[#C8A97E]">Queue</span>
           </h1>
           <p className="text-slate-500 font-medium font-serif italic text-sm">Điều phối khách vãng lai và gán nhân sự trực tiếp.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-8">
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Đang chờ</p>
              <p className="text-xl font-black text-amber-500 italic">{waitingList.length}</p>
           </div>
           <div className="w-px h-8 bg-slate-100"></div>
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Đang phục vụ</p>
              <p className="text-xl font-black text-emerald-500 italic">{servingList.length}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Waiting Column */}
         <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
               <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                  <Timer className="w-4 h-4" />
               </div>
               <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Next in Line</h3>
            </div>

            <div className="space-y-4">
               {waitingList.length === 0 ? (
                 <div className="bg-white rounded-[2rem] p-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-100">
                    <p className="text-slate-300 font-black italic uppercase text-xs">No one waiting</p>
                 </div>
               ) : (
                 waitingList.map((item: any, idx: number) => (
                   <Card key={item.id} className="group border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white overflow-hidden">
                      <CardContent className="p-6">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-black italic shadow-inner">
                                  #{idx + 1}
                               </div>
                               <div>
                                  <h4 className="font-black text-slate-900 uppercase tracking-tighter italic leading-tight">{item.customerName}</h4>
                                  <p className="text-[10px] font-black text-[#C8A97E] uppercase tracking-widest mt-0.5">{item.service?.name || 'Standard Service'}</p>
                               </div>
                            </div>

                            <div className="flex items-center gap-2">
                               <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                     <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-100 bg-slate-50 font-black italic uppercase text-[10px] tracking-widest hover:bg-[#C8A97E] hover:text-white transition-all">
                                        Assign & Start
                                     </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 border-slate-100 shadow-2xl">
                                     <DropdownMenuLabel className="text-[9px] font-black uppercase text-slate-400 p-3 italic">Available Barbers</DropdownMenuLabel>
                                     <DropdownMenuSeparator />
                                     {branchStaff?.map((s: any) => (
                                        <DropdownMenuItem 
                                          key={s.id} 
                                          disabled={!s.isAvailable}
                                          onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'SERVING', staffId: s.id })}
                                          className="rounded-xl p-3 mb-1 cursor-pointer flex items-center justify-between group"
                                        >
                                           <div className="flex items-center gap-3">
                                              <Avatar className="h-8 w-8">
                                                 <AvatarImage src={s.avatar} />
                                                 <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <span className="font-bold text-xs">{s.name}</span>
                                           </div>
                                           {!s.isAvailable ? (
                                             <Badge className="bg-rose-50 text-rose-500 border-none text-[8px] font-black">{s.reason}</Badge>
                                           ) : (
                                             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                           )}
                                        </DropdownMenuItem>
                                     ))}
                                  </DropdownMenuContent>
                               </DropdownMenu>
                               
                               <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50">
                                  <XCircle className="w-5 h-5" />
                                </Button>
                            </div>
                         </div>
                         
                         <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400">
                               <Clock className="w-3.5 h-3.5" />
                               <span className="text-[10px] font-black uppercase tracking-widest italic">Waited: {dayjs().diff(dayjs(item.arrivalTime), 'minute')}m</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <p className="text-[10px] font-black text-slate-300 uppercase italic">Preferred:</p>
                               <span className="text-[10px] font-black text-slate-900 uppercase italic">{item.staff?.name || 'Anyone'}</span>
                            </div>
                         </div>
                      </CardContent>
                   </Card>
                 ))
               )}
            </div>
         </div>

         {/* Serving Column */}
         <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
               <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                  <PlayCircle className="w-4 h-4" />
               </div>
               <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Currently Serving</h3>
            </div>

            <div className="space-y-4">
               {servingList.length === 0 ? (
                 <div className="bg-white rounded-[2rem] p-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-100">
                    <p className="text-slate-300 font-black italic uppercase text-xs">No active sessions</p>
                 </div>
               ) : (
                 servingList.map((item: any) => (
                   <Card key={item.id} className="group border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 h-full w-2 bg-emerald-500 opacity-50"></div>
                      <CardContent className="p-6">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="relative">
                                  <Avatar className="h-14 w-14 border-4 border-slate-50 shadow-lg ring-2 ring-emerald-100">
                                     <AvatarImage src={item.staff?.user?.avatar} />
                                     <AvatarFallback className="bg-slate-900 text-white font-black italic text-lg">{item.staff?.user?.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-lg border-2 border-white">
                                     <CheckCircle2 className="w-2.5 h-2.5" />
                                  </div>
                               </div>
                               <div>
                                  <h4 className="font-black text-slate-900 uppercase tracking-tighter italic leading-tight">{item.customerName}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     <Scissors className="w-3 h-3 text-[#C8A97E]" />
                                     <span className="text-[10px] font-black text-[#C8A97E] uppercase tracking-widest">{item.service?.name}</span>
                                  </div>
                               </div>
                            </div>

                            <div className="text-right">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Served By</p>
                               <p className="text-xs font-black text-slate-900 uppercase italic tracking-tight">{item.staff?.name}</p>
                            </div>
                         </div>

                         <div className="mt-6 flex items-center gap-3">
                            <Button 
                              onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'COMPLETED' })}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 font-black italic uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/10"
                            >
                               Mark Completed
                            </Button>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500">
                               <AlertCircle className="w-5 h-5" />
                            </Button>
                         </div>
                      </CardContent>
                   </Card>
                 ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
