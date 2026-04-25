'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/lib/api';
import {
    CalendarOff,
    Plus,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    X,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { ConfigProvider, DatePicker } from 'antd';

const { RangePicker } = DatePicker;

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    PENDING: {
        label: 'Đang chờ duyệt',
        icon: <Clock className="w-3.5 h-3.5" />,
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    APPROVED: {
        label: 'Đã được duyệt',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    REJECTED: {
        label: 'Bị từ chối',
        icon: <XCircle className="w-3.5 h-3.5" />,
        cls: 'bg-rose-50 text-rose-600 border-rose-200',
    },
};

export default function MyLeavesPage() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
    const [reason, setReason] = useState('');

    const { data: leaves, isLoading } = useQuery({
        queryKey: ['staff', 'my-leaves'],
        queryFn: staffApi.getMyLeaves,
    });

    const submitMutation = useMutation({
        mutationFn: (data: { startDate: string; endDate: string; reason?: string }) =>
            staffApi.requestLeave(data),
        onSuccess: () => {
            toast.success('Gửi đơn nghỉ phép thành công! Chờ quản lý duyệt.');
            queryClient.invalidateQueries({ queryKey: ['staff', 'my-leaves'] });
            setIsFormOpen(false);
            setDateRange(null);
            setReason('');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Không thể gửi đơn. Vui lòng thử lại.');
        },
    });

    const handleSubmit = () => {
        if (!dateRange?.[0] || !dateRange?.[1]) {
            toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
            return;
        }
        submitMutation.mutate({
            startDate: dateRange[0].format('YYYY-MM-DD'),
            endDate: dateRange[1].format('YYYY-MM-DD'),
            reason: reason.trim() || undefined,
        });
    };

    const leaveList: any[] = Array.isArray(leaves) ? leaves : [];

    return (
        <div className="space-y-6 pb-10 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#2C1E12] tracking-tight">Đăng ký nghỉ phép</h1>
                    <p className="text-sm text-[#8B7355] mt-0.5">
                        Gửi đơn xin nghỉ và theo dõi trạng thái phê duyệt
                    </p>
                </div>
                <Button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-[#1C1612] hover:bg-[#2C1E12] text-white rounded-xl h-11 px-5 font-semibold shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Gửi đơn nghỉ
                </Button>
            </div>

            {/* Form gửi đơn */}
            {isFormOpen && (
                <div className="bg-white border border-[#E8E0D4] rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-[#2C1E12] flex items-center gap-2">
                            <CalendarOff className="w-4 h-4 text-[#C8A97E]" />
                            Đơn xin nghỉ phép mới
                        </h2>
                        <button
                            onClick={() => setIsFormOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#FAF8F5] text-[#8B7355] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Date range */}
                        <div>
                            <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block mb-2">
                                Thời gian nghỉ *
                            </label>
                            <ConfigProvider
                                theme={{
                                    token: { colorPrimary: '#C8A97E', borderRadius: 10 },
                                }}
                            >
                                <RangePicker
                                    className="w-full h-11 border-[#E8E0D4] rounded-xl text-sm"
                                    placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                                    format="DD/MM/YYYY"
                                    onChange={(dates: any) => setDateRange(dates)}
                                    disabledDate={(current) => current && current.isBefore(dayjs().startOf('day'))}
                                />
                            </ConfigProvider>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="text-xs font-bold text-[#8B7355] uppercase tracking-wider block mb-2">
                                Lý do nghỉ
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                placeholder="VD: Việc gia đình, khám bệnh, du lịch..."
                                className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#E8E0D4] rounded-xl focus:outline-none focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E]/20 transition-all text-sm text-[#2C1E12] placeholder:text-[#C4B9A8] resize-none"
                            />
                        </div>

                        {/* Summary */}
                        {dateRange?.[0] && dateRange?.[1] && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                                <CalendarOff className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-800 font-medium">
                                    Xin nghỉ{' '}
                                    <span className="font-bold">
                                        {dateRange[1].diff(dateRange[0], 'day') + 1} ngày
                                    </span>{' '}
                                    ({dateRange[0].format('DD/MM/YYYY')} → {dateRange[1].format('DD/MM/YYYY')}).
                                    Đơn sẽ được gửi cho quản lý chi nhánh phê duyệt.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <Button
                                variant="ghost"
                                onClick={() => setIsFormOpen(false)}
                                className="flex-1 rounded-xl h-11 text-[#8B7355] hover:bg-[#FAF8F5]"
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitMutation.isPending || !dateRange?.[0]}
                                className="flex-1 bg-[#C8A97E] hover:bg-[#B8975E] text-white rounded-xl h-11 font-bold shadow-sm"
                            >
                                {submitMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Gửi đơn <ChevronRight className="w-4 h-4 ml-1" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave history */}
            <div>
                <h2 className="text-sm font-bold text-[#8B7355] uppercase tracking-wider mb-3">
                    Lịch sử đơn nghỉ ({leaveList.length})
                </h2>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-7 h-7 animate-spin text-[#C8A97E]" />
                    </div>
                ) : leaveList.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-[#E8E0D4] rounded-2xl p-12 flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] flex items-center justify-center mb-4">
                            <CalendarOff className="w-7 h-7 text-[#C8A97E]/30" />
                        </div>
                        <h3 className="text-base font-bold text-[#2C1E12] mb-1">Chưa có đơn nào</h3>
                        <p className="text-sm text-[#8B7355]">
                            Nhấn "Gửi đơn nghỉ" để tạo yêu cầu nghỉ phép đầu tiên
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {leaveList
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((leave: any) => {
                                const statusInfo = STATUS_MAP[leave.status] || STATUS_MAP.PENDING;
                                const start = dayjs(leave.startDate);
                                const end = dayjs(leave.endDate);
                                const days = end.diff(start, 'day') + 1;
                                return (
                                    <div
                                        key={leave.id}
                                        className={cn(
                                            'bg-white border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4',
                                            leave.status === 'APPROVED' && 'border-emerald-200',
                                            leave.status === 'REJECTED' && 'border-rose-200',
                                            leave.status === 'PENDING' && 'border-[#E8E0D4]',
                                        )}
                                    >
                                        {/* Date info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] flex flex-col items-center justify-center shrink-0 border border-[#E8E0D4]">
                                                <span className="text-lg font-bold text-[#C8A97E] leading-none">{days}</span>
                                                <span className="text-[9px] font-semibold text-[#8B7355] uppercase">ngày</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-[#2C1E12]">
                                                    {start.isSame(end, 'day')
                                                        ? start.format('DD/MM/YYYY')
                                                        : `${start.format('DD/MM')} → ${end.format('DD/MM/YYYY')}`}
                                                </p>
                                                {leave.reason && (
                                                    <p className="text-xs text-[#8B7355] mt-0.5 flex items-center gap-1 truncate">
                                                        <FileText className="w-3 h-3 shrink-0" />
                                                        {leave.reason}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-[#C4B9A8] mt-0.5">
                                                    Gửi: {dayjs(leave.createdAt).format('HH:mm DD/MM/YYYY')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={cn('rounded-xl text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5', statusInfo.cls)}
                                            >
                                                {statusInfo.icon}
                                                {statusInfo.label}
                                            </Badge>
                                        </div>

                                        {/* Reject reason */}
                                        {leave.status === 'REJECTED' && (
                                            <div className="w-full sm:mt-0 mt-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                                <p className="text-xs text-rose-700 font-medium">
                                                    Lý do từ chối:{' '}
                                                    {leave.rejectReason
                                                        ? <span className="italic">"{leave.rejectReason}"</span>
                                                        : <span className="italic text-rose-400">Quản lý không ghi lý do</span>
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>
        </div>
    );
}
