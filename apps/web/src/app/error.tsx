'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-4xl font-black text-[#2C1E12] mb-4 italic">500 <span className="text-[#C8A97E]">SYSTEM ERROR</span></h2>
      <p className="text-[#8B7355] mb-8 font-serif italic">Đã có lỗi xảy ra. Chúng tôi đang xử lý ngay!</p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-8 py-3 bg-[#1A1A1A] text-white rounded-xl font-bold hover:bg-black transition-all"
        >
          Thử lại
        </button>
        <Link 
          href="/" 
          className="px-8 py-3 bg-[#C8A97E] text-white rounded-xl font-bold hover:bg-[#B8975E] transition-all"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
