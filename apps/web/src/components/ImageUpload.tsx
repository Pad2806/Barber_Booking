'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Camera, CheckCircle2 } from 'lucide-react';
import { uploadApi, type UploadFolder } from '@/lib/api';
import { compressImage, getBlurPlaceholder } from '@/lib/image-utils';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: UploadFolder;
  variant?: 'avatar' | 'cover' | 'default';
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type UploadPhase = 'idle' | 'compressing' | 'uploading' | 'done';

export default function ImageUpload({
  value,
  onChange,
  folder = 'avatars',
  variant = 'default',
  className,
  placeholder,
  disabled = false,
}: ImageUploadProps) {
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [compressionSaved, setCompressionSaved] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploading = phase === 'compressing' || phase === 'uploading';

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Chỉ hỗ trợ JPEG, PNG, WebP, GIF');
      return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Dung lượng tối đa ${MAX_SIZE_MB}MB`);
      return false;
    }
    return true;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleUpload = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    try {
      // Phase 1: Compress
      setPhase('compressing');
      setCompressionSaved(null);
      const originalSize = file.size;
      const compressed = await compressImage(file, variant);
      const savedPercent = Math.round((1 - compressed.size / originalSize) * 100);

      if (savedPercent > 5) {
        setCompressionSaved(`Đã nén ${formatSize(originalSize)} → ${formatSize(compressed.size)} (-${savedPercent}%)`);
      }

      // Phase 2: Upload
      setPhase('uploading');
      const result = await uploadApi.uploadImage(compressed, folder);
      onChange(result.url);

      // Phase 3: Done
      setPhase('done');
      toast.success(
        savedPercent > 5
          ? `Tải ảnh thành công! Đã nén ${savedPercent}%`
          : 'Tải ảnh thành công!'
      );

      setTimeout(() => {
        setPhase('idle');
        setCompressionSaved(null);
      }, 2000);
    } catch (error: any) {
      setPhase('idle');
      toast.error(error.response?.data?.message || 'Tải ảnh thất bại');
    }
  }, [folder, onChange, variant]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleRemove = () => {
    onChange('');
  };

  const phaseLabel = {
    idle: '',
    compressing: 'Đang nén ảnh...',
    uploading: 'Đang tải lên...',
    done: 'Hoàn tất!',
  };

  // Blur placeholder for existing images
  const blurUrl = value ? getBlurPlaceholder(value) : undefined;

  if (variant === 'avatar') {
    return (
      <div className={cn('relative inline-block', className)}>
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#F0EBE3] border-4 border-white shadow-sm relative group">
          {value ? (
            <Image
              src={value}
              alt="Avatar"
              fill
              className="object-cover transition-all duration-700 group-hover:scale-105"
              sizes="112px"
              placeholder={blurUrl ? 'blur' : 'empty'}
              blurDataURL={blurUrl}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#C8A97E]/40 bg-[#F0EBE3]">
              <Upload className="w-8 h-8" />
            </div>
          )}
          
          <div 
            onClick={() => !disabled && inputRef.current?.click()}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer gap-1"
          >
            {phase === 'compressing' ? (
              <>
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <span className="text-[10px] text-white/80 font-medium">Đang nén...</span>
              </>
            ) : phase === 'uploading' ? (
              <>
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <span className="text-[10px] text-white/80 font-medium">Đang tải...</span>
              </>
            ) : phase === 'done' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </div>
        </div>

        {value && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-red-600 transition-all active:scale-90 z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {compressionSaved && (
          <p className="text-[10px] text-emerald-600 font-medium mt-2 text-center animate-in fade-in slide-in-from-bottom-1 duration-300">
            {compressionSaved}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200">
          <Image
            src={value}
            alt="Uploaded"
            width={400}
            height={variant === 'cover' ? 200 : 300}
            className={cn(
              'w-full object-cover',
              variant === 'cover' ? 'h-[200px]' : 'h-auto max-h-[300px]',
            )}
            placeholder={blurUrl ? 'blur' : 'empty'}
            blurDataURL={blurUrl}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              Đổi ảnh
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              Xóa
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            dragOver ? 'border-accent bg-accent/5' : 'border-gray-300 hover:border-accent/50',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-sm text-gray-500 font-medium">{phaseLabel[phase]}</p>
              {compressionSaved && (
                <p className="text-xs text-emerald-600 font-medium animate-in fade-in duration-300">
                  {compressionSaved}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600 font-medium">
                {placeholder || 'Kéo thả hoặc nhấp để chọn ảnh'}
              </p>
              <p className="text-xs text-gray-400">
                JPEG, PNG, WebP, GIF • Tối đa {MAX_SIZE_MB}MB • Tự động nén
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
