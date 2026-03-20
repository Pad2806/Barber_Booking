'use client';

import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api';
import { useEffect } from 'react';

export function useSystemSettings() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => settingsApi.getPublic(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000,
  });

  // Apply primary color as CSS variable
  useEffect(() => {
    if (settings?.primaryColor) {
      document.documentElement.style.setProperty('--color-primary-dynamic', settings.primaryColor);
    }
  }, [settings?.primaryColor]);

  return {
    settings: settings || {},
    isLoading,
    businessName: settings?.businessName || '',
    logo: settings?.logo || '',
    primaryColor: settings?.primaryColor || '#D4A574',
    contactPhone: settings?.contactPhone || '',
    contactEmail: settings?.contactEmail || '',
  };
}
