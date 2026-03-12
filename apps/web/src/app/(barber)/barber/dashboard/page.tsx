'use client';

import { useQuery } from '@tanstack/react-query';
import { staffApi, usersApi } from '@/lib/api';
import { 
  Clock, 
  Calendar, 
  Star, 
  TrendingUp, 
  ChevronRight,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

export default function BarberDashboard() {
  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
  });

  const { data: myShifts, isLoading } = useQuery({
    queryKey: ['staff', 'my-schedules'],
    queryFn: () => staffApi.getSchedules(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-white rounded-3xl animate-pulse" />
            <div className="h-64 bg-white rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const stats = [
    { label: 'Rating', value: me?.staff?.rating || '5.0', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Review', value: me?.staff?.totalReviews || '0', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Booking tuần này', value: '12', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-[#0f172a] rounded-[2rem] p-8 md:p-12 text-white border border-white/5">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-[#C8A97E]/30 p-1">
                    <AvatarImage src={me?.avatar} />
                    <AvatarFallback className="bg-slate-800 text-[#C8A97E] text-3xl font-black italic">
                        {me?.name?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black italic tracking-tight mb-2">
                        CHÀO BUỔI SÁNG, <span className="text-[#C8A97E] uppercase">{me?.name?.split(' ').pop()}!</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-slate-400 font-bold text-sm">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#C8A97E]" />
                            {me?.staff?.salon?.name || 'Reetro Salon'}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 uppercase tracking-widest text-[10px]">
                            {me?.staff?.position || 'Barber'}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl mb-2`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <p className="text-lg font-black italic">{stat.value}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8A97E] opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 opacity-5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Schedule Table */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-[#FAF8F5] border-b border-[#F0EBE3] p-6">
            <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black text-[#2C1E12] italic uppercase tracking-tight flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#C8A97E]" />
                    Lịch làm việc tuần này
                </CardTitle>
                <Link href="/barber/schedule">
                    <Button variant="ghost" size="sm" className="text-[#C8A97E] font-bold text-xs uppercase hover:bg-[#C8A97E]/10">
                        Toàn bộ lịch <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#F0EBE3]">
              {weekDays.map((day) => {
                const dayShifts = myShifts?.filter(s => isSameDay(new Date(s.date), day)) || [];
                const isToday = isSameDay(day, today);

                return (
                  <div key={day.toString()} className={cn(
                    "p-6 flex items-center justify-between transition-colors",
                    isToday ? "bg-[#C8A97E]/5" : "hover:bg-[#FAF8F5]"
                  )}>
                    <div className="flex items-center gap-6">
                        <div className="text-center w-12">
                            <p className="text-[10px] font-black uppercase text-[#8B7355] mb-1">
                                {format(day, 'EEE', { locale: vi })}
                            </p>
                            <p className={cn(
                                "text-2xl font-black italic leading-none",
                                isToday ? "text-[#C8A97E]" : "text-[#2C1E12]"
                            )}>
                                {format(day, 'dd')}
                            </p>
                        </div>
                        <div className="h-10 w-px bg-[#E8E0D4]" />
                        <div className="flex flex-wrap gap-2">
                           {dayShifts.length > 0 ? (
                               dayShifts.map(s => {
                                   const start = format(new Date(s.shiftStart), 'HH:mm');
                                   const end = format(new Date(s.shiftEnd), 'HH:mm');
                                   return (
                                       <div key={s.id} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E0D4] rounded-xl shadow-sm">
                                          <div className="w-2 h-2 rounded-full bg-[#C8A97E]" />
                                          <span className="text-xs font-black text-[#2C1E12]">{start} – {end}</span>
                                       </div>
                                   );
                               })
                           ) : (
                               <span className="text-xs font-bold text-[#8B7355] italic uppercase tracking-widest opacity-40">Nghỉ ca (Off)</span>
                           )}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Today's Bookings */}
        <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-6 border-b-4 border-b-[#C8A97E]">
                <h3 className="text-lg font-black text-[#2C1E12] italic uppercase mb-4">Thao tác nhanh</h3>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex flex-col gap-2 rounded-2xl border-[#E8E0D4] text-[#8B7355] hover:border-[#C8A97E] hover:text-[#C8A97E] group">
                        <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-tight">Booking mới</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col gap-2 rounded-2xl border-[#E8E0D4] text-[#8B7355] hover:border-[#C8A97E] hover:text-[#C8A97E] group">
                        <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-tight">My Profile</span>
                    </Button>
                </div>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden shadow-lg shadow-blue-500/5">
                <CardHeader className="p-6 pb-2">
                    <CardTitle className="text-lg font-black text-[#2C1E12] italic uppercase tracking-tight">Today's Focus</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                    <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#F0EBE3]">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Ca làm việc gần nhất</p>
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <span className="font-black text-[#2C1E12]">12:00 – 21:00</span>
                        </div>
                    </div>
                    <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#F0EBE3]">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Số lượng khách tối nay</p>
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-indigo-500" />
                            <span className="font-black text-[#2C1E12]">5 Khách hàng</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

// Minimal Users/Booking placeholders
function Users({ className }: { className?: string }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
