/**
 * Brand Configuration Interface
 * Change this config to re-brand the entire application
 */
export interface BrandConfig {
  // Identity
  name: string;
  slug: string;
  tagline: string;
  description: string;

  // Visual
  logo: {
    light: string;
    dark: string;
    icon: string;
  };
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  fonts: {
    heading: string;
    body: string;
  };

  // Contact
  contact: {
    phone: string;
    email: string;
    address: string;
    hotline?: string;
  };

  // Social Media
  social: {
    facebook?: string;
    instagram?: string;
    zalo?: string;
    tiktok?: string;
    youtube?: string;
  };

  // Business Settings
  business: {
    currency: string;
    currencySymbol: string;
    locale: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
  };

  // Features Toggle
  features: {
    enableReviews: boolean;
    enableLoyalty: boolean;
    enableMultiSalon: boolean;
    enableNotifications: boolean;
    enableZaloMiniApp: boolean;
    enableWebApp: boolean;
  };

  // SEO
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string;
  };
}

/**
 * ReetroBarberShop Brand Configuration
 */
export const reetroConfig: BrandConfig = {
  // Identity
  name: 'ReetroBarberShop',
  slug: 'reetro',
  tagline: 'Phong cách - Đẳng cấp - Chất lượng',
  description: 'Hệ thống đặt lịch cắt tóc chuyên nghiệp dành cho quý ông',

  // Visual
  logo: {
    light: '/images/logo-light.svg',
    dark: '/images/logo-dark.svg',
    icon: '/images/logo-icon.svg',
  },
  colors: {
    primary: '#1a1a2e',
    primaryForeground: '#ffffff',
    secondary: '#16213e',
    secondaryForeground: '#ffffff',
    accent: '#e94560',
    accentForeground: '#ffffff',
    background: '#ffffff',
    foreground: '#1a1a2e',
    muted: '#f4f4f5',
    mutedForeground: '#71717a',
    border: '#e4e4e7',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  fonts: {
    heading: 'Playfair Display, serif',
    body: 'Inter, sans-serif',
  },

  // Contact
  contact: {
    phone: '0901234567',
    email: 'contact@reetro.vn',
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    hotline: '1900 xxxx xx',
  },

  // Social Media
  social: {
    facebook: 'https://facebook.com/reetrobarbershop',
    instagram: 'https://instagram.com/reetrobarbershop',
    zalo: 'https://zalo.me/reetrobarbershop',
    tiktok: 'https://tiktok.com/@reetrobarbershop',
  },

  // Business Settings
  business: {
    currency: 'VND',
    currencySymbol: '₫',
    locale: 'vi-VN',
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
  },

  // Features Toggle
  features: {
    enableReviews: true,
    enableLoyalty: false,
    enableMultiSalon: true,
    enableNotifications: true,
    enableZaloMiniApp: true,
    enableWebApp: true,
  },

  // SEO
  seo: {
    title: 'ReetroBarberShop - Đặt lịch cắt tóc chuyên nghiệp',
    description:
      'Đặt lịch cắt tóc online chỉ trong 30 giây. Chọn stylist, dịch vụ và thời gian phù hợp. Thanh toán dễ dàng qua QR code.',
    keywords: [
      'cắt tóc nam',
      'barber shop',
      'đặt lịch cắt tóc',
      'stylist',
      'salon tóc nam',
      'reetro',
    ],
    ogImage: '/images/og-image.jpg',
  },
};

/**
 * Get current brand configuration
 * In production, this could be loaded from environment or database
 */
export function getBrandConfig(): BrandConfig {
  return reetroConfig;
}

/**
 * Get brand colors as CSS variables
 */
export function getBrandCssVariables(config: BrandConfig = reetroConfig): Record<string, string> {
  return {
    '--color-primary': config.colors.primary,
    '--color-primary-foreground': config.colors.primaryForeground,
    '--color-secondary': config.colors.secondary,
    '--color-secondary-foreground': config.colors.secondaryForeground,
    '--color-accent': config.colors.accent,
    '--color-accent-foreground': config.colors.accentForeground,
    '--color-background': config.colors.background,
    '--color-foreground': config.colors.foreground,
    '--color-muted': config.colors.muted,
    '--color-muted-foreground': config.colors.mutedForeground,
    '--color-border': config.colors.border,
    '--color-success': config.colors.success,
    '--color-warning': config.colors.warning,
    '--color-error': config.colors.error,
    '--font-heading': config.fonts.heading,
    '--font-body': config.fonts.body,
  };
}
