'use client';

import { Sparkles, X, HelpCircle, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WelcomeModalProps {
  title: string;
  description: string;
  onStart: () => void;
  onDismiss: () => void;
}

export function WelcomeModal({ title, description, onStart, onDismiss }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onDismiss} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary via-primary to-amber-500 px-8 pt-10 pb-12 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />

          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm ring-4 ring-white/10">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-white/80 text-sm mt-2 max-w-xs mx-auto">{description}</p>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-5">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tour tương tác sẽ chỉ cho bạn từng chức năng ngay trên giao diện thật. Bạn có thể xem lại bất kỳ lúc nào.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onDismiss}
              className="flex-1 rounded-xl h-11 border-slate-200 text-sm font-semibold hover:bg-slate-50"
            >
              Bỏ qua
            </Button>
            <Button
              onClick={onStart}
              className="flex-[2] rounded-xl h-11 shadow-lg shadow-primary/20 text-sm font-semibold gap-2"
            >
              Bắt đầu hướng dẫn
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TourButtonProps {
  onClick: () => void;
  variant?: 'icon' | 'full';
  className?: string;
}

export function TourButton({ onClick, variant = 'icon', className }: TourButtonProps) {
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn('text-slate-400 hover:text-primary rounded-full', className)}
        title="Hướng dẫn sử dụng"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('text-slate-400 hover:text-primary gap-1.5 text-xs', className)}
    >
      <HelpCircle className="w-4 h-4" />
      Hướng dẫn
    </Button>
  );
}
