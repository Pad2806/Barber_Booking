import React from 'react';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { ClientWidgets } from '@/components/client-widgets';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'ReetroBarberShop - Đặt lịch cắt tóc online',
  description: 'Hệ thống đặt lịch cắt tóc chuyên nghiệp. Phong cách - Đẳng cấp - Chất lượng.',
  keywords: ['cắt tóc', 'barber', 'salon', 'đặt lịch', 'reetro'],
  authors: [{ name: 'ReetroBarberShop' }],
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'ReetroBarberShop - Đặt lịch cắt tóc online',
    description: 'Hệ thống đặt lịch cắt tóc chuyên nghiệp',
    type: 'website',
    locale: 'vi_VN',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ReetroBarberShop - The Hidden Barbershop',
      },
    ],
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-body antialiased`}>
        <Providers>
          {children}
          <ClientWidgets />
        </Providers>
      </body>
    </html>
  );
}
