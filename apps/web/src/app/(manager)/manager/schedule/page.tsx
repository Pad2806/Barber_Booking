'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerApi } from '@/lib/api';
import { ScheduleCalendar } from '@/components/manager/ScheduleCalendar';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShiftSelector, SHIFTS } from '@/components/manager/ShiftSelector';
import toast from 'react-hot-toast';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ManagerSchedulePage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<string>('MORNING');

  const { data: staffList, isLoading: loadingStaff } = useQuery({
    queryKey: ['manager', 'staff'],
    queryFn: () => managerApi.getStaff(),
  });

  const { data: shifts, isLoading: loadingShifts } = useQuery({
    queryKey: ['manager', 'shifts'],
    queryFn: () => managerApi.getSchedules(),
  });

  const createShiftMutation = useMutation({
    mutationFn: (data: any) => managerApi.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'shifts'] });
      toast.success('Đã phân ca làm việc thành công');
      setIsAddModalOpen(false);
    },
    onError: () => {
      toast.error('Không thể phân ca làm việc');
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: string) => managerApi.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'shifts'] });
      toast.success('Đã xóa ca làm việc');
    }
  });

  const handleOpenAddModal = (date: Date, staffId: string) => {
    setSelectedDate(date);
    setSelectedStaffId(staffId);
    setIsAddModalOpen(true);
  };

  const handleConfirmAddShift = () => {
    if (!selectedDate || !selectedStaffId || !selectedShift) return;

    const shiftInfo = SHIFTS[selectedShift as keyof typeof SHIFTS];
    
    // Construct local times
    const start = new Date(selectedDate);
    const [startH, startM] = shiftInfo.start.split(':').map(Number);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(selectedDate);
    const [endH, endM] = shiftInfo.end.split(':').map(Number);
    end.setHours(endH, endM, 0, 0);

    createShiftMutation.mutate({
      staffId: selectedStaffId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      shiftStart: start.toISOString(),
      shiftEnd: end.toISOString()
    });
  };

  if (loadingStaff || loadingShifts) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white rounded animate-pulse" />
        <div className="h-[600px] bg-white rounded-2xl animate-pulse border border-[#E8E0D4]" />
      </div>
    );
  }

  const selectedStaff = staffList?.find(s => s.id === selectedStaffId);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black text-[#2C1E12] tracking-tight italic uppercase">
          Quản lý <span className="text-[#C8A97E]">Lịch làm</span>
        </h1>
        <p className="text-[#8B7355] font-medium">Bố trí ca làm việc cho đội ngũ Barber</p>
      </div>

      <ScheduleCalendar 
        staffList={staffList || []}
        shifts={shifts || []}
        onAddShift={handleOpenAddModal}
        onDeleteShift={(id) => deleteShiftMutation.mutate(id)}
      />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="bg-[#FAF8F5] p-6 border-b border-[#E8E0D4]">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black text-[#2C1E12] italic uppercase tracking-tight flex items-center gap-2">
                    <Clock className="w-6 h-6 text-[#C8A97E]" />
                    Phân ca làm việc
                </DialogTitle>
                <p className="text-sm font-medium text-[#8B7355] mt-1">Chọn ca làm việc cho nhân viên</p>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-4 p-4 bg-[#FAF8F5] rounded-2xl border border-[#F0EBE3]">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <User className="w-5 h-5 text-[#C8A97E]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Nhân viên</p>
                    <p className="text-base font-black text-[#2C1E12] italic">{selectedStaff?.user?.name || 'Đang chọn...'}</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 p-4 bg-[#FAF8F5] rounded-2xl border border-[#F0EBE3]">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <CalendarIcon className="w-5 h-5 text-[#C8A97E]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Ngày làm việc</p>
                    <p className="text-base font-black text-[#2C1E12] italic">
                        {selectedDate ? format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: vi }) : '...'}
                    </p>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-[#2C1E12] uppercase tracking-wider px-1">Chọn Ca làm</label>
              <ShiftSelector 
                value={selectedShift}
                onChange={setSelectedShift}
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-[#FAF8F5] border-t border-[#E8E0D4] gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-bold text-[#8B7355] hover:bg-white active:scale-95 transition-all">
                Hủy bỏ
            </Button>
            <Button 
                onClick={handleConfirmAddShift} 
                className="bg-[#C8A97E] hover:bg-[#B8975E] text-white rounded-xl font-bold px-8 shadow-md active:scale-95 transition-all"
                disabled={createShiftMutation.isPending}
            >
                {createShiftMutation.isPending ? 'Đang lưu...' : 'Xác nhận phân ca'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
