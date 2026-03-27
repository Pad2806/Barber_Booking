import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  transpilePackages: ['@reetro/shared', '@reetro/brand'],
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'img.vietqr.io' },
      { protocol: 'https', hostname: 'reetrobarber.pages.dev' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  typescript: { ignoreBuildErrors: true },

  async redirects() {
    return [
      { source: '/admin', destination: '/dashboard', permanent: true },
      { source: '/admin/:path*', destination: '/dashboard/:path*', permanent: true },
      { source: '/barber', destination: '/dashboard', permanent: true },
      { source: '/barber/dashboard', destination: '/dashboard', permanent: true },
      { source: '/barber/schedule', destination: '/dashboard/my-schedule', permanent: true },
      { source: '/barber/bookings', destination: '/dashboard/my-bookings', permanent: true },
      { source: '/cashier', destination: '/dashboard', permanent: true },
      { source: '/cashier/dashboard', destination: '/dashboard', permanent: true },
      { source: '/cashier/online-bookings', destination: '/dashboard/online-bookings', permanent: true },
      { source: '/cashier/walk-in', destination: '/dashboard/walk-in', permanent: true },
      { source: '/cashier/appointments', destination: '/dashboard/appointments', permanent: true },
      { source: '/cashier/checkout', destination: '/dashboard/checkout', permanent: true },
      { source: '/cashier/revenue', destination: '/dashboard/revenue', permanent: true },
      { source: '/cashier/queue', destination: '/dashboard/appointments', permanent: true },
      { source: '/manager', destination: '/dashboard', permanent: true },
      { source: '/manager/dashboard', destination: '/dashboard', permanent: true },
      { source: '/manager/staff', destination: '/dashboard/staff', permanent: true },
      { source: '/manager/staff/:id', destination: '/dashboard/staff/:id', permanent: true },
      { source: '/manager/bookings', destination: '/dashboard/bookings', permanent: true },
      { source: '/manager/schedule', destination: '/dashboard/schedule', permanent: true },
      { source: '/manager/leave-requests', destination: '/dashboard/leave-requests', permanent: true },
      { source: '/manager/revenue', destination: '/dashboard/revenue', permanent: true },
      { source: '/manager/reviews', destination: '/dashboard/reviews', permanent: true },
    ];
  },
};

export default nextConfig;
