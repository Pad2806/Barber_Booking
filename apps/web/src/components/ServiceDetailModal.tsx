'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Play, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = service.videoUrl ? getYoutubeId(service.videoUrl) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="relative h-64 sm:h-80 bg-gray-900">
          {activeTab === 'video' && videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="relative w-full h-full">
              {allImages.length > 0 ? (
                <>
                  <Image
                    src={allImages[currentImageIndex]}
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                  {allImages.length > 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4">
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                        className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                        className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 backdrop-blur-sm"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                  {/* Dots */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {allImages.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          i === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-sm z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tab Switcher */}
          {service.videoUrl && allImages.length > 0 && (
            <div className="absolute top-4 left-4 flex gap-1 p-1 bg-black/40 rounded-lg backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('video')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === 'video' ? "bg-white text-gray-900" : "text-white hover:bg-white/10"
                )}
              >
                <Play className="w-4 h-4" />
                Video
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === 'gallery' ? "bg-white text-gray-900" : "text-white hover:bg-white/10"
                )}
              >
                <ImageIcon className="w-4 h-4" />
                Ảnh
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900">{service.name}</h2>
              <div className="flex items-center gap-4 mt-1 text-gray-500 text-sm">
                <span className="flex items-center gap-1">⏱ {service.duration} phút</span>
                <span>•</span>
                <span className="text-accent font-bold text-lg">{formatPrice(service.price)}</span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {service.description || 'Không có mô tả cho dịch vụ này.'}
          </p>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
            {onSelect && (
              <button
                onClick={() => {
                  onSelect();
                  onClose();
                }}
                className={cn(
                  "flex-1 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-accent/20",
                  isSelected 
                    ? "bg-gray-200 text-gray-600" 
                    : "bg-accent text-white hover:bg-accent/90"
                )}
              >
                {isSelected ? 'Đã chọn' : 'Chọn dịch vụ'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
