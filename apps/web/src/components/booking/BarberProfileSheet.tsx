'use client';

import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/lib/api';
import {
  Star,
  Award,
  Briefcase,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react';
import { STAFF_POSITIONS, cn } from '@/lib/utils';

interface BarberProfileSheetProps {
  staffId: string | null;
  onClose: () => void;
  onSelect: () => void;
}

export default function BarberProfileSheet({ staffId, onClose, onSelect }: BarberProfileSheetProps) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['staff', 'profile', staffId],
    queryFn: () => staffApi.getProfile(staffId!),
    enabled: !!staffId,
  });

  if (!staffId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-300" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-8 duration-500"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#C8A97E]" />
            </div>
          ) : profile ? (
            <div className="space-y-5">
              {/* Hero */}
              <div className="flex items-center gap-4 pt-2">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F0EBE3] shrink-0 border-2 border-[#C8A97E]/20">
                  {profile.user?.avatar ? (
                    <img src={profile.user.avatar} alt={profile.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#C8A97E]">
                      {profile.user?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-[#2C1E12]">{profile.user?.name}</h2>
                  <p className="text-xs text-[#8B7355] font-medium">
                    {STAFF_POSITIONS[profile.position as keyof typeof STAFF_POSITIONS] || profile.position}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3.5 h-3.5',
                            i < Math.round(profile.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-[#2C1E12]">{profile.rating?.toFixed(1) || '5.0'}</span>
                    <span className="text-[11px] text-[#8B7355]">({profile.totalReviews || 0})</span>
                  </div>
                </div>
              </div>

              {/* Experience + Bio */}
              <div className="space-y-3">
                {profile.experience && (
                  <div className="flex items-center gap-2 text-sm text-[#5C4A32]">
                    <Briefcase className="w-4 h-4 text-[#C8A97E]" />
                    <span className="font-medium">{profile.experience} năm kinh nghiệm</span>
                  </div>
                )}
                {profile.bio && (
                  <p className="text-sm text-[#5C4A32] leading-relaxed">{profile.bio}</p>
                )}
                {profile.longDescription && (
                  <p className="text-sm text-[#8B7355] leading-relaxed">{profile.longDescription}</p>
                )}
              </div>

              {/* Specialties */}
              {profile.specialties?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C8A97E]" /> Chuyên môn
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map((s: string) => (
                      <span key={s} className="px-3 py-1.5 rounded-full bg-[#C8A97E]/10 text-[#C8A97E] text-xs font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {profile.gallery?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#C8A97E]" /> Tác phẩm
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {profile.gallery.slice(0, 6).map((url: string, i: number) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-[#E8E0D4]">
                        <img src={url} alt={`work-${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {profile.achievements?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <Award className="w-3.5 h-3.5 text-[#C8A97E]" /> Thành tích
                  </h3>
                  <div className="space-y-2">
                    {profile.achievements.map((ach: any) => (
                      <div key={ach.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E0D4]">
                        <span className="text-lg">{ach.icon || '🏆'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2C1E12]">{ach.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {ach.year && <span className="text-[10px] font-semibold text-[#C8A97E] bg-[#C8A97E]/10 px-1.5 py-0.5 rounded">{ach.year}</span>}
                            {ach.description && <span className="text-[11px] text-[#8B7355] truncate">{ach.description}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state if no profile data at all */}
              {!profile.bio && !profile.longDescription && !profile.specialties?.length && !profile.gallery?.length && !profile.achievements?.length && (
                <div className="text-center py-6 text-[#8B7355]">
                  <p className="text-sm">Thợ chưa cập nhật hồ sơ chi tiết</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Bottom CTA */}
        <div className="px-6 py-4 border-t border-[#E8E0D4] bg-white">
          <button
            onClick={onSelect}
            className="w-full py-3.5 rounded-xl bg-[#C8A97E] text-white font-bold text-sm hover:bg-[#B8975E] active:scale-[0.98] transition-all shadow-sm"
          >
            Chọn thợ này
          </button>
        </div>
      </div>
    </div>
  );
}
