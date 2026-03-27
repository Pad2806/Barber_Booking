'use client';

import dynamic from 'next/dynamic';

const AIChatWidget = dynamic(
  () => import('@/components/chat/AIChatWidget').then(mod => mod.AIChatWidget),
  { ssr: false }
);

const Toaster = dynamic(
  () => import('react-hot-toast').then(mod => mod.Toaster),
  { ssr: false }
);

export function ClientWidgets() {
  return (
    <>
      <Toaster position="top-center" />
      <AIChatWidget />
    </>
  );
}
