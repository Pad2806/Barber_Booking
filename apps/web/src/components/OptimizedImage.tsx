'use client';

import Image, { type ImageProps } from 'next/image';
import { getBlurPlaceholder, getOptimizedUrl } from '@/lib/image-utils';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
  /** Auto-generate blur placeholder from Cloudinary URL */
  enableBlur?: boolean;
  /** Auto-optimize width via Cloudinary transform */
  optimizeWidth?: number;
}

/**
 * Wrapper around Next.js Image với 2 tính năng tối ưu:
 * 1. Blur placeholder tự động cho ảnh Cloudinary
 * 2. Cloudinary transform để resize/optimize trên CDN
 *
 * Usage:
 * <OptimizedImage src={cloudinaryUrl} alt="..." width={400} height={300} enableBlur />
 */
export default function OptimizedImage({
  src,
  enableBlur = true,
  optimizeWidth,
  ...props
}: OptimizedImageProps) {
  const srcString = typeof src === 'string' ? src : '';

  // Auto-optimize URL if width specified
  const optimizedSrc = optimizeWidth && srcString
    ? getOptimizedUrl(srcString, optimizeWidth)
    : src;

  // Auto blur placeholder
  const blurUrl = enableBlur && srcString ? getBlurPlaceholder(srcString) : undefined;

  return (
    <Image
      src={optimizedSrc}
      placeholder={blurUrl ? 'blur' : 'empty'}
      blurDataURL={blurUrl}
      {...props}
    />
  );
}
