'use client';

import { ReactNode } from 'react';

interface CustomerLayoutProps {
  children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  return <>{children}</>;
}
