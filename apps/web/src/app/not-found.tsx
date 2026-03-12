import React from 'react';

export const dynamic = 'force-dynamic';

export default function NotFound(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-8">Xin lỗi, trang bạn đang tìm kiếm không tồn tại.</p>
      <a href="/" className="bg-[#C8A97E] text-white px-6 py-2 rounded-lg font-bold">
        Về Trang Chủ
      </a>
    </div>
  );
}
