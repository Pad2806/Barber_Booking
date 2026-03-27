'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashierApi, serviceApi, usersApi } from '@/lib/api';
import {
  UserPlus,
  Search,
  Check,
  Loader2,
  Scissors,
  Phone,
  User,
  StickyNote,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatPrice, SERVICE_CATEGORIES } from '@/lib/utils';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function WalkInPage() {
  const queryClient = useQueryClient();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [note, setNote] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const { data: me } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
  });

  const salonId = me?.staff?.salonId;

  const { data: services } = useQuery({
    queryKey: ['cashier', 'services', salonId],
    queryFn: () => serviceApi.getBySalon(salonId!),
    enabled: !!salonId,
  });

  const { data: barbers } = useQuery({
    queryKey: ['cashier', 'barbers-today'],
    queryFn: () => cashierApi.getAvailableBarbers(dayjs().format('YYYY-MM-DD'), dayjs().format('HH:mm')),
  });

  const createMutation = useMutation({
    mutationFn: () => cashierApi.createWalkinBooking({
      customerName,
      phone: customerPhone || undefined,
      serviceIds: selectedServiceIds,
      staffId: selectedStaffId || undefined,
      note: note || undefined,
    }),
    onSuccess: () => {
      toast.success('Đã tạo booking thành công!');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['cashier'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể tạo booking'),
  });

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setSelectedServiceIds([]);
    setSelectedStaffId('');
    setNote('');
  };

  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (categoryFilter === 'ALL') return services;
    return services.filter((s: any) => s.category === categoryFilter);
  }, [services, categoryFilter]);

  const selectedServices = useMemo(() => {
    if (!services) return [];
    return services.filter((s: any) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const totalAmount = selectedServices.reduce((acc: number, s: any) => acc + Number(s.price), 0);
  const totalDuration = selectedServices.reduce((acc: number, s: any) => acc + s.duration, 0);

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const categories = useMemo(() => {
    if (!services) return [];
    const cats = new Set(services.map((s: any) => s.category));
    return ['ALL', ...Array.from(cats)];
  }, [services]);

  const canSubmit = customerName.trim() && selectedServiceIds.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading italic">Khách vãng lai</h1>
        <p className="text-slate-500 mt-1">Tạo booking nhanh cho khách đến trực tiếp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tên khách hàng *</label>
                  <Input
                    placeholder="Nhập tên khách..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Số điện thoại</label>
                  <Input
                    placeholder="VD: 0912345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-primary" /> Chọn dịch vụ
                </CardTitle>
                {selectedServiceIds.length > 0 && (
                  <Badge className="bg-primary/10 text-primary border-none">{selectedServiceIds.length} đã chọn</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? 'default' : 'outline'}
                    size="sm"
                    className={cn('rounded-xl text-xs h-8', categoryFilter === cat && 'bg-primary hover:bg-primary/90')}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat === 'ALL' ? 'Tất cả' : (SERVICE_CATEGORIES[cat]?.label || cat)}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredServices.map((s: any) => {
                  const isSelected = selectedServiceIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer',
                        isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200',
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.duration} phút</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{formatPrice(Number(s.price))}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Barber Selection */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold">Chọn thợ cắt (tuỳ chọn)</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div
                  onClick={() => setSelectedStaffId('')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
                    !selectedStaffId ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200',
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Bất kỳ</p>
                </div>
                {barbers?.filter((b: any) => b.isAvailable).map((barber: any) => (
                  <div
                    key={barber.id}
                    onClick={() => setSelectedStaffId(barber.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
                      selectedStaffId === barber.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200',
                    )}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={barber.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {barber.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-semibold text-slate-600 truncate w-full text-center">{barber.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-primary" /> Ghi chú
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <Textarea
                placeholder="Ghi chú thêm cho booking..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="rounded-xl min-h-[80px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white sticky top-24">
            <CardHeader className="pb-4 border-b border-slate-50">
              <CardTitle className="text-base font-bold">Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {selectedServices.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Chưa chọn dịch vụ nào</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {selectedServices.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{s.name}</span>
                        <span className="text-sm font-semibold text-slate-900">{formatPrice(Number(s.price))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Thời gian ước tính</span>
                    <span>{totalDuration} phút</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Tổng cộng</span>
                    <span className="text-xl font-bold text-primary">{formatPrice(totalAmount)}</span>
                  </div>
                </>
              )}

              <Button
                className="w-full rounded-xl h-12 font-bold"
                disabled={!canSubmit || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Tạo Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
