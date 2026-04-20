'use client'

/**
 * Custom loader for coollabs image optimization.
 * https://github.com/coollabsio/next-image-transformation
 */
export default function coollabsImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If it's already a full URL to another optimization service or locally served in dev
  if (src.includes('images.coollabs.io')) return src;
  
  const optimizeDomain = process.env.NEXT_PUBLIC_IMAGE_OPTIMIZATION_API || 'https://images.coollabs.io';
  
  // Standard format: https://images.coollabs.io/image/<original_url>?width=...&quality=...
  // next/image passes the full URL from src
  
  const query = new URLSearchParams();
  if (width) query.set('width', width.toString());
  if (quality) query.set('quality', quality.toString() || '75');

  // Handle local development or already-proxied URLs
  if (src.startsWith('/')) {
    // For local dev, we might want to skip proxy if it's localhost
    // but coollabs needs a public URL. In production, we provide the full base URL.
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://reetrobarber.com';
    return `${optimizeDomain}/image/${baseUrl}${src}?${query.toString()}`;
  }

  return `${optimizeDomain}/image/${src}?${query.toString()}`;
}
