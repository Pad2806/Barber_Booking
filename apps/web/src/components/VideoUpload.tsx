'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Video, Link2 } from 'lucide-react';
import { uploadApi, type UploadFolder } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: UploadFolder;
  className?: string;
  disabled?: boolean;
}

const MAX_SIZE_MB = 50;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

export default function VideoUpload({
  value,
  onChange,
  folder = 'services',
  className,
  disabled = false,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [linkInput, setLinkInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Chỉ hỗ trợ MP4, WebM, MOV, AVI');
      return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Dung lượng tối đa ${MAX_SIZE_MB}MB`);
      return false;
    }
    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) return;

    try {
      setUploading(true);
      setProgress(10);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const result = await uploadApi.uploadVideo(file, folder);
      clearInterval(progressInterval);
      setProgress(100);

      onChange(result.url);
      toast.success('Tải video thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Tải video thất bại');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

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

  const handleLinkSubmit = () => {
    if (!linkInput.trim()) return;
    onChange(linkInput.trim());
    setLinkInput('');
    toast.success('Đã gắn link video!');
  };

  const handleRemove = () => {
    onChange('');
  };

  const isYoutubeUrl = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

  return (
    <div className={cn('space-y-3', className)}>
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-black">
          {isYoutubeUrl(value) ? (
            <iframe
              src={value.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
              className="w-full h-[200px]"
              allowFullScreen
              title="Video preview"
            />
          ) : (
            <video
              src={value}
              controls
              className="w-full h-[200px] object-contain"
              preload="metadata"
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              Xóa video
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Mode Tabs */}
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all',
                mode === 'upload'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              Tải lên
            </button>
            <button
              type="button"
              onClick={() => setMode('link')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all',
                mode === 'link'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Link2 className="w-3.5 h-3.5" />
              Dán link
            </button>
          </div>

          {mode === 'upload' ? (
            <div
              onClick={() => !disabled && !uploading && inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                dragOver ? 'border-accent bg-accent/5' : 'border-gray-300 hover:border-accent/50',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-sm text-gray-500">Đang tải video lên...</p>
                  <div className="w-full max-w-[200px] bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{progress}%</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Video className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600 font-medium">
                    Kéo thả hoặc nhấp để chọn video
                  </p>
                  <p className="text-xs text-gray-400">
                    MP4, WebM, MOV, AVI • Tối đa {MAX_SIZE_MB}MB
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleLinkSubmit())}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="https://youtube.com/watch?v=... hoặc link Cloudinary"
                disabled={disabled}
              />
              <button
                type="button"
                onClick={handleLinkSubmit}
                disabled={!linkInput.trim() || disabled}
                className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors shrink-0"
              >
                Gắn
              </button>
            </div>
          )}
        </>
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
