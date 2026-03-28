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
      { source: '/admin', destination: '/dashboard', permanent: false },
      { source: '/admin/:path*', destination: '/dashboard/:path*', permanent: false },
      { source: '/barber', destination: '/dashboard', permanent: false },
      { source: '/barber/dashboard', destination: '/dashboard', permanent: false },
      { source: '/barber/schedule', destination: '/dashboard/my-schedule', permanent: false },
      { source: '/barber/bookings', destination: '/dashboard/my-bookings', permanent: false },
      { source: '/cashier', destination: '/dashboard', permanent: false },
      { source: '/cashier/dashboard', destination: '/dashboard', permanent: false },
      { source: '/cashier/online-bookings', destination: '/dashboard/online-bookings', permanent: false },
      { source: '/cashier/walk-in', destination: '/dashboard/walk-in', permanent: false },
      { source: '/cashier/appointments', destination: '/dashboard/appointments', permanent: false },
      { source: '/cashier/checkout', destination: '/dashboard/checkout', permanent: false },
      { source: '/cashier/revenue', destination: '/dashboard/revenue', permanent: false },
      { source: '/cashier/queue', destination: '/dashboard/appointments', permanent: false },
      { source: '/manager', destination: '/dashboard', permanent: false },
      { source: '/manager/dashboard', destination: '/dashboard', permanent: false },
      { source: '/manager/staff', destination: '/dashboard/staff', permanent: false },
      { source: '/manager/staff/:id', destination: '/dashboard/staff/:id', permanent: false },
      { source: '/manager/bookings', destination: '/dashboard/bookings', permanent: false },
      { source: '/manager/schedule', destination: '/dashboard/schedule', permanent: false },
      { source: '/manager/leave-requests', destination: '/dashboard/leave-requests', permanent: false },
      { source: '/manager/revenue', destination: '/dashboard/revenue', permanent: false },
      { source: '/manager/reviews', destination: '/dashboard/reviews', permanent: false },
    ];
  },

};

export default nextConfig;
