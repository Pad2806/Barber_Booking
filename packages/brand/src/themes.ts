import type { BrandConfig } from './config';

/**
 * Theme configuration for light/dark modes
 */
export interface ThemeConfig {
  name: 'light' | 'dark';
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

/**
 * Light theme based on brand config
 */
export function getLightTheme(brand: BrandConfig): ThemeConfig {
  return {
    name: 'light',
    colors: {
      background: '#ffffff',
      foreground: brand.colors.foreground,
      card: '#ffffff',
      cardForeground: brand.colors.foreground,
      primary: brand.colors.primary,
      primaryForeground: brand.colors.primaryForeground,
      secondary: '#f4f4f5',
      secondaryForeground: brand.colors.foreground,
      muted: brand.colors.muted,
      mutedForeground: brand.colors.mutedForeground,
      accent: brand.colors.accent,
      accentForeground: brand.colors.accentForeground,
      border: brand.colors.border,
      input: brand.colors.border,
      ring: brand.colors.primary,
    },
  };
}

/**
 * Dark theme based on brand config
 */
export function getDarkTheme(brand: BrandConfig): ThemeConfig {
  return {
    name: 'dark',
    colors: {
      background: '#0a0a0a',
      foreground: '#fafafa',
      card: '#0a0a0a',
      cardForeground: '#fafafa',
      primary: brand.colors.accent,
      primaryForeground: brand.colors.accentForeground,
      secondary: '#27272a',
      secondaryForeground: '#fafafa',
      muted: '#27272a',
      mutedForeground: '#a1a1aa',
      accent: brand.colors.accent,
      accentForeground: brand.colors.accentForeground,
      border: '#27272a',
      input: '#27272a',
      ring: brand.colors.accent,
    },
  };
}

/**
 * Convert theme to CSS variables
 */
export function themeToCssVariables(theme: ThemeConfig): Record<string, string> {
  return {
    '--background': theme.colors.background,
    '--foreground': theme.colors.foreground,
    '--card': theme.colors.card,
    '--card-foreground': theme.colors.cardForeground,
    '--primary': theme.colors.primary,
    '--primary-foreground': theme.colors.primaryForeground,
    '--secondary': theme.colors.secondary,
    '--secondary-foreground': theme.colors.secondaryForeground,
    '--muted': theme.colors.muted,
    '--muted-foreground': theme.colors.mutedForeground,
    '--accent': theme.colors.accent,
    '--accent-foreground': theme.colors.accentForeground,
    '--border': theme.colors.border,
    '--input': theme.colors.input,
    '--ring': theme.colors.ring,
  };
}
