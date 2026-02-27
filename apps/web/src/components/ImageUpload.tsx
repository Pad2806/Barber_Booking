'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { uploadApi, type UploadFolder } from '@/lib/api';
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

export default function ImageUpload({
  value,
  onChange,
  folder = 'avatars',
  variant = 'default',
  className,
  placeholder,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    try {
      setUploading(true);
      const result = await uploadApi.uploadImage(file, folder);
      onChange(result.url);
      toast.success('Tải ảnh thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  }, [folder, onChange]);

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

  if (variant === 'avatar') {
    return (
      <div className={cn('relative inline-block', className)}>
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
          {value ? (
            <Image
              src={value}
              alt="Avatar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Upload className="w-8 h-8" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white shadow-md hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </button>

        {value && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
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
              <p className="text-sm text-gray-500">Đang tải lên...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600 font-medium">
                {placeholder || 'Kéo thả hoặc nhấp để chọn ảnh'}
              </p>
              <p className="text-xs text-gray-400">
                JPEG, PNG, WebP, GIF • Tối đa {MAX_SIZE_MB}MB
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
