'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import {
  Search,
  Filter,
  Star,
  Calendar,
  MoreVertical,
  Mail,
  Phone,
  Trophy,
  Activity,
  Award,
  ChevronRight,
  Plus,
  Smartphone,
  Scissors,
  Clock,
  Loader2,
  Edit,
  Trash2,
  UserX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import Link from 'next/link';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { STAFF_POSITIONS } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import ImageUpload from '@/components/ImageUpload';

export default function ManagerStaffPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  
  // Staff form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    position: 'STYLIST',
    password: '',
    isActive: true,
  });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Rating state
  const [ratingData, setRatingData] = useState({
    serviceQuality: 5,
    punctuality: 5,
    customerSatisfaction: 5,
    comment: ''
  });

  const { data: staff, isLoading } = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: managerApi.getStaff,
  });

  const rateMutation = useMutation({
    mutationFn: (data: any) => managerApi.rateStaff(selectedStaff.id, data),
    onSuccess: () => {
      toast.success('Đã lưu đánh giá hiệu suất');
      setIsRateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] });
    },
    onError: () => {
      toast.error('Không thể lưu đánh giá');
    }
  });

  const handleRateSubmit = () => {
    rateMutation.mutate(ratingData);
  };

  const createStaffMutation = useMutation({
    mutationFn: (data: any) => managerApi.createStaff(data),
    onSuccess: () => {
      toast.success('Đã thêm nhân viên mới');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] });
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể thêm nhân viên');
    }
  });

  const updateStaffMutation = useMutation({
    mutationFn: (data: any) => managerApi.updateStaff(selectedStaff.id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật');
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => managerApi.deleteStaff(id),
    onSuccess: () => {
      toast.success('Đã xóa nhân viên');
      setIsDeleteConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa nhân viên');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      avatar: '',
      position: 'STYLIST',
      password: '',
      isActive: true,
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'create') {
      createStaffMutation.mutate(formData);
    } else {
      updateStaffMutation.mutate(formData);
    }
  };

  const filteredStaff = staff?.filter((s: any) =>
    (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (s.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 items-center justify-center min-h-[600px] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-[#C8A97E] border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
              Branch <span className="text-[#C8A97E]">Squad</span>
           </h1>
           <p className="text-slate-500 font-medium">Quản lý hiệu năng và điều phối đội ngũ nhân sự.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C8A97E] transition-colors" />
            <Input
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full md:w-80 border-slate-100 bg-white rounded-2xl focus-visible:ring-[#C8A97E]/20 h-12 shadow-sm font-medium"
            />
          </div>
          <Button variant="outline" className="border-slate-100 bg-white rounded-2xl font-bold text-slate-600 h-12 px-6 shadow-sm hover:bg-slate-50">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button 
            onClick={() => {
              setFormMode('create');
              resetForm();
              setIsFormOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black italic uppercase text-xs h-12 px-6 shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm nhân sự
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredStaff?.map((member: any) => (
          <Card key={member.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white overflow-hidden flex flex-col">
            <CardHeader className="p-8 pb-0">
               <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                     <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-xl">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-slate-100 text-slate-400 font-black italic">{member.name?.charAt(0) || 'S'}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white",
                          member.status === 'WORKING' ? "bg-emerald-500" : "bg-slate-300"
                        )}></div>
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 italic tracking-tight">{member.name}</h3>
                        <Badge className="bg-slate-900 text-white border-none rounded-lg px-2.5 py-0.5 font-black uppercase text-[9px] tracking-widest mt-1">
                          {member.role}
                        </Badge>
                     </div>
                  </div>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 rounded-full hover:bg-slate-50">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-50 shadow-2xl">
                         <DropdownMenuItem 
                           className="rounded-xl h-10 px-3 font-bold text-xs uppercase cursor-pointer"
                           onClick={() => {
                             setSelectedStaff(member);
                             setFormMode('edit');
                             setFormData({
                               name: member.name,
                               email: member.user.email,
                               phone: member.user.phone,
                               avatar: member.avatar,
                               position: member.role,
                               password: '',
                               isActive: member.isActive !== false,
                             });
                             setIsFormOpen(true);
                           }}
                         >
                            <Edit className="w-4 h-4 mr-3" /> Chỉnh sửa hồ sơ
                         </DropdownMenuItem>
                         <DropdownMenuItem 
                           className="rounded-xl h-10 px-3 font-bold text-xs uppercase cursor-pointer"
                           onClick={() => {
                             setSelectedStaff(member);
                             setIsRateModalOpen(true);
                           }}
                         >
                            <Award className="w-4 h-4 mr-3" /> Đánh giá hiệu suất
                         </DropdownMenuItem>
                         <DropdownMenuSeparator className="bg-slate-50 my-1" />
                         <DropdownMenuItem 
                           className="rounded-xl h-10 px-3 font-bold text-xs uppercase text-rose-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                           onClick={() => {
                             setSelectedStaff(member);
                             setIsDeleteConfirmOpen(true);
                           }}
                         >
                            <Trash2 className="w-4 h-4 mr-3" /> Xóa nhân viên
                         </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </CardHeader>

            <CardContent className="p-8 flex-1 flex flex-col justify-between">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-white shadow-inner">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Star</p>
                     <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-black text-slate-900 text-lg">{member.rating.toFixed(1)}</span>
                     </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-white shadow-inner">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Appointments</p>
                     <div className="flex items-center gap-1.5 text-[#C8A97E]">
                        <Calendar className="w-4 h-4" />
                        <span className="font-black text-slate-900 text-lg tracking-tighter">{member.todayAppointments}</span>
                     </div>
                  </div>
               </div>

               <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                  {member.status === 'WORKING' ? (
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Đang làm việc</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nghỉ ca</span>
                    </div>
                  )}
                  <Button variant="ghost" className="text-[#C8A97E] font-black italic uppercase text-[10px] tracking-widest h-9 group/btn" asChild>
                     <Link href={`/manager/staff/${member.id}`}>
                        Chi tiết <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                     </Link>
                  </Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rate Performance Modal */}
      <Dialog open={isRateModalOpen} onOpenChange={setIsRateModalOpen}>
         <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 pb-0">
               <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                  Đánh giá nhân viên: <span className="text-[#C8A97E]">{selectedStaff?.name}</span>
               </DialogTitle>
               <DialogDescription className="font-medium text-slate-500">
                  Phản hồi chất lượng phục vụ và thái độ làm việc hàng tháng.
               </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-6">
               <div className="space-y-4">
                  {[
                    { key: 'serviceQuality', label: 'Chất lượng phục vụ', icon: Scissors },
                    { key: 'punctuality', label: 'Đúng giờ & Chuyên nghiệp', icon: Clock },
                    { key: 'customerSatisfaction', label: 'Mức độ hài lòng của khách', icon: Star }
                  ].map((metric) => (
                    <div key={metric.key} className="space-y-3">
                       <div className="flex justify-between items-center">
                          <Label className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-2">
                             <metric.icon className="w-4 h-4 text-[#C8A97E]" />
                             {metric.label}
                          </Label>
                          <span className="text-lg font-black text-[#C8A97E]">{(ratingData as any)[metric.key]}/5</span>
                       </div>
                       <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <button
                              key={i}
                              onClick={() => setRatingData({ ...ratingData, [metric.key]: i })}
                              className={cn(
                                "flex-1 h-2 rounded-full transition-all",
                                (ratingData as any)[metric.key] >= i ? "bg-[#C8A97E]" : "bg-slate-100"
                              )}
                            ></button>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>

               <div className="space-y-3">
                  <Label className="font-bold text-xs uppercase tracking-wider text-slate-600">Ghi chú chi tiết</Label>
                  <Textarea 
                    placeholder="Nhập nhận xét về thái độ, kỹ năng hoặc các lưu ý khác..."
                    value={ratingData.comment}
                    onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                    className="min-h-[100px] rounded-2xl bg-slate-50 border-none focus-visible:ring-[#C8A97E]/20 font-medium placeholder:text-slate-300"
                  />
               </div>
            </div>

            <DialogFooter className="p-8 pt-0 flex gap-3">
               <Button variant="ghost" onClick={() => setIsRateModalOpen(false)} className="flex-1 rounded-2xl font-bold uppercase text-xs">Hủy</Button>
               <Button 
                onClick={handleRateSubmit}
                disabled={rateMutation.isPending}
                className="flex-1 bg-[#C8A97E] hover:bg-[#B8975E] text-white rounded-2xl font-black italic uppercase text-xs shadow-lg shadow-[#C8A97E]/20 h-12"
               >
                  {rateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Award className="w-4 h-4 mr-2" />}
                  Lưu đánh giá
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Staff Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-none bg-white overflow-y-auto no-scrollbar">
          <SheetHeader className="p-10 pb-0">
            <SheetTitle className="text-3xl font-black italic uppercase tracking-tighter">
              {formMode === 'create' ? 'Thêm' : 'Cập nhật'} <span className="text-[#C8A97E]">Nhân sự</span>
            </SheetTitle>
            <SheetDescription className="font-medium text-slate-500">
               {formMode === 'create' 
                 ? 'Tạo tài khoản mới cho nhân viên tại chi nhánh của bạn.'
                 : `Thay đổi thông tin hồ sơ cho ${selectedStaff?.name}.`}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="p-10 space-y-8 pb-32">
            <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-white shadow-inner">
               <ImageUpload 
                 value={formData.avatar}
                 onChange={(url) => setFormData({ ...formData, avatar: url })}
                 folder="avatars"
               />
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ảnh đại diện nhân viên</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Họ và tên</Label>
                <Input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên đầy đủ"
                  className="h-14 border-slate-100 bg-white rounded-2xl font-bold shadow-sm focus-visible:ring-[#C8A97E]/20 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email liên hệ</Label>
                  <Input 
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@gmail.com"
                    className="h-14 border-slate-100 bg-white rounded-2xl font-bold shadow-sm focus-visible:ring-[#C8A97E]/20 text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số điện thoại</Label>
                  <Input 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09xx xxx xxx"
                    className="h-14 border-slate-100 bg-white rounded-2xl font-bold shadow-sm focus-visible:ring-[#C8A97E]/20 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mật khẩu {formMode === 'edit' && '(Bỏ trống nếu không đổi)'}</Label>
                <Input 
                  type="password"
                  required={formMode === 'create'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="********"
                  className="h-14 border-slate-100 bg-white rounded-2xl font-bold shadow-sm focus-visible:ring-[#C8A97E]/20 text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vị trí công việc</Label>
                <Select 
                  value={formData.position} 
                  onValueChange={(val) => setFormData({ ...formData, position: val })}
                >
                  <SelectTrigger className="h-14 border-slate-100 bg-white rounded-2xl font-bold shadow-sm focus:ring-[#C8A97E]/20 text-slate-900">
                    <SelectValue placeholder="Chọn vị trí" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100">
                    {Object.entries(STAFF_POSITIONS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="font-bold rounded-xl">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="fixed bottom-0 right-0 left-0 sm:left-auto sm:w-[576px] bg-white p-8 border-t border-slate-100 flex gap-4 z-50">
               <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsFormOpen(false)} 
                className="flex-1 h-14 rounded-2xl font-bold uppercase text-xs"
               >
                 Hủy
               </Button>
               <Button 
                type="submit"
                disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-black italic uppercase text-xs shadow-xl transition-all active:scale-95"
               >
                 {createStaffMutation.isPending || updateStaffMutation.isPending ? (
                   <Loader2 className="w-5 h-5 animate-spin mr-2" />
                 ) : (
                   <Plus className="w-5 h-5 mr-2 text-[#C8A97E]" />
                 )}
                 {formMode === 'create' ? 'Xác nhận thêm' : 'Lưu cập nhật'}
               </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6 text-rose-500">
              <UserX className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-500 font-medium">Bạn đang thực hiện xóa nhân viên <span className="text-rose-500 font-bold">{selectedStaff?.name}</span>. Hành động này không thể hoàn tác.</p>
            
            <div className="flex gap-4 w-full mt-10">
              <Button 
                variant="ghost" 
                onClick={() => setIsDeleteConfirmOpen(false)} 
                className="flex-1 h-12 rounded-2xl font-bold uppercase text-xs"
              >
                Hủy quay lại
              </Button>
              <Button 
                onClick={() => deleteStaffMutation.mutate(selectedStaff.id)}
                disabled={deleteStaffMutation.isPending}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white h-12 rounded-2xl font-black italic uppercase text-xs shadow-lg shadow-rose-500/20"
              >
                {deleteStaffMutation.isPending ? 'Working...' : 'Xác nhận xóa'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
