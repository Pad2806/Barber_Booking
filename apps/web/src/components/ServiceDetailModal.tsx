'use client';

import { useState } from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import { X, Play, Image as ImageIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Service } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

interface ServiceDetailModalProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export default function ServiceDetailModal({
  service,
  isOpen,
  onClose,
  onSelect,
  isSelected,
}: ServiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'gallery'>(
    service.videoUrl ? 'video' : 'gallery'
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen) return null;

  const allImages = [service.image, ...(service.gallery || [])].filter(Boolean) as string[];

  // Helper to extract Youtube ID
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = service.videoUrl ? getYoutubeId(service.videoUrl) : null;

  // Detect if videoUrl is an uploaded file (not YouTube)
  const isUploadedVideo = service.videoUrl && !videoId;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header Media Section */}
        <div className="relative h-72 sm:h-96 bg-gray-900 group">
          {activeTab === 'video' && videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : activeTab === 'video' && isUploadedVideo ? (
            /* ── Uploaded video (Cloudinary / S3 / direct URL) ── */
            <video
              key={service.videoUrl}
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              playsInline
              preload="metadata"
            >
              <source src={service.videoUrl!} />
              Trình duyệt không hỗ trợ phát video.
            </video>
          ) : (
            <div className="relative w-full h-full group">
              {allImages.length > 0 ? (
                <>
                  {/* Use object-contain so full image is always visible without cropping */}
                  <OptimizedImage
                    src={allImages[currentImageIndex]}
                    alt={service.name}
                    fill
                    className="object-contain transition-opacity duration-500"
                    priority
                    enableBlur
                  />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {allImages.length > 1 && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                        className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md border border-white/30 transition-all active:scale-90"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                        className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md border border-white/30 transition-all active:scale-90"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                  {/* Dots indicator */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === currentImageIndex 
                            ? "bg-white w-8 shadow-lg shadow-white/20" 
                            : "bg-white/40 w-1.5 hover:bg-white/60"
                        )}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4 bg-gray-50">
                  <ImageIcon className="w-16 h-16 opacity-20" />
                  <p className="text-sm font-medium opacity-40">Đang cập nhật hình ảnh...</p>
                </div>
              )}
            </div>
          )}

          {/* Top Controls Overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
            <div className="flex gap-2 pointer-events-auto">
              {service.videoUrl && allImages.length > 0 && (
                <div className="flex p-1 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
                  <button
                    onClick={() => setActiveTab('video')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                      activeTab === 'video' 
                        ? "bg-white text-gray-900 shadow-md scale-100" 
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Play className={cn("w-4 h-4", activeTab === 'video' ? "fill-current" : "")} />
                    Clip Review
                  </button>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                      activeTab === 'gallery' 
                        ? "bg-white text-gray-900 shadow-md scale-100" 
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Hình mẫu
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-white hover:text-gray-900 text-white rounded-full backdrop-blur-xl border border-white/10 shadow-xl transition-all active:scale-90 pointer-events-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Content Section */}
        <div className="p-8 pb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent tracking-widest uppercase">
                  {service.category}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                  ⏱ {service.duration} phút thực hiện
                </span>
              </div>
              <h2 className="text-3xl font-heading font-black text-gray-900 tracking-tight">{service.name}</h2>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black text-accent drop-shadow-sm">
                {formatPrice(service.price)}
              </span>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">Giá dịch vụ trọn gói</span>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 mb-10">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
               Chi tiết dịch vụ
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
              {service.description || 'Barber của chúng tôi sẽ tư vấn phong cách phù hợp nhất với khuôn mặt và chất tóc của bạn.'}
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={onClose}
              className="px-8 py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
            >
              Quay lại
            </button>
            {onSelect && (
              <button
                onClick={() => {
                  onSelect();
                  onClose();
                }}
                className={cn(
                  "flex-1 px-8 py-4 rounded-2xl font-black transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3",
                  isSelected 
                    ? "bg-gray-100 text-gray-400 shadow-none" 
                    : "bg-gradient-to-r from-accent to-accent/80 text-white shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5"
                )}
              >
                {isSelected ? (
                  <>
                    <Check className="w-5 h-5" />
                    Đã thêm vào lịch
                  </>
                ) : (
                  <>
                    Thêm vào lịch hẹn
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
