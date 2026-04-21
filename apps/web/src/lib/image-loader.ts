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

  // Priority 1: If it's a Cloudflare R2 link, use it DIRECTLY.
  if (src.includes('r2.dev') || src.includes('cloudflarestorage.com')) {
    return src;
  }

  // Priority 2: For local/relative paths, we need to prefix with base URL for Coollabs
  if (src.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://reetrobarber.paduy.tech';
    return `${optimizeDomain}/image/${baseUrl}${src}?${query.toString()}`;
  }

  // Priority 3: Other full URLs (Cloudinary, etc.)
  return `${optimizeDomain}/image/${src}?${query.toString()}`;
}
