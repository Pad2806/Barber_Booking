import imageCompression from 'browser-image-compression';

// ===== Option A: Client-side compression before upload =====

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,            // Nén xuống tối đa 1MB trước khi upload
  maxWidthOrHeight: 1920,  // Resize nếu lớn hơn 1920px
  useWebWorker: true,      // Chạy nền, không block UI
  fileType: 'image/webp',  // Output WebP cho dung lượng nhỏ nhất
};

const AVATAR_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3,          // Avatar chỉ cần 300KB
  maxWidthOrHeight: 512,
  useWebWorker: true,
  fileType: 'image/webp',
};

export async function compressImage(
  file: File,
  variant: 'avatar' | 'cover' | 'default' = 'default'
): Promise<File> {
  // Skip nếu đã nhỏ hơn target
  const options = variant === 'avatar' ? AVATAR_COMPRESSION_OPTIONS : COMPRESSION_OPTIONS;
  const targetBytes = options.maxSizeMB * 1024 * 1024;

  if (file.size <= targetBytes) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, options);
    return compressed;
  } catch {
    // Nén lỗi → trả file gốc
    return file;
  }
}

// ===== Option C: Future-proof placeholders =====

/**
 * Returns a generic placeholder or the original URL.
 * Blur is now primarily handled by Next.js Image component and our custom loader
 * when using coollabs (which doesn't have a specific blur-dedicated endpoint like Cloudinary,
 * but Next.js can generate placeholders or we can use generic skeletons).
 */
export function getBlurPlaceholder(url: string): string {
  // coollabs doesn't have a direct "blur" endpoint like Cloudinary's e_blur.
  // We'll return an empty string or a very tiny low-quality version if needed.
  if (!url) return '';
  return url; 
}

/**
 * Returns the URL as is. Optimization is now handled globally via next.config.ts loader.
 */
export function getOptimizedUrl(url: string, _width: number): string {
  return url;
}
