'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

/**
 * /my-bookings/[bookingId] standalone page.
 * We no longer render a full page here — everything is shown via BookingDetailSheet
 * on the /my-bookings list page. Redirect there with ?detail= so the sheet auto-opens.
 */
export default function BookingDetailRedirectPage() {
  const params = useParams();
  const bookingId = params?.bookingId as string;

  useEffect(() => {
    if (bookingId) {
      window.location.replace(`/my-bookings?detail=${bookingId}`);
    }
  }, [bookingId]);

  return null;
}
