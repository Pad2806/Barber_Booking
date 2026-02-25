'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  DollarSign,
  X,
} from 'lucide-react';
import { formatPrice, formatDate, BOOKING_STATUS, PAYMENT_STATUS } from '@/lib/utils';
import { adminApi, serviceApi, paymentApi, type AdminBookingDetail, type Service } from '@/lib/api';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [salonServices, setSalonServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Add Service State
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [addingService, setAddingService] = useState(false);

  // Checkout State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<'CASH' | 'VIETQR'>('CASH');
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getBookingById(bookingId);
      setBooking(data);
      // Fetch services for this salon if not yet
      if (data?.salon?.id) {
        const services = await serviceApi.getBySalon(data.salon.id);
        setSalonServices(services);
      }
    } catch (error: any) {
      toast.error('Không thể tải thông tin đặt lịch');
      router.push('/admin/bookings');
    } finally {
      setLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    void fetchBooking();
  }, [fetchBooking]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!booking) return;
    try {
      setUpdating(true);
      await adminApi.updateBookingStatus(bookingId, newStatus);
      toast.success('Cập nhật trạng thái thành công!');
      await fetchBooking();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddServices = async () => {
    if (!selectedServices.length) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ');
      return;
    }
    try {
      setAddingService(true);
      await adminApi.addServiceToBooking(bookingId, selectedServices);
      toast.success('Thêm dịch vụ thành công');
      setShowAddServiceModal(false);
      setSelectedServices([]);
      await fetchBooking();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thêm dịch vụ');
    } finally {
      setAddingService(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      await paymentApi.checkout(bookingId, checkoutMethod);
      toast.success('Thanh toán thành công và hoàn thành đặt lịch!');
      setShowCheckoutModal(false);
      await fetchBooking();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thanh toán');
    } finally {
      setCheckingOut(false);
    }
  };

  const toggleSelectService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const totalPaid = useMemo(() => {
    if (!booking?.payments) return 0;
    return booking.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [booking?.payments]);

  const remainingAmount = booking ? Math.max(0, booking.totalAmount - totalPaid) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">Không tìm thấy thông tin đặt lịch</p>
        <Link href="/admin/bookings" className="text-accent hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const statusConfig = BOOKING_STATUS[booking.status as keyof typeof BOOKING_STATUS] || {
    label: booking.status,
    color: 'gray',
  };

  const pStatusConfig = PAYMENT_STATUS[booking.paymentStatus as keyof typeof PAYMENT_STATUS] || {
    label: booking.paymentStatus,
    color: 'gray',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/bookings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-800">
              Chi tiết đặt lịch #{booking.bookingCode}
            </h1>
            <p className="text-gray-500">Quản lý thông tin đặt lịch</p>
          </div>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium ${statusConfig.color}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Họ tên</p>
                  <p className="font-medium">{booking.customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium">{booking.customer.phone}</p>
                </div>
              </div>
              {booking.customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{booking.customer.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Salon & Staff Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin địa điểm</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Salon</p>
                  <p className="font-medium">{booking.salon?.name || 'Chưa cập nhật'}</p>
                </div>
              </div>
              {booking.staff && booking.staff.user?.name && (
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {booking.staff.user.avatar ? (
                      <Image
                        src={booking.staff.user.avatar}
                        alt={booking.staff.user.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent font-semibold">
                        {booking.staff.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stylist</p>
                    <p className="font-medium">{booking.staff.user.name}</p>
                    <p className="text-xs text-gray-500">{booking.staff.position}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Khách dùng dịch vụ</h2>
              {['CONFIRMED', 'IN_PROGRESS'].includes(booking.status) && (
                <button
                  onClick={() => setShowAddServiceModal(true)}
                  className="text-sm text-accent font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Thêm dịch vụ
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {booking.services && booking.services.length > 0 ? (
                booking.services.map((bs, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{bs.service.name}</p>
                      <p className="text-sm text-gray-500">{bs.duration} phút</p>
                    </div>
                    <p className="font-semibold text-gray-800">{formatPrice(bs.price)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Chưa có dịch vụ nào</p>
              )}
              <div className="flex justify-between items-center pt-3 border-t-2">
                <p className="font-semibold text-lg">Tổng cộng</p>
                <p className="font-bold text-xl text-accent">{formatPrice(booking.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Note */}
          {booking.note && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Ghi chú</h2>
              <p className="text-gray-600 bg-yellow-50 p-4 rounded-lg italic">&quot;{booking.note}&quot;</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Time */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Thời gian</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-gray-500">Ngày đặt</p>
                  <p className="font-medium">{formatDate(booking.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-gray-500">Giờ</p>
                  <p className="font-medium">{booking.timeSlot}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Thanh toán</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Trạng thái:</span>
                <span className={`text-sm font-medium ${pStatusConfig.color} px-2 py-0.5 rounded-full`}>
                  {pStatusConfig.label}
                </span>
              </div>
              
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-500 text-sm">Tổng tiền:</span>
                <span className="font-medium text-gray-800">{formatPrice(booking.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span className="text-sm">Đã thanh toán (Cọc):</span>
                <span className="font-medium">-{formatPrice(totalPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-lg text-red-600">
                <span>Còn lại:</span>
                <span>{formatPrice(remainingAmount)}</span>
              </div>
            </div>

            {/* Payment history list */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Lịch sử giao dịch</p>
                <div className="space-y-2">
                  {booking.payments.map((p) => (
                    <div key={p.id} className="text-sm flex justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{p.type === 'DEPOSIT' ? 'Cọc' : 'Thanh toán'} </span>
                        <span className="text-xs bg-gray-200 px-1 rounded text-gray-600">{p.method}</span>
                      </div>
                      <div className="text-right">
                        <span className={p.status === 'PAID' ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                          {formatPrice(p.amount)}
                        </span>
                        {p.status !== 'PAID' && <div className="text-xs text-yellow-600 leading-none mt-1">Chưa xong</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Hành động</h2>
            <div className="space-y-3">
              {booking.status === 'PENDING' && (
                <button
                  onClick={() => handleUpdateStatus('CONFIRMED')}
                  disabled={updating}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Xác nhận khách tới
                </button>
              )}
              {booking.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  disabled={updating}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 shadow-sm"
                >
                  Bắt đầu làm dịch vụ
                </button>
              )}
              {remainingAmount > 0 && ['IN_PROGRESS', 'CONFIRMED'].includes(booking.status) && (
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={updating}
                  className="w-full px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <DollarSign className="w-5 h-5" />
                  Thanh toán tại quầy
                </button>
              )}
              {booking.status === 'IN_PROGRESS' && remainingAmount === 0 && (
                <button
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  disabled={updating}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 shadow-sm"
                >
                  Hoàn tất & Lưu lại
                </button>
              )}
              {!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status) && (
                <button
                  onClick={() => handleUpdateStatus('CANCELLED')}
                  disabled={updating}
                  className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Hủy lịch
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Services Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddServiceModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Thêm dịch vụ phát sinh</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-gray-500 hover:text-gray-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-4">
              {salonServices.length > 0 ? (
                salonServices.map(service => {
                  const isSelected = selectedServices.includes(service.id);
                  // Quick check if booking already has it (though they might add same service twice, usually we just filter out)
                  const isAlreadyInBooking = booking.services?.find(s => s.service.id === service.id);
                  if (isAlreadyInBooking) return null;

                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleSelectService(service.id)}
                      className={`p-3 border rounded-lg cursor-pointer flex justify-between items-center transition-all ${
                        isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.duration} phút</p>
                      </div>
                      <p className="font-medium text-accent">{formatPrice(service.price)}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-6">Không tải được danh sách dịch vụ.</p>
              )}
            </div>
            
            <div className="pt-4 border-t flex justify-end gap-3">
              <button 
                onClick={() => setShowAddServiceModal(false)}
                className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddServices}
                disabled={addingService || selectedServices.length === 0}
                className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
              >
                {addingService && <Loader2 className="w-4 h-4 animate-spin" />}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCheckoutModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Thanh Toán (Checkout)</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-gray-500 hover:text-gray-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Số tiền khách cần trả hiện tại:</p>
              <p className="text-3xl font-bold text-accent">{formatPrice(remainingAmount)}</p>
            </div>

            <div className="space-y-4 mb-8">
              <p className="font-medium text-gray-800 leading-none">Phương thức</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutMethod('CASH')}
                  className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                    checkoutMethod === 'CASH' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-gray-200 hover:border-accent/40'
                  }`}
                >
                  <DollarSign className={`w-6 h-6 ${checkoutMethod === 'CASH' ? 'text-accent' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">Tiền mặt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutMethod('VIETQR')}
                  className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                    checkoutMethod === 'VIETQR' ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-gray-200 hover:border-accent/40'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 ${checkoutMethod === 'VIETQR' ? 'text-accent' : 'text-gray-400'}`} />
                  <span className="font-medium text-sm">Chuyển khoản</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-3 border rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-lg shadow-sm hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Thu tiền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
