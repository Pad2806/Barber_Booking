'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User as UserIcon } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  variant?: 'circle' | 'square';
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-20 h-20 text-xl',
  xl: 'w-32 h-32 text-2xl',
  '2xl': 'w-48 h-48 text-4xl',
};

const radiusMap = {
  circle: 'rounded-full',
  square: 'rounded-[1.5rem] md:rounded-[2.5rem]',
};

export default function Avatar({ 
  src, 
  name, 
  size = 'md', 
  className,
  variant = 'circle'
}: AvatarProps): React.ReactNode {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '';

  return (
    <div 
      className={cn(
        'relative bg-accent/5 border border-border shadow-inner overflow-hidden flex items-center justify-center shrink-0',
        sizeMap[size],
        radiusMap[variant],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name || 'Avatar'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 200px"
        />
      ) : name ? (
        <span className="font-heading font-black text-primary/50 uppercase tracking-tighter italic">
          {initials}
        </span>
      ) : (
        <UserIcon className="w-1/2 h-1/2 text-primary/20" />
      )}
      
      {/* Premium Overlay Shadow */}
      <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] pointer-events-none" />
    </div>
  );
}
