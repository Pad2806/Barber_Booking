'use client'

/**
 * Custom loader for coollabs image optimization.
 * https://github.com/coollabsio/next-image-transformation
 */
export default function coollabsImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If it's already a full URL to another optimization service or locally served in dev
  if (src.includes('images.coollabs.io')) return src;
  
  const optimizeDomain = process.env.NEXT_PUBLIC_IMAGE_OPTIMIZATION_API || 'https://images.coollabs.io';
  
  const query = new URLSearchParams();
  if (width) query.set('width', width.toString());
  query.set('quality', (quality || 75).toString());

  // Handle local development or already-proxied URLs
  if (src.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://reetrobarber.com';
    return `${optimizeDomain}/image/${baseUrl}${src}?${query.toString()}`;
  }

  // It's a full URL (R2, Cloudinary, etc.)
  // We don't encode here because some proxy versions handle the raw URL better
  return `${optimizeDomain}/image/${src}?${query.toString()}`;
}
