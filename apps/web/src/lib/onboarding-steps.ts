import { DriveStep } from 'driver.js';

export type ActorType = 'admin' | 'manager' | 'cashier' | 'customer';

export interface OnboardingConfig {
  title: string;
  description: string;
  steps: DriveStep[];
}

export const ONBOARDING_CONFIGS: Record<ActorType, OnboardingConfig> = {
  admin: {
    title: 'Chào mừng đến REETRO BARBER Admin!',
    description: 'Hãy để mình hướng dẫn bạn sử dụng hệ thống quản trị.',
    steps: [
      {
        popover: {
          title: '🏠 Tổng quan',
          description: 'Đây là Dashboard tổng quan — nơi bạn thấy số liệu doanh thu, lịch hẹn, và đánh giá.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: 'nav a[href="/admin/salons"]',
        popover: {
          title: '🏪 Quản lý Chi nhánh',
          description: 'Quản lý tất cả các chi nhánh salon, thông tin, giờ hoạt động, và hình ảnh.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/staff"]',
        popover: {
          title: '👥 Quản lý Nhân viên',
          description: 'Thêm, sửa, xóa nhân viên. Xem hồ sơ chi tiết, thành tích, và hiệu suất.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/services"]',
        popover: {
          title: '✂️ Quản lý Dịch vụ',
          description: 'Thiết lập menu dịch vụ, giá cả, và thời gian thực hiện cho từng salon.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/bookings"]',
        popover: {
          title: '📅 Quản lý Lịch hẹn',
          description: 'Theo dõi tất cả lịch hẹn từ mọi chi nhánh. Phê duyệt, hủy hoặc chỉnh sửa.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/reviews"]',
        popover: {
          title: '⭐ Đánh giá',
          description: 'Xem và phản hồi đánh giá từ khách hàng. Theo dõi mức độ hài lòng.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  manager: {
    title: 'Chào mừng Quản lý Chi nhánh!',
    description: 'Đây là những công cụ giúp bạn quản lý chi nhánh hiệu quả.',
    steps: [
      {
        popover: {
          title: '📊 Dashboard Chi nhánh',
          description: 'Xem tổng quan hoạt động chi nhánh: doanh thu, lịch hẹn hôm nay, nhân viên.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: 'nav a[href="/manager/staff"]',
        popover: {
          title: '👥 Nhân viên',
          description: 'Quản lý đội ngũ: xem hồ sơ, đánh giá hiệu suất, sắp xếp ca.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/manager/bookings"]',
        popover: {
          title: '📅 Lịch hẹn',
          description: 'Xem và quản lý lịch hẹn tại chi nhánh.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/manager/schedule"]',
        popover: {
          title: '🕐 Lịch làm việc',
          description: 'Sắp xếp ca làm việc cho nhân viên theo tuần.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  cashier: {
    title: 'Chào mừng Thu ngân!',
    description: 'Đây là quầy thanh toán và quản lý lịch hẹn.',
    steps: [
      {
        popover: {
          title: '📊 Tổng quan',
          description: 'Xem nhanh số liệu hôm nay: đơn hàng, doanh thu, lịch hẹn đang chờ.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: 'nav a[href="/cashier/online-bookings"]',
        popover: {
          title: '📱 Đơn Online',
          description: 'Duyệt lịch hẹn đặt online. Xác nhận hoặc từ chối đơn từ đây.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/cashier/walk-in"]',
        popover: {
          title: '🚶 Khách vãng lai',
          description: 'Tạo đơn nhanh cho khách tới trực tiếp không đặt trước.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/cashier/checkout"]',
        popover: {
          title: '💳 Thanh toán',
          description: 'Xử lý thanh toán cho các lịch hẹn đã hoàn thành.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/cashier/revenue"]',
        popover: {
          title: '📈 Doanh thu',
          description: 'Theo dõi doanh thu ca làm việc và tổng doanh thu ngày.',
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
          description: 'Bước 1: Duyệt và chọn salon gần bạn nhất. Xem đánh giá, dịch vụ và đội ngũ.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        popover: {
          title: '✂️ Chọn Dịch vụ & Thợ',
          description: 'Bước 2: Chọn dịch vụ bạn muốn, xem hồ sơ và chọn thợ yêu thích.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        popover: {
          title: '📅 Đặt lịch',
          description: 'Bước 3: Chọn ngày giờ phù hợp và xác nhận. Bạn sẽ nhận thông báo khi salon xác nhận.',
          side: 'bottom',
          align: 'center',
        },
      },
    ],
  },
};
