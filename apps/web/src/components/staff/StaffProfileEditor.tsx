'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/lib/api';
import {
  ArrowLeft,
  Star,
  Award,
  Plus,
  Trash2,
  Save,
  Loader2,
  Image as ImageIcon,
  X,
  Briefcase,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { STAFF_POSITIONS, cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import ImageUpload from '@/components/ImageUpload';

interface StaffProfileEditorProps {
  staffId: string;
  onBack: () => void;
  basePath: 'admin' | 'manager';
}

export default function StaffProfileEditor({ staffId, onBack, basePath }: StaffProfileEditorProps) {
  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', 'profile', staffId],
    queryFn: () => staffApi.getProfile(staffId),
  });

  // Profile form state
  const [bio, setBio] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [experience, setExperience] = useState<number | ''>('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Achievement form
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [achTitle, setAchTitle] = useState('');
  const [achYear, setAchYear] = useState<number | ''>(new Date().getFullYear());
  const [achDesc, setAchDesc] = useState('');
  const [achIcon, setAchIcon] = useState('🏆');

  // Initialize form when data loads
  if (staff && !isInitialized) {
    setBio(staff.bio || '');
    setLongDescription(staff.longDescription || '');
    setSpecialties(staff.specialties || []);
    setExperience(staff.experience || '');
    setGallery(staff.gallery || []);
    setIsInitialized(true);
  }

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => staffApi.updateProfile(staffId, data),
    onSuccess: () => {
      toast.success('Đã cập nhật hồ sơ');
      queryClient.invalidateQueries({ queryKey: ['staff', 'profile', staffId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi cập nhật'),
  });

  const addAchievementMutation = useMutation({
    mutationFn: (data: any) => staffApi.addAchievement(staffId, data),
    onSuccess: () => {
      toast.success('Đã thêm thành tích');
      setShowAchievementForm(false);
      setAchTitle(''); setAchDesc(''); setAchYear(new Date().getFullYear()); setAchIcon('🏆');
      queryClient.invalidateQueries({ queryKey: ['staff', 'profile', staffId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi thêm thành tích'),
  });

  const deleteAchievementMutation = useMutation({
    mutationFn: (achievementId: string) => staffApi.deleteAchievement(achievementId),
    onSuccess: () => {
      toast.success('Đã xóa thành tích');
      queryClient.invalidateQueries({ queryKey: ['staff', 'profile', staffId] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi xóa'),
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      bio,
      longDescription,
      specialties,
      experience: experience === '' ? null : Number(experience),
      gallery,
    });
  };

  const handleAddSpecialty = () => {
    const trimmed = newSpecialty.trim();
    if (trimmed && !specialties.includes(trimmed)) {
      setSpecialties([...specialties, trimmed]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (s: string) => {
    setSpecialties(specialties.filter(x => x !== s));
  };

  const handleAddAchievement = () => {
    if (!achTitle.trim()) return;
    addAchievementMutation.mutate({
      title: achTitle.trim(),
      year: achYear === '' ? undefined : Number(achYear),
      description: achDesc.trim() || undefined,
      icon: achIcon || '🏆',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ICON_OPTIONS = ['🏆', '🥇', '🎖️', '⭐', '💈', '✂️', '🎓', '📜', '💎', '🔥'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-xl h-10 w-10 border-slate-200">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 italic font-heading">
              Hồ Sơ Giới Thiệu <Badge className="bg-primary/10 text-primary border-none text-[10px]">STAFF PROFILE</Badge>
            </h1>
            <p className="text-sm text-slate-500 font-medium">Quản lý thông tin giới thiệu cho {staff?.user?.name}</p>
          </div>
        </div>
        <Button
          onClick={handleSaveProfile}
          disabled={updateProfileMutation.isPending}
          className="gap-2 rounded-xl h-10 shadow-lg shadow-primary/20"
        >
          {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu hồ sơ
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Preview Card */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-primary/80 to-primary" />
          <CardContent className="pt-0 -mt-14 flex flex-col items-center text-center px-6 pb-6">
            <Avatar className="h-28 w-28 border-4 border-white shadow-xl mb-4">
              <AvatarImage src={staff?.user?.avatar || ''} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {staff?.user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-slate-900">{staff?.user?.name}</h2>
            <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-none font-bold text-[10px]">
              {STAFF_POSITIONS[staff?.position as keyof typeof STAFF_POSITIONS] || staff?.position}
            </Badge>
            {experience !== '' && (
              <p className="text-xs text-slate-400 mt-2 font-medium">{experience} năm kinh nghiệm</p>
            )}
            <div className="flex items-center gap-1 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn('w-4 h-4', i < Math.round(staff?.rating || 5)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200')}
                />
              ))}
              <span className="text-xs text-slate-500 ml-1">({staff?.totalReviews || 0})</span>
            </div>
            {bio && <p className="text-xs text-slate-500 mt-4 leading-relaxed">{bio}</p>}
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                {specialties.map(s => (
                  <Badge key={s} variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary bg-primary/5">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Thông tin giới thiệu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Mô tả ngắn (Bio)</label>
                <Input
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="VD: Barber chuyên nghiệp với 5 năm kinh nghiệm..."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Mô tả chi tiết</label>
                <Textarea
                  value={longDescription}
                  onChange={e => setLongDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về phong cách, kinh nghiệm, câu chuyện nghề nghiệp..."
                  className="rounded-xl min-h-[120px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Số năm kinh nghiệm</label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={experience}
                    onChange={e => setExperience(e.target.value ? Number(e.target.value) : '')}
                    placeholder="VD: 5"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specialties */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Chuyên môn
              </CardTitle>
              <CardDescription>Thêm các kỹ năng và chuyên môn nổi bật</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {specialties.map(s => (
                  <Badge
                    key={s}
                    className="bg-primary/10 text-primary border-none font-semibold text-xs pr-1.5 gap-1"
                  >
                    {s}
                    <button
                      onClick={() => handleRemoveSpecialty(s)}
                      className="ml-1 hover:text-rose-500 transition-colors rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {specialties.length === 0 && (
                  <p className="text-xs text-slate-300">Chưa có chuyên môn nào</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSpecialty}
                  onChange={e => setNewSpecialty(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                  placeholder="VD: Fade, Pompadour, Dreadlock..."
                  className="rounded-xl flex-1"
                />
                <Button onClick={handleAddSpecialty} size="sm" variant="outline" className="rounded-xl gap-1.5">
                  <Plus className="w-4 h-4" /> Thêm
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gallery */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Gallery tác phẩm
              </CardTitle>
              <CardDescription>Upload ảnh các kiểu tóc đã thực hiện</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {gallery.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-100">
                    <img src={url} alt={`work-${i}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setGallery(gallery.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <ImageUpload
                value=""
                onChange={(url: string) => {
                  if (url) setGallery([...gallery, url]);
                }}
                placeholder="Thêm ảnh tác phẩm"
                folder="gallery"
              />
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="border-b border-slate-50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" /> Thành tích & Chứng chỉ
                  </CardTitle>
                  <CardDescription>Giải thưởng, chứng chỉ, thành tích nổi bật</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl gap-1.5"
                  onClick={() => setShowAchievementForm(!showAchievementForm)}
                >
                  <Plus className="w-4 h-4" /> Thêm
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Add form */}
              {showAchievementForm && (
                <div className="p-4 bg-slate-50 rounded-xl mb-4 space-y-3 border border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      value={achTitle}
                      onChange={e => setAchTitle(e.target.value)}
                      placeholder="Tên thành tích *"
                      className="rounded-xl"
                    />
                    <Input
                      type="number"
                      value={achYear}
                      onChange={e => setAchYear(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Năm"
                      className="rounded-xl"
                    />
                  </div>
                  <Input
                    value={achDesc}
                    onChange={e => setAchDesc(e.target.value)}
                    placeholder="Mô tả (tùy chọn)"
                    className="rounded-xl"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Icon:</span>
                    <div className="flex gap-1.5">
                      {ICON_OPTIONS.map(icon => (
                        <button
                          key={icon}
                          onClick={() => setAchIcon(icon)}
                          className={cn(
                            'w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all',
                            achIcon === icon ? 'bg-primary/10 ring-2 ring-primary scale-110' : 'bg-white border border-slate-100 hover:bg-slate-50',
                          )}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setShowAchievementForm(false)} className="rounded-xl">
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddAchievement}
                      disabled={!achTitle.trim() || addAchievementMutation.isPending}
                      className="rounded-xl gap-1.5"
                    >
                      {addAchievementMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Thêm thành tích
                    </Button>
                  </div>
                </div>
              )}

              {/* Achievement list */}
              {!staff?.achievements?.length && !showAchievementForm ? (
                <div className="text-center py-10 text-slate-300">
                  <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Chưa có thành tích nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staff?.achievements?.map((ach: any) => (
                    <div key={ach.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-lg shrink-0">
                        {ach.icon || '🏆'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900">{ach.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {ach.year && <Badge variant="secondary" className="text-[10px] bg-slate-100 border-none">{ach.year}</Badge>}
                          {ach.description && <p className="text-xs text-slate-400 truncate">{ach.description}</p>}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500"
                        onClick={() => deleteAchievementMutation.mutate(ach.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
