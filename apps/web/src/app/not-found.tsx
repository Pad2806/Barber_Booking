import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-4xl font-black text-[#2C1E12] mb-4 italic">404 <span className="text-[#C8A97E]">NOT FOUND</span></h2>
      <p className="text-[#8B7355] mb-8 font-serif italic">Trang bạn tìm kiếm không tồn tại hoặc đã bị dời đi.</p>
      <Link 
        href="/" 
        className="px-8 py-3 bg-[#C8A97E] text-white rounded-xl font-bold hover:bg-[#B8975E] transition-all"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
