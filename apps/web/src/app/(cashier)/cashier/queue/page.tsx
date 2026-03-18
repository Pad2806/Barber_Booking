'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi, serviceApi, usersApi } from '@/lib/api';
import {
  ListOrdered,
  Plus,
  User,
  Clock,
  Loader2,
  Play,
  CheckCircle,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const QUEUE_STATUS: Record<string, { label: string; style: string; icon: any }> = {
  WAITING: { label: 'Đang chờ', style: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  SERVING: { label: 'Đang phục vụ', style: 'bg-blue-50 text-blue-700 border-blue-200', icon: Play },
  COMPLETED: { label: 'Hoàn thành', style: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', style: 'bg-rose-50 text-rose-600', icon: XCircle },
};

export default function QueuePage() {
  const queryClient = useQueryClient();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [newStaffId, setNewStaffId] = useState('');

  const { data: me } = useQuery({ queryKey: ['users', 'me'], queryFn: usersApi.getMe });
  const salonId = me?.staff?.salonId;

  const { data: queue, isLoading } = useQuery({
    queryKey: ['cashier', 'queue'],
    queryFn: cashierApi.getQueue,
    refetchInterval: 10000,
  });

  const { data: services } = useQuery({
    queryKey: ['cashier', 'services', salonId],
    queryFn: () => serviceApi.getBySalon(salonId!),
    enabled: !!salonId && isAddSheetOpen,
  });

  const { data: barbers } = useQuery({
    queryKey: ['cashier', 'barbers-queue'],
    queryFn: () => cashierApi.getAvailableBarbers(dayjs().format('YYYY-MM-DD'), dayjs().format('HH:mm')),
    enabled: isAddSheetOpen,
  });

  const addMutation = useMutation({
    mutationFn: () => cashierApi.addToQueue({
      customerName: newCustomerName,
      phone: newPhone || undefined,
      serviceId: newServiceId || undefined,
      staffId: newStaffId || undefined,
    }),
    onSuccess: () => {
      toast.success('Đã thêm vào hàng chờ');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['cashier', 'queue'] });
    },
    onError: () => toast.error('Không thể thêm vào hàng chờ'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, staffId }: { id: string; status: string; staffId?: string }) =>
      cashierApi.updateQueueStatus(id, { status, staffId }),
    onSuccess: () => {
      toast.success('Đã cập nhật');
      queryClient.invalidateQueries({ queryKey: ['cashier', 'queue'] });
    },
    onError: () => toast.error('Không thể cập nhật'),
  });

  const resetForm = () => {
    setIsAddSheetOpen(false);
    setNewCustomerName('');
    setNewPhone('');
    setNewServiceId('');
    setNewStaffId('');
  };

  const waitingCount = queue?.filter((q: any) => q.status === 'WAITING').length || 0;
  const servingCount = queue?.filter((q: any) => q.status === 'SERVING').length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Hàng chờ</h1>
          <p className="text-slate-500 mt-1">Quản lý khách đang chờ phục vụ</p>
        </div>
        <Button className="rounded-xl h-10" onClick={() => setIsAddSheetOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Thêm khách
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Đang chờ</p>
              <p className="text-2xl font-bold text-slate-900">{waitingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Đang phục vụ</p>
              <p className="text-2xl font-bold text-slate-900">{servingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : !queue?.length ? (
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="py-20 flex flex-col items-center gap-4">
            <ListOrdered className="w-12 h-12 text-slate-200" />
            <p className="text-slate-400 font-medium">Hàng chờ trống</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((item: any, index: number) => {
            const statusInfo = QUEUE_STATUS[item.status] || QUEUE_STATUS.WAITING;
            return (
              <Card key={item.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Position */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{item.customerName}</p>
                        <Badge className={cn('text-[10px] border', statusInfo.style)}>{statusInfo.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        {item.phone && <span>{item.phone}</span>}
                        {item.service && <span>• {item.service.name}</span>}
                        <span>• Đến {dayjs(item.arrivalTime).fromNow()}</span>
                      </div>
                    </div>

                    {/* Staff */}
                    {item.staff && (
                      <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={item.staff.user?.avatar} />
                          <AvatarFallback className="bg-slate-200 text-[10px]">{item.staff.user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-slate-600">{item.staff.user?.name}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {item.status === 'WAITING' && (
                        <Button
                          size="sm"
                          className="rounded-lg bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                          onClick={() => statusMutation.mutate({ id: item.id, status: 'SERVING' })}
                          disabled={statusMutation.isPending}
                        >
                          <Play className="w-3 h-3 mr-1" /> Phục vụ
                        </Button>
                      )}
                      {item.status === 'SERVING' && (
                        <Button
                          size="sm"
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                          onClick={() => statusMutation.mutate({ id: item.id, status: 'COMPLETED' })}
                          disabled={statusMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Xong
                        </Button>
                      )}
                      {(item.status === 'WAITING' || item.status === 'SERVING') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg h-8 text-xs text-slate-400 hover:text-rose-600"
                          onClick={() => statusMutation.mutate({ id: item.id, status: 'CANCELLED' })}
                          disabled={statusMutation.isPending}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add to Queue Sheet */}
      <Sheet open={isAddSheetOpen} onOpenChange={() => resetForm()}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold font-heading italic text-primary">
              Thêm vào hàng chờ
            </SheetTitle>
            <SheetDescription>Nhập thông tin khách đến trực tiếp</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tên khách hàng *</label>
              <Input
                placeholder="Nhập tên khách..."
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Số điện thoại</label>
              <Input
                placeholder="VD: 0912345678"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Dịch vụ</label>
              <Select value={newServiceId} onValueChange={setNewServiceId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Chọn dịch vụ..." />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Chỉ định thợ</label>
              <Select value={newStaffId} onValueChange={setNewStaffId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Bất kỳ..." />
                </SelectTrigger>
                <SelectContent>
                  {barbers?.filter((b: any) => b.isAvailable).map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full rounded-xl h-11"
              disabled={!newCustomerName.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Thêm vào hàng chờ
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
