'use client';

import React from 'react';

export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">500 - Lỗi máy chủ</h1>
      <p className="text-gray-600 mb-8">Có lỗi phát sinh. Vui lòng thử lại sau.</p>
      <button 
        onClick={() => reset()}
        className="bg-[#C8A97E] text-white px-6 py-2 rounded-lg font-bold"
      >
        Thử lại
      </button>
    </div>
  );
}
