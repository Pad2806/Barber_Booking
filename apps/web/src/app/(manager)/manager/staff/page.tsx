'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  Users,
  Loader2,
  Search,
} from 'lucide-react';
import { STAFF_POSITIONS } from '@/lib/utils';
import { managerApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/admin/error-state';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import ImageUpload from '@/components/ImageUpload';

const STATUS_CONFIG: any = {
  true: { label: 'Đang hoạt động', variant: 'success' },
  false: { label: 'Tạm nghỉ', variant: 'destructive' },
};

export default function ManagerStaffPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Sheet states
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    position: 'STYLIST',
    password: '',
    isActive: true,
  });

  const { data: staff, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: managerApi.getStaff,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => managerApi.deleteStaff(id),
    onSuccess: () => {
      toast.success('Đã xóa nhân viên');
      queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa nhân viên');
    },
  });

  const createMutation = useMutation({
    mutationFn: (creationData: any) => managerApi.createStaff(creationData),
    onSuccess: () => {
      toast.success('Thêm nhân viên thành công');
      setPanelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể thêm nhân viên');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: any }) => managerApi.updateStaff(id, updateData),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      setPanelOpen(false);
      queryClient.invalidateQueries({ queryKey: ['manager', 'staff'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật nhân viên');
    },
  });

  useEffect(() => {
    if (panelMode === 'create') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        avatar: '',
        position: 'STYLIST',
        password: '',
        isActive: true,
      });
    } else if (selectedStaffId && (panelMode === 'edit' || panelMode === 'view')) {
      const member = staff?.find((s: any) => s.id === selectedStaffId);
      if (member) {
        setFormData({
          name: member.name || '',
          email: member.user?.email || '',
          phone: member.user?.phone || '',
          avatar: member.avatar || '',
          position: member.role || 'STYLIST',
          password: '',
          isActive: member.isActive !== false,
        });
      }
    }
  }, [panelMode, selectedStaffId, staff]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (panelMode === 'create') {
      createMutation.mutate(formData);
    } else if (panelMode === 'edit' && selectedStaffId) {
      updateMutation.mutate({ id: selectedStaffId, updateData: formData });
    }
  };

  const filteredData = useMemo(() => {
    if (!staff) return [];
    return staff.filter((s: any) => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nhân viên',
      cell: ({ row }) => {
        const member = row.original;
        const user = member.user;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-slate-200">
              <AvatarImage src={member.avatar || ''} alt={member.name} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold font-heading italic">
                {member.name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-slate-900 line-clamp-1">{member.name}</span>
              <span className="text-xs text-slate-500 line-clamp-1">{user?.email || user?.phone}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Vị trí',
      cell: ({ row }) => {
        const pos = row.getValue('role') as string;
        return (
          <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-700 border-none whitespace-nowrap">
            {STAFF_POSITIONS[pos as keyof typeof STAFF_POSITIONS] || pos}
          </Badge>
        );
      },
    },
    {
      id: 'stats',
      header: 'Thống kê',
      cell: ({ row }) => {
        const rating = row.original.rating || 0;
        const bookings = row.original.todayAppointments || 0;
        return (
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
              <Star className="w-3 h-3 fill-amber-500" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">{bookings}</span> lịch hôm nay
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <StatusBadge status={String(row.original.isActive !== false)} config={STATUS_CONFIG} />
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const member = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full transition-colors">
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-1 shadow-xl border-slate-200">
              <DropdownMenuItem 
                onClick={() => router.push(`/manager/staff/${member.id}`)}
                className="rounded-md focus:bg-slate-50 cursor-pointer flex items-center"
              >
                <Eye className="w-4 h-4 mr-2 text-slate-400" /> Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => { setSelectedStaffId(member.id); setPanelMode('edit'); setPanelOpen(true); }}
                className="rounded-md focus:bg-slate-50 cursor-pointer flex items-center"
              >
                <Edit className="w-4 h-4 mr-2 text-slate-400" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:bg-destructive/5 focus:text-destructive rounded-md cursor-pointer flex items-center"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa nhân viên ${member.name}?`)) {
                    deleteMutation.mutate(member.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa nhân viên
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [deleteMutation, router]);

  if (isError) {
    return (
      <Card className="m-8 border-none shadow-premium">
        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
          <ErrorState 
            message={(error as any)?.response?.data?.message || 'Không thể tải danh sách nhân viên'} 
            onRetry={() => refetch()} 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic uppercase">BRANCH <span className="text-[#C8A97E]">SQUAD</span></h1>
          <p className="text-slate-500 mt-1">Quản lý đội ngũ nhân sự và theo dõi hiệu suất tại chi nhánh.</p>
        </div>
        <Button onClick={() => { setPanelMode('create'); setSelectedStaffId(null); setPanelOpen(true); }} className="gap-2 shadow-sm rounded-xl px-6 bg-slate-900 hover:bg-slate-800 text-white">
          <Plus className="w-4 h-4" /> Thêm nhân viên
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#C8A97E]/5 border-none shadow-none ring-1 ring-[#C8A97E]/10 transition-all hover:ring-[#C8A97E]/20">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-[#C8A97E]/10 rounded-2xl text-[#C8A97E] shadow-inner">
               <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng nhân sự</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{staff?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-none shadow-none ring-1 ring-amber-200/50 transition-all hover:ring-amber-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-amber-100 rounded-2xl text-amber-600 shadow-inner">
               <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Stylist nổi bật</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {staff?.filter((s: any) => s.rating >= 4.5).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-none shadow-none ring-1 ring-emerald-200/50 transition-all hover:ring-emerald-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
               <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Đang hoạt động</p>
              <p className="text-3xl font-bold text-slate-900 tracking-tight">
                {staff?.filter((s: any) => s.isActive !== false).length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-premium bg-white/50 backdrop-blur-sm">
        <CardHeader className="px-6 flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-100 text-left">
          <CardTitle className="text-xl font-bold text-slate-800">Danh sách nhân sự</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C8A97E] transition-colors" />
              <input
                type="text"
                placeholder="Tìm nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-4 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A97E]/20 transition-all w-64 font-medium"
              />
            </div>
            <Badge variant="outline" className="h-9 px-3 border-slate-200 bg-white font-medium text-slate-600 hidden lg:flex">
              {filteredData.length} nhân viên
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 py-6">
          <DataTable
            columns={columns}
            data={filteredData}
            searchKey="name"
            loading={isLoading}
          />
        </CardContent>
      </Card>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent className="sm:max-w-2xl flex flex-col h-full p-0 border-none shadow-premium bg-white">
          <SheetHeader className="px-8 py-6 border-b border-slate-100 text-left shrink-0">
            <SheetTitle className="text-2xl font-bold font-heading italic text-[#C8A97E] flex items-center gap-3">
              <div className="p-2 bg-[#C8A97E]/10 rounded-lg text-[#C8A97E]">
                {panelMode === 'create' ? <Plus className="w-5 h-5" /> : panelMode === 'edit' ? <Edit className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
              {panelMode === 'create' ? 'Thêm nhân viên' : panelMode === 'edit' ? 'Chỉnh sửa nhân viên' : 'Thông tin nhân viên'}
            </SheetTitle>
            <SheetDescription className="text-slate-500 mt-1">
              {panelMode === 'create' ? 'Tạo hồ sơ nhân sự mới và thiết lập quyền truy cập cho hệ thống.' : 'Xem hoặc cập nhật thông tin chi tiết và quyền hạn của nhân viên.'}
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar">
            <form id="staff-form" onSubmit={handleSubmit} className="space-y-8 pb-4">
              <div className="grid grid-cols-1 gap-8">
                {/* Avatar upload */}
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 group transition-all hover:bg-slate-100/50">
                  <ImageUpload
                    variant="avatar"
                    value={formData.avatar}
                    onChange={url => setFormData({ ...formData, avatar: url })}
                    folder="avatars"
                    disabled={panelMode === 'view'}
                  />
                  <p className="text-xs text-slate-400 mt-4 text-center font-medium">
                    Tải lên ảnh chân dung chuyên nghiệp.<br/>
                    Định dạng JPG, PNG tối đa 5MB.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Họ và tên</label>
                    <input
                      title="Name"
                      required
                      disabled={panelMode === 'view'}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C8A97E]/20 transition-all bg-white disabled:bg-slate-50"
                      placeholder="vd: Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Số điện thoại</label>
                    <input
                      title="Phone"
                      required
                      disabled={panelMode === 'view'}
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C8A97E]/20 transition-all bg-white disabled:bg-slate-50"
                      placeholder="vd: 0912..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                    <input
                      title="Email"
                      required
                      type="email"
                      disabled={panelMode === 'view'}
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C8A97E]/20 transition-all bg-white disabled:bg-slate-50"
                      placeholder="vd: nhanvien@barber.vn"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Vị trí</label>
                    <select
                      title="Position"
                      required
                      disabled={panelMode === 'view'}
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C8A97E]/20 transition-all bg-white disabled:bg-slate-50 cursor-pointer"
                    >
                      {Object.entries(STAFF_POSITIONS).map(([key, value]) => (
                        <option key={key} value={key}>{value as string}</option>
                      ))}
                    </select>
                  </div>
                  {panelMode === 'create' && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu khởi tạo</label>
                      <input
                        title="Password"
                        required
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#C8A97E]/20 transition-all bg-white"
                        placeholder="Tối thiểu 6 ký tự"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2 flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <input
                      title="Is Active"
                      type="checkbox"
                      id="isActive"
                      disabled={panelMode === 'view'}
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded-md border-slate-300 text-[#C8A97E] focus:ring-[#C8A97E]/20 cursor-pointer"
                    />
                    <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                      Nhân viên này đang trong trạng thái sẵn sàng phục vụ khách hàng.
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
             <Button type="button" variant="outline" onClick={() => setPanelOpen(false)} className="rounded-xl px-8 h-12 min-w-[100px]">Hủy</Button>
             {panelMode !== 'view' && (
               <Button 
                form="staff-form"
                type="submit" 
                className="rounded-xl px-12 h-12 font-bold shadow-lg shadow-[#C8A97E]/20 hover:shadow-[#C8A97E]/30 transition-all bg-slate-900 hover:bg-slate-800 text-white"
                disabled={createMutation.isPending || updateMutation.isPending}
               >
                 {createMutation.isPending || updateMutation.isPending ? (
                   <Loader2 className="w-5 h-5 animate-spin mr-2" />
                 ) : null}
                 {panelMode === 'create' ? 'Tạo nhân viên' : 'Lưu thay đổi'}
               </Button>
             )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
