'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL_DAY' | 'OFF';

export const SHIFTS = {
  MORNING: { label: 'Sáng (8:00 - 12:00)', start: '08:00', end: '12:00' },
  AFTERNOON: { label: 'Chiều (12:00 - 16:00)', start: '12:00', end: '16:00' },
  EVENING: { label: 'Tối (16:00 - 20:00)', start: '16:00', end: '20:00' },
  FULL_DAY: { label: 'Cả ngày (8:00 - 20:00)', start: '08:00', end: '20:00' },
  OFF: { label: 'Nghỉ (OFF)', start: '00:00', end: '23:59' },
};

interface ShiftSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export function ShiftSelector({ value, onChange }: ShiftSelectorProps): React.ReactElement {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full border-[#E8E0D4] rounded-xl focus:ring-[#C8A97E]/20">
        <SelectValue placeholder="Chọn ca làm việc" />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-[#E8E0D4]">
        {Object.entries(SHIFTS).map(([key, shift]) => (
          <SelectItem key={key} value={key} className="font-bold text-xs uppercase tracking-tight py-2.5">
            {shift.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
