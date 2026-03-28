'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export function Providers({ children }: { children: React.ReactNode }): React.ReactElement {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,   // 5 min — data stays fresh
            gcTime: 10 * 60 * 1000,     // 10 min — keep cache alive
            refetchOnWindowFocus: false,
            // Do NOT retry on client errors (4xx incl. 429 Too Many Requests)
            // Only retry on server errors (5xx) or network failures
            retry: (failureCount, error: any) => {
              const status = error?.response?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
          },
        },
      })
  );


  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AntdRegistry>
          {children}
        </AntdRegistry>
      </QueryClientProvider>
    </SessionProvider>
  );
}
