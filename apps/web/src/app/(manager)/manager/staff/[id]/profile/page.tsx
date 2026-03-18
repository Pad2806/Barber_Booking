'use client';

import { useParams, useRouter } from 'next/navigation';
import StaffProfileEditor from '@/components/staff/StaffProfileEditor';

export default function ManagerStaffProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  return (
    <StaffProfileEditor
      staffId={id}
      onBack={() => router.push(`/manager/staff/${id}`)}
      basePath="manager"
    />
  );
}
