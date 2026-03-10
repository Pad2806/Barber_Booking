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
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-12 h-12 text-xs',
  lg: 'w-20 h-20 text-lg',
  xl: 'w-32 h-32 text-4xl',
  '2xl': 'w-48 h-48 text-6xl',
};

const radiusMap = {
  circle: 'rounded-full',
  square: 'rounded-[1.5rem] md:rounded-[3rem]',
};

// Curated Vintage Palette (Beige, Sand, Wood, Bronze, Gold)
const vintagePalette = [
  'bg-[#F5F5DC] text-[#4A3728]', // Beige
  'bg-[#E5D3B3] text-[#4A3728]', // Sand
  'bg-[#D2B48C] text-[#2C1E12]', // Tan
  'bg-[#BC8F8F] text-[#FFFFFF]', // Rosy Brown
  'bg-[#A0522D] text-[#FFFFFF]', // Sienna
  'bg-[#8B4513] text-[#FFFFFF]', // Saddle Brown
  'bg-[#CD7F32] text-[#FFFFFF]', // Bronze
  'bg-[#DAA520] text-[#FFFFFF]', // Goldenrod
];

const getVintageColor = (name: string) => {
  if (!name) return vintagePalette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return vintagePalette[Math.abs(hash) % vintagePalette.length];
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

  const colorClasses = getVintageColor(name || '');

  return (
    <div 
      className={cn(
        'relative border border-border/10 shadow-2xl overflow-hidden flex items-center justify-center shrink-0 transition-transform duration-700',
        sizeMap[size],
        radiusMap[variant],
        !src && colorClasses,
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
        <span className="font-heading font-black uppercase tracking-tighter italic">
          {initials}
        </span>
      ) : (
        <UserIcon className="w-1/2 h-1/2 opacity-20" />
      )}
      
      {/* Premium Grainy Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-[0.03] pointer-events-none" />
      {/* Premium Overlay Shadow */}
      <div className="absolute inset-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] pointer-events-none" />
    </div>
  );
}
