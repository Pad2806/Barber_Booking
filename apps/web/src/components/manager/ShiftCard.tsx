'use client';

import React from 'react';
import { Clock, X } from 'lucide-react';
import { SHIFTS } from './ShiftSelector';

interface ShiftCardProps {
  type: string;
  onDelete?: () => void;
}

export function ShiftCard({ type, onDelete }: ShiftCardProps): React.ReactElement {
  const shift = SHIFTS[type as keyof typeof SHIFTS];

  return (
    <div className="group relative flex flex-col gap-1 p-2.5 bg-white border border-[#E8E0D4] rounded-xl shadow-sm hover:border-[#C8A97E] hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase italic tracking-wider ${
            type === 'MORNING' ? 'text-blue-600' :
            type === 'AFTERNOON' ? 'text-amber-600' : 'text-purple-600'
        }`}>
          {type === 'MORNING' ? 'Sáng' : type === 'AFTERNOON' ? 'Chiều' : 'Tối'}
        </span>
        {onDelete && (
          <button 
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-500 rounded-full transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B7355]">
        <Clock className="w-3 h-3" />
        <span>{shift?.start} - {shift?.end}</span>
      </div>
    </div>
  );
}
