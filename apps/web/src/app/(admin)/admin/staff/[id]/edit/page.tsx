'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EditStaffPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  useEffect(() => {
    router.replace(`/admin/staff?action=edit&id=${staffId}`);
  }, [router, staffId]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}
