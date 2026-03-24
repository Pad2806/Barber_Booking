import { DriveStep } from 'driver.js';

export type ActorType = 'admin' | 'manager' | 'cashier' | 'customer';

export interface OnboardingConfig {
  title: string;
  description: string;
  steps: DriveStep[];
}

export const ONBOARDING_CONFIGS: Record<ActorType, OnboardingConfig> = {
  admin: {
    title: 'Chào mừng đến Trang Quản trị!',
    description: 'Hãy để mình hướng dẫn bạn khám phá hệ thống quản lý REETRO BARBER nhé.',
    steps: [
      {
        popover: {
          title: '📊 Tổng quan hệ thống',
          description: 'Đây là Dashboard tổng quan — nơi bạn theo dõi doanh thu, lịch hẹn, đánh giá và hiệu suất toàn bộ chuỗi salon.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: 'nav a[href="/admin/salons"]',
        popover: {
          title: '🏪 Quản lý Chi nhánh',
          description: 'Quản lý tất cả các chi nhánh salon — thông tin, giờ hoạt động, hình ảnh và cài đặt riêng cho từng cơ sở.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/staff"]',
        popover: {
          title: '👥 Quản lý Nhân viên',
          description: 'Thêm, sửa, quản lý nhân viên. Xem hồ sơ chi tiết, thành tích, xếp hạng và hiệu suất làm việc.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/services"]',
        popover: {
          title: '✂️ Quản lý Dịch vụ',
          description: 'Thiết lập menu dịch vụ, giá cả, thời gian thực hiện và phân loại cho từng salon.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/bookings"]',
        popover: {
          title: '📅 Quản lý Lịch hẹn',
          description: 'Theo dõi tất cả lịch hẹn từ mọi chi nhánh. Phê duyệt, hủy hoặc chỉnh sửa nhanh chóng.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/reviews"]',
        popover: {
          title: '⭐ Đánh giá khách hàng',
          description: 'Xem và phản hồi đánh giá từ khách hàng. Theo dõi mức độ hài lòng và cải thiện chất lượng dịch vụ.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  manager: {
    title: 'Chào mừng Quản lý Chi nhánh!',
    description: 'Đây là những công cụ giúp bạn quản lý chi nhánh hiệu quả mỗi ngày.',
    steps: [
      {
        popover: {
          title: '📊 Dashboard Chi nhánh',
          description: 'Tổng quan hoạt động chi nhánh hôm nay: doanh thu, lịch hẹn, nhân viên đang trực và tỷ lệ hoàn thành.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: 'nav a[href="/manager/staff"]',
        popover: {
          title: '👥 Nhân viên',
          description: 'Quản lý đội ngũ: xem hồ sơ, đánh giá hiệu suất, theo dõi lịch trình và sắp xếp ca làm việc.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/manager/bookings"]',
        popover: {
          title: '📅 Lịch hẹn',
          description: 'Xem và quản lý toàn bộ lịch hẹn tại chi nhánh. Lọc theo ngày, trạng thái hoặc nhân viên.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/manager/schedule"]',
        popover: {
          title: '🗓️ Lịch làm việc',
          description: 'Sắp xếp ca làm việc cho nhân viên theo tuần. Đảm bảo luôn có đủ người phục vụ khách.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  cashier: {
    title: 'Chào mừng Thu ngân!',
    description: 'Đây là quầy thanh toán và trung tâm quản lý lịch hẹn của bạn.',
    steps: [
      {
        popover: {
          title: '📊 Tổng quan',
          description: 'Xem nhanh số liệu hôm nay: số đơn hàng, doanh thu, lịch hẹn đang chờ xử lý và trạng thái booking.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: 'nav a[href="/cashier/online-bookings"]',
        popover: {
          title: '📱 Duyệt đơn Online',
          description: 'Duyệt lịch hẹn đặt online từ khách hàng. Xác nhận, phân thợ hoặc từ chối đơn tại đây.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/cashier/walk-in"]',
        popover: {
          title: '🚶 Khách vãng lai',
          description: 'Tạo đơn nhanh cho khách đến trực tiếp không đặt trước. Chọn dịch vụ, thợ và thanh toán ngay.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/cashier/checkout"]',
        popover: {
          title: '💳 Thanh toán',
          description: 'Xử lý thanh toán cho các lịch hẹn đã hoàn thành. Hỗ trợ tiền mặt và chuyển khoản. Xem lịch sử giao dịch để kết toán ca.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/cashier/revenue"]',
        popover: {
          title: '📈 Doanh thu',
          description: 'Theo dõi doanh thu ca làm việc, doanh thu ngày, tuần, tháng và xu hướng biến động.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  customer: {
    title: 'Chào mừng đến REETRO BARBER!',
    description: 'Đặt lịch cắt tóc chỉ trong 3 bước đơn giản.',
    steps: [
      {
        popover: {
          title: '🔍 Tìm Salon',
          description: 'Bước 1: Duyệt và chọn salon gần bạn nhất. Xem đánh giá, dịch vụ, hình ảnh và đội ngũ thợ.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        popover: {
          title: '✂️ Chọn Dịch vụ & Thợ',
          description: 'Bước 2: Chọn dịch vụ bạn muốn, xem hồ sơ thợ và chọn người bạn yêu thích.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        popover: {
          title: '📅 Xác nhận Đặt lịch',
          description: 'Bước 3: Chọn ngày giờ phù hợp và xác nhận. Bạn sẽ nhận thông báo ngay khi salon xác nhận lịch hẹn.',
          side: 'bottom',
          align: 'center',
        },
      },
    ],
  },
};
