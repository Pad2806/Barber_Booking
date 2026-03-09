'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, Plus } from 'lucide-react';
import { uploadApi, type UploadFolder } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: UploadFolder;
  className?: string;
  maxImages?: number;
  disabled?: boolean;
}

const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function MultiImageUpload({
  value = [],
  onChange,
  folder = 'services',
  className,
  maxImages = 10,
  disabled = false,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
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

  const handleUpload = useCallback(async (files: FileList) => {
    if (value.length >= maxImages) {
      toast.error(`Chỉ được tải lên tối đa ${maxImages} ảnh`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, maxImages - value.length);
    
    setUploading(true);
    const newUrls = [...value];

    try {
      for (const file of filesToUpload) {
        if (validateFile(file)) {
          const result = await uploadApi.uploadImage(file, folder);
          newUrls.push(result.url);
        }
      }
      onChange(newUrls);
      toast.success('Tải ảnh thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  }, [folder, maxImages, onChange, value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleUpload(e.target.files);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (index: number) => {
    const nextValue = value.filter((_, i) => i !== index);
    onChange(nextValue);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {value.map((url, index) => (
          <div key={url} className="relative aspect-square group rounded-xl overflow-hidden border">
            <Image
              src={url}
              alt={`Gallery ${index}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => !disabled && !uploading && inputRef.current?.click()}
            disabled={disabled || uploading}
            className={cn(
              'aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors',
              'border-gray-300 hover:border-accent/50 hover:bg-accent/5',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500">Thêm ảnh</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
