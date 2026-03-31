'use client';

import { useParams, useRouter } from 'next/navigation';
import PaymentModalContent from '@/components/payment/PaymentModalContent';

export default function PaymentModalInterceptor() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  if (!bookingId) return null;

  return (
    <PaymentModalContent
      bookingId={bookingId}
      asModal={true}
      // router.back() → returns to booking page with booking UI still intact
      onClose={() => router.back()}
    />
  );
}
