import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'ReetroBarberShop - Đặt lịch cắt tóc online',
  description: 'Hệ thống đặt lịch cắt tóc chuyên nghiệp. Phong cách - Đẳng cấp - Chất lượng.',
  keywords: ['cắt tóc', 'barber', 'salon', 'đặt lịch', 'reetro'],
  authors: [{ name: 'ReetroBarberShop' }],
  openGraph: {
    title: 'ReetroBarberShop - Đặt lịch cắt tóc online',
    description: 'Hệ thống đặt lịch cắt tóc chuyên nghiệp',
    type: 'website',
    locale: 'vi_VN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-body antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
