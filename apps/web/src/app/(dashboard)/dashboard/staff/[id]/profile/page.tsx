'use client';

import { useParams, useRouter } from 'next/navigation';
import StaffProfileEditor from '@/components/staff/StaffProfileEditor';

export default function AdminStaffProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  return (
    <StaffProfileEditor
      staffId={id}
      onBack={() => router.push(`/admin/staff/${id}`)}
      basePath="admin"
    />
  );
}
