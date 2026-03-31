'use client';

import { useParams, useRouter } from 'next/navigation';
import PaymentModalContent from '@/components/payment/PaymentModalContent';

/**
 * Full-page fallback for /payment/[bookingId]
 * Used when user visits the URL directly (email link, Zalo, refresh, etc.)
 * When navigating FROM booking page, the @modal interceptor takes over instead.
 */
export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  return (
    <PaymentModalContent
      bookingId={bookingId}
      asModal={false}
      // Full page: go home on close
      onClose={() => router.replace('/')}
    />
  );
}
