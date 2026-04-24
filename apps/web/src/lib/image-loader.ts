'use client'

/**
 * Custom loader for coollabs image optimization.
 * https://github.com/coollabsio/next-image-transformation
 */
export default function coollabsImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const optimizeDomain = process.env.NEXT_PUBLIC_IMAGE_OPTIMIZATION_API || 'https://images.coollabs.io';
  const query = new URLSearchParams();
  if (width) query.set('width', width.toString());
  query.set('quality', (quality || 75).toString());

  // Priority 1: Use direct links for reliable sources that don't need proxying or are known to block it.
  if (
    src.includes('r2.dev') ||
    src.includes('cloudflarestorage.com') ||
    src.includes('cloudinary.com') ||
    src.includes('googleusercontent.com') ||
    src.includes('fbsbx.com')
  ) {
    return src;
  }

  // Priority 2: For local/relative paths, we need to prefix with base URL for Coollabs
  if (src.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || '';
    return `${optimizeDomain}/image/${baseUrl}${src}?${query.toString()}`;
  }

  // Priority 3: Other full URLs (Cloudinary, etc.)
  return `${optimizeDomain}/image/${src}?${query.toString()}`;
}
