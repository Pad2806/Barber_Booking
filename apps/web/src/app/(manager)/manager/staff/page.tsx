'use client';

import { useQuery } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  MoreVertical,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ManagerStaffPage(): JSX.Element {
  const { data: staff, isLoading } = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: () => managerApi.getStaff(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div className="h-10 w-64 bg-white rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-white rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl animate-pulse border border-[#E8E0D4]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#2C1E12] tracking-tight italic uppercase">
            Cửa hàng <span className="text-[#C8A97E]">Team</span>
          </h1>
          <p className="text-[#8B7355] font-medium">Quản lý và theo dõi hiệu suất nhân viên trong salon</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355] group-focus-within:text-[#C8A97E] transition-colors" />
            <Input 
              placeholder="Tìm tên nhân viên..." 
              className="pl-10 w-full md:w-64 border-[#E8E0D4] bg-white rounded-xl focus-visible:ring-[#C8A97E]/20"
            />
          </div>
          <Button variant="outline" className="border-[#E8E0D4] rounded-xl font-bold text-[#8B7355] h-11 px-5">
            <Filter className="w-4 h-4 mr-2" /> Lọc
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff?.map((member: any) => (
          <Card key={member.id} className="border-none shadow-sm bg-white overflow-hidden rounded-2xl group hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <CardContent className="p-0">
              {/* Header / Background */}
              <div className="h-24 bg-gradient-to-r from-[#FAF8F5] to-[#F0EBE3] relative">
                  <div className="absolute -bottom-6 left-6 p-1 bg-white rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-500">
                    <Avatar className="h-20 w-20 rounded-xl">
                        <AvatarImage src={member.user?.avatar} />
                        <AvatarFallback className="bg-[#C8A97E]/10 text-[#C8A97E] text-2xl font-black italic">
                            {member.user?.name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                  </div>
              </div>

              <div className="pt-10 px-6 pb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-[#2C1E12] italic group-hover:text-[#C8A97E] transition-colors">{member.user?.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-[#C8A97E]/10 text-[#C8A97E] border-none rounded-lg px-2.5 py-0.5 font-bold uppercase text-[10px]">
                            {member.position}
                        </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-[#8B7355] rounded-full hover:bg-[#FAF8F5]">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-[#E8E0D4]">
                      <DropdownMenuItem className="font-bold text-xs uppercase tracking-tight py-2.5 focus:bg-[#FAF8F5] focus:text-[#C8A97E]">
                        Xem chi tiết
                      </DropdownMenuItem>
                      <DropdownMenuItem className="font-bold text-xs uppercase tracking-tight py-2.5 focus:bg-[#FAF8F5] focus:text-[#C8A97E]">
                        Xếp ca làm việc
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4 mb-6 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#F0EBE3]">
                            <p className="text-[10px] font-bold text-[#8B7355] uppercase mb-1">Đánh giá</p>
                            <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                <span className="font-black text-[#2C1E12]">{member.rating.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#F0EBE3]">
                            <p className="text-[10px] font-bold text-[#8B7355] uppercase mb-1">Bookings</p>
                            <div className="flex items-center gap-1.5 text-[#C8A97E]">
                                <Calendar className="w-4 h-4" />
                                <span className="font-black text-[#2C1E12]">{member._count?.bookings || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2.5 text-[#8B7355] font-medium">
                            <Mail className="w-4 h-4 text-[#C8A97E]" />
                            <span className="truncate">{member.user?.email}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[#8B7355] font-medium">
                            <Phone className="w-4 h-4 text-[#C8A97E]" />
                            <span>{member.user?.phone}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#F0EBE3] flex gap-2">
                    <Button variant="outline" className="flex-1 border-[#E8E0D4] text-[#8B7355] font-black italic uppercase text-[10px] h-9 rounded-xl">
                        Xem Rank
                    </Button>
                    <Link href={`/manager/schedule?staff=${member.id}`} className="flex-1">
                        <Button className="w-full bg-[#C8A97E] hover:bg-[#B8975E] text-white font-black italic uppercase text-[10px] h-9 rounded-xl shadow-sm">
                            Xem Lịch
                        </Button>
                    </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
