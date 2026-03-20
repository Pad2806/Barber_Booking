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

// ===== Option C: Cloudinary blur placeholder =====

/**
 * Chuyển Cloudinary URL thành URL thumbnail mờ (blur placeholder).
 * Dùng cho Next.js Image `blurDataURL`.
 *
 * Input:  https://res.cloudinary.com/xxx/image/upload/v123/reetro/avatars/abc.jpg
 * Output: https://res.cloudinary.com/xxx/image/upload/w_30,q_auto,f_auto,e_blur:500/v123/reetro/avatars/abc.jpg
 */
export function getBlurPlaceholder(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return '';

  // Regex match Cloudinary URL pattern
  const match = url.match(/(.*\/upload\/)(v\d+\/.*)/);
  if (!match) return '';

  return `${match[1]}w_30,q_auto,f_auto,e_blur:500/${match[2]}`;
}

/**
 * Chuyển Cloudinary URL thành URL đã tối ưu kích thước.
 *
 * Example: getOptimizedUrl(url, 400) →
 *   .../upload/w_400,f_auto,q_auto/v123/reetro/...
 */
export function getOptimizedUrl(url: string, width: number): string {
  if (!url || !url.includes('cloudinary.com')) return url;

  const match = url.match(/(.*\/upload\/)(v\d+\/.*)/);
  if (!match) return url;

  return `${match[1]}w_${width},f_auto,q_auto/${match[2]}`;
}
