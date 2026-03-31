'use client';

import { useRouter } from 'next/navigation';
import PaymentModalContent from '@/components/payment/PaymentModalContent';

interface Props {
  params: { bookingId: string };
}

export default function PaymentModalInterceptor({ params }: Props) {
  const router = useRouter();

  return (
    <PaymentModalContent
      bookingId={params.bookingId}
      asModal={true}
      // router.back() → returns to booking page with booking UI still intact
      onClose={() => router.back()}
    />
  );
}
