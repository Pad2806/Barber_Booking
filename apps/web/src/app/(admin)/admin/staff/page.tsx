'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  X,
  MapPin,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  User2,
} from 'lucide-react';
import { STAFF_POSITIONS, cn } from '@/lib/utils';
import { adminApi, salonApi, type Salon } from '@/lib/api';
import toast from 'react-hot-toast';

interface Staff {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  avatar: string | null;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  salon: { id: string; name: string };
  isActive: boolean;
}

type PanelStaffDetail = {
  id: string;
  position: string;
  salonId: string;
  isActive: boolean;
  user: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string | null;
  };
  salon?: {
    id: string;
    name: string;
    address?: string | null;
  } | null;
  rating?: number | null;
  totalReviews?: number | null;
  totalBookings?: number | null;
};

type PanelMode = 'create' | 'edit' | 'view';

export default function AdminStaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>('create');
  const [panelStaffId, setPanelStaffId] = useState<string | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelSubmitting, setPanelSubmitting] = useState(false);
  const [panelStaff, setPanelStaff] = useState<PanelStaffDetail | null>(null);

  const [salons, setSalons] = useState<Salon[]>([]);
  const [salonsLoading, setSalonsLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ staffId: string; staffName: string } | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    position: 'SENIOR_STYLIST',
    salonId: '',
    password: '',
    isActive: true,
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'new') {
      openCreatePanel(false);
      return;
    }

    if (action === 'edit' && id) {
      openEditPanel(id, false);
      return;
    }

    if (action === 'view' && id) {
      openViewPanel(id, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllStaff({ take: 100 });
      setStaff((data.data || []) as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const ensureSalonsLoaded = async () => {
    if (salonsLoading || salons.length > 0) return;

    try {
      setSalonsLoading(true);
      const data = await salonApi.getAll({ limit: 100 });
      setSalons(data.data || []);
    } catch {
      toast.error('Không thể tải danh sách salon');
    } finally {
      setSalonsLoading(false);
    }
  };

  const closePanel = () => {
    setPanelOpen(false);
    setPanelLoading(false);
    setPanelSubmitting(false);
    setPanelStaffId(null);
    setPanelStaff(null);
    setSelectedStaff(null);
    router.replace('/admin/staff');
  };

  const openCreatePanel = async (pushUrl: boolean = true) => {
    setSelectedStaff(null);
    setPanelMode('create');
    setPanelOpen(true);
    setPanelStaffId(null);
    setPanelStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      avatar: '',
      position: 'SENIOR_STYLIST',
      salonId: '',
      password: '',
      isActive: true,
    });
    await ensureSalonsLoaded();

    if (pushUrl) router.push('/admin/staff?action=new');
  };

  const openEditPanel = async (staffId: string, pushUrl: boolean = true) => {
    setSelectedStaff(null);
    setPanelMode('edit');
    setPanelOpen(true);
    setPanelStaffId(staffId);
    setPanelStaff(null);

    await ensureSalonsLoaded();

    try {
      setPanelLoading(true);
      const staffData = (await adminApi.getStaffById(staffId)) as any as PanelStaffDetail;
      setPanelStaff(staffData);
      setFormData({
        name: staffData.user?.name || '',
        email: staffData.user?.email || '',
        phone: staffData.user?.phone || '',
        avatar: staffData.user?.avatar || '',
        position: staffData.position || 'SENIOR_STYLIST',
        salonId: staffData.salonId || '',
        password: '',
        isActive: staffData.isActive ?? true,
      });
    } catch {
      toast.error('Không thể tải thông tin nhân viên');
      closePanel();
      return;
    } finally {
      setPanelLoading(false);
    }

    if (pushUrl) router.push(`/admin/staff?action=edit&id=${staffId}`);
  };

  const openViewPanel = async (staffId: string, pushUrl: boolean = true) => {
    setSelectedStaff(null);
    setPanelMode('view');
    setPanelOpen(true);
    setPanelStaffId(staffId);
    setPanelStaff(null);

    try {
      setPanelLoading(true);
      const staffData = (await adminApi.getStaffById(staffId)) as any as PanelStaffDetail;
      setPanelStaff(staffData);
    } catch {
      toast.error('Không thể tải thông tin nhân viên');
      closePanel();
      return;
    } finally {
      setPanelLoading(false);
    }

    if (pushUrl) router.push(`/admin/staff?action=view&id=${staffId}`);
  };

  const handleDelete = async (staffId: string, staffName: string) => {
    setDeleteConfirm({ staffId, staffName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { staffId } = deleteConfirm;

    try {
      setDeleting(staffId);
      setSelectedStaff(null);

      setDeleteConfirm(null);

      // Get full staff data to retrieve user ID
      const staffData = await adminApi.getStaffById(staffId);
      const userId = (staffData as any).user?.id;

      if (!userId) {
        throw new Error('Không tìm thấy user ID');
      }

      await adminApi.deleteStaff(userId);
      toast.success('Xóa nhân viên thành công!');

      // Refresh staff list
      await fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xóa nhân viên thất bại');
    } finally {
      setDeleting(null);
    }
  };

  const filteredStaff = useMemo(() => {
    const lower = search.toLowerCase();
    return staff.filter(
      s =>
        s.name?.toLowerCase().includes(lower) ||
        s.phone?.includes(search) ||
        s.email?.toLowerCase().includes(lower)
    );
  }, [staff, search]);

  const handlePanelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (panelMode === 'view') return;

    if (panelMode === 'create') {
      if (
        !formData.name ||
        !formData.email ||
        !formData.phone ||
        !formData.salonId ||
        !formData.password
      ) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      try {
        setPanelSubmitting(true);
        await adminApi.createStaff({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          ...(formData.avatar ? { avatar: formData.avatar } : {}),
          position: formData.position,
          salonId: formData.salonId,
          password: formData.password,
        });
        toast.success('Tạo nhân viên thành công!');
        closePanel();
        await fetchStaff();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Tạo nhân viên thất bại');
      } finally {
        setPanelSubmitting(false);
      }

      return;
    }

    // edit mode
    if (!panelStaff) return;
    if (!formData.name || !formData.email || !formData.salonId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setPanelSubmitting(true);

      const changedData: any = {};
      if (formData.name !== panelStaff.user?.name) changedData.name = formData.name;
      if (formData.email !== panelStaff.user?.email) changedData.email = formData.email;
      if (formData.phone !== panelStaff.user?.phone) changedData.phone = formData.phone;
      if ((formData.avatar || '') !== (panelStaff.user?.avatar || ''))
        changedData.avatar = formData.avatar;
      if (formData.position !== panelStaff.position) changedData.position = formData.position;
      if (formData.salonId !== panelStaff.salonId) changedData.salonId = formData.salonId;
      if (formData.isActive !== panelStaff.isActive) changedData.isActive = formData.isActive;

      if (Object.keys(changedData).length === 0) {
        toast.success('Không có thay đổi nào để lưu');
        return;
      }

      await adminApi.updateStaff(panelStaff.user.id, changedData);
      toast.success('Cập nhật nhân viên thành công!');
      closePanel();
      await fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật nhân viên thất bại');
    } finally {
      setPanelSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchStaff}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-800">Quản lý nhân viên</h1>
          <p className="text-gray-500">Quản lý thông tin nhân viên và stylist</p>
        </div>
        <button
          type="button"
          onClick={() => openCreatePanel(true)}
          className="bg-accent text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm nhân viên
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, SĐT, email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(member => (
          <div key={member.id} className="bg-white rounded-xl p-6 shadow-sm relative">
            {/* Actions Menu */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSelectedStaff(selectedStaff === member.id ? null : member.id)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>

              {selectedStaff === member.id && (
                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => openViewPanel(member.id, true)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full"
                  >
                    <Eye className="w-4 h-4" />
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditPanel(member.id, true)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full"
                  >
                    <Edit className="w-4 h-4" />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    disabled={deleting === member.id}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm w-full text-red-600 disabled:opacity-50"
                  >
                    {deleting === member.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang xóa...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Avatar & Info */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center">
                {member.avatar ? (
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-accent">{member.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{member.name}</h3>
                <p className="text-sm text-accent">
                  {STAFF_POSITIONS[member.position] || member.position}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <span className="font-bold">
                    {Number.isFinite(Number(member.rating))
                      ? Math.min(5, Math.max(0, Number(member.rating))).toFixed(1)
                      : 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{member.totalReviews} đánh giá</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="font-bold text-gray-800">{member.totalBookings}</p>
                <p className="text-xs text-gray-500">Đặt lịch</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="font-bold text-gray-800 truncate text-xs">
                  {member.salon?.name || '-'}
                </p>
                <p className="text-xs text-gray-500">Chi nhánh</p>
              </div>
            </div>

            {/* Contact */}
            <div className="text-sm text-gray-500 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{member.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{member.email || '-'}</span>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span
                className={cn(
                  'text-sm font-medium flex items-center gap-2',
                  member.isActive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {member.isActive ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                {member.isActive ? 'Đang hoạt động' : 'Tạm nghỉ'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
              <User2 className="w-7 h-7 text-gray-400" />
            </div>
          </div>
          <p className="text-gray-500">Không tìm thấy nhân viên nào</p>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận xoá</h3>
              <p className="text-sm text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa nhân viên{' '}
                <span className="font-medium">&quot;{deleteConfirm.staffName}&quot;</span>? Hành
                động này không thể hoàn tác.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting === deleteConfirm.staffId}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {deleting === deleteConfirm.staffId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit/View panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closePanel} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-lg border-l overflow-y-auto">
            <div className="p-6 border-b flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-heading font-bold text-gray-800">
                  {panelMode === 'create'
                    ? 'Thêm nhân viên'
                    : panelMode === 'edit'
                      ? 'Chỉnh sửa nhân viên'
                      : 'Thông tin nhân viên'}
                </h2>
                <p className="text-sm text-gray-500">
                  {panelMode === 'create'
                    ? 'Tạo tài khoản nhân viên mới'
                    : panelMode === 'edit'
                      ? 'Cập nhật thông tin nhân viên'
                      : 'Chi tiết thông tin nhân viên'}
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {panelLoading ? (
              <div className="p-6 flex items-center justify-center min-h-[240px]">
                <Loader2 className="w-7 h-7 animate-spin text-accent" />
              </div>
            ) : panelMode === 'view' ? (
              <div className="p-6 space-y-6">
                {!panelStaff ? (
                  <div className="flex items-center justify-center min-h-[240px]">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center">
                        {panelStaff.user?.avatar ? (
                          <Image
                            src={panelStaff.user.avatar}
                            alt={panelStaff.user?.name || 'staff'}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-accent">
                            {(panelStaff.user?.name || 'N').charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {panelStaff.user?.name || 'N/A'}
                        </h3>
                        <p className="text-sm text-accent">
                          {STAFF_POSITIONS[panelStaff.position as keyof typeof STAFF_POSITIONS] ||
                            panelStaff.position}
                        </p>
                        <span
                          className={cn(
                            'inline-flex mt-2 px-3 py-1 rounded-full text-sm',
                            panelStaff.isActive
                              ? 'bg-green-50 text-green-600'
                              : 'bg-red-50 text-red-600'
                          )}
                        >
                          {panelStaff.isActive ? 'Đang hoạt động' : 'Tạm nghỉ'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-yellow-600">
                          <Star className="w-4 h-4" />
                          <span className="font-semibold">
                            {Number.isFinite(Number(panelStaff.rating))
                              ? Math.min(5, Math.max(0, Number(panelStaff.rating))).toFixed(1)
                              : 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {panelStaff.totalReviews || 0} đánh giá
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Calendar className="w-4 h-4" />
                          <span className="font-semibold">{panelStaff.totalBookings || 0}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Lượt đặt</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4" />
                          <span className="font-semibold truncate">
                            {panelStaff.salon?.name || '-'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {panelStaff.salon?.address || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Thông tin</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4 border-b pb-2">
                          <span className="text-gray-500">ID Nhân viên</span>
                          <span className="font-medium break-all text-right">{panelStaff.id}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-b pb-2">
                          <span className="text-gray-500 inline-flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Email
                          </span>
                          <span className="font-medium text-right break-all">
                            {panelStaff.user?.email || '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-500 inline-flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Số điện thoại
                          </span>
                          <span className="font-medium text-right break-all">
                            {panelStaff.user?.phone || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closePanel}
                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={() => panelStaffId && openEditPanel(panelStaffId, true)}
                        className="px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handlePanelSubmit} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>

                  {/* Avatar */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ảnh đại diện (URL)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center">
                        {formData.avatar ? (
                          <Image
                            src={formData.avatar}
                            alt={formData.name || 'avatar'}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-accent">
                            {(formData.name || 'N').charAt(0)}
                          </span>
                        )}
                      </div>
                      <input
                        type="url"
                        value={formData.avatar}
                        onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="https://res.cloudinary.com/..."
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Gợi ý: dùng link Cloudinary hoặc link ảnh công khai.
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="staff@example.com"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      className={cn(
                        'block text-sm font-medium text-gray-700 mb-2',
                        panelMode === 'create' ? '' : ''
                      )}
                    >
                      Số điện thoại{' '}
                      {panelMode === 'create' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="0912345678"
                      required={panelMode === 'create'}
                    />
                  </div>

                  {/* Password (create only) */}
                  {panelMode === 'create' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Tối thiểu 6 ký tự"
                        minLength={6}
                        required
                      />
                    </div>
                  )}

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vị trí <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    >
                      <option value="SENIOR_STYLIST">Senior Stylist</option>
                      <option value="STYLIST">Stylist</option>
                      <option value="JUNIOR_STYLIST">Junior Stylist</option>
                      <option value="TRAINEE">Trainee</option>
                    </select>
                  </div>

                  {/* Salon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chi nhánh <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.salonId}
                      onChange={e => setFormData({ ...formData, salonId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                      disabled={salonsLoading}
                    >
                      <option value="">-- Chọn chi nhánh --</option>
                      {salons.map(salon => (
                        <option key={salon.id} value={salon.id}>
                          {salon.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status (edit only) */}
                  {panelMode === 'edit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 text-accent rounded focus:ring-2 focus:ring-accent"
                        />
                        <span className="text-sm text-gray-700">Đang hoạt động</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closePanel}
                    className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={panelSubmitting}
                    className="px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {panelSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {panelMode === 'create' ? 'Đang tạo...' : 'Đang lưu...'}
                      </>
                    ) : (
                      <>{panelMode === 'create' ? 'Tạo nhân viên' : 'Lưu thay đổi'}</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
