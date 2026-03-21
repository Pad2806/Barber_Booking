import { DriveStep } from 'driver.js';

export type ActorType = 'admin' | 'manager' | 'cashier' | 'customer';

export interface OnboardingConfig {
  title: string;
  description: string;
  steps: DriveStep[];
}

export const ONBOARDING_CONFIGS: Record<ActorType, OnboardingConfig> = {
  admin: {
    title: 'Chao mung den REETRO BARBER Admin!',
    description: 'Hay de minh huong dan ban su dung he thong quan tri.',
    steps: [
      {
        popover: {
          title: 'Tong quan',
          description: 'Day la Dashboard tong quan — noi ban thay so lieu doanh thu, lich hen, va danh gia.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: 'nav a[href="/admin/salons"]',
        popover: {
          title: 'Quan ly Chi nhanh',
          description: 'Quan ly tat ca cac chi nhanh salon, thong tin, gio hoat dong, va hinh anh.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/staff"]',
        popover: {
          title: 'Quan ly Nhan vien',
          description: 'Them, sua, xoa nhan vien. Xem ho so chi tiet, thanh tich, va hieu suat.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/services"]',
        popover: {
          title: 'Quan ly Dich vu',
          description: 'Thiet lap menu dich vu, gia ca, va thoi gian thuc hien cho tung salon.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/bookings"]',
        popover: {
          title: 'Quan ly Lich hen',
          description: 'Theo doi tat ca lich hen tu moi chi nhanh. Phe duyet, huy hoac chinh sua.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/admin/reviews"]',
        popover: {
          title: 'Danh gia',
          description: 'Xem va phan hoi danh gia tu khach hang. Theo doi muc do hai long.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  manager: {
    title: 'Chao mung Quan ly Chi nhanh!',
    description: 'Day la nhung cong cu giup ban quan ly chi nhanh hieu qua.',
    steps: [
      {
        popover: {
          title: 'Dashboard Chi nhanh',
          description: 'Xem tong quan hoat dong chi nhanh: doanh thu, lich hen hom nay, nhan vien.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: 'nav a[href="/manager/staff"]',
        popover: {
          title: 'Nhan vien',
          description: 'Quan ly doi ngu: xem ho so, danh gia hieu suat, sap xep ca.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/manager/bookings"]',
        popover: {
          title: 'Lich hen',
          description: 'Xem va quan ly lich hen tai chi nhanh.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/manager/schedule"]',
        popover: {
          title: 'Lich lam viec',
          description: 'Sap xep ca lam viec cho nhan vien theo tuan.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  cashier: {
    title: 'Chao mung Thu ngan!',
    description: 'Day la quay thanh toan va quan ly lich hen.',
    steps: [
      {
        popover: {
          title: 'Tong quan',
          description: 'Xem nhanh so lieu hom nay: don hang, doanh thu, lich hen dang cho.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: 'nav a[href="/cashier/online-bookings"]',
        popover: {
          title: 'Don Online',
          description: 'Duyet lich hen dat online. Xac nhan hoac tu choi don tu day.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/cashier/walk-in"]',
        popover: {
          title: 'Khach vang lai',
          description: 'Tao don nhanh cho khach toi truc tiep khong dat truoc.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/cashier/checkout"]',
        popover: {
          title: 'Thanh toan',
          description: 'Xu ly thanh toan cho cac lich hen da hoan thanh.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'nav a[href="/cashier/revenue"]',
        popover: {
          title: 'Doanh thu',
          description: 'Theo doi doanh thu ca lam viec va tong doanh thu ngay.',
          side: 'right',
          align: 'start',
        },
      },
    ],
  },

  customer: {
    title: 'Chao mung den REETRO BARBER!',
    description: 'Dat lich cat toc chi trong 3 buoc don gian.',
    steps: [
      {
        popover: {
          title: 'Tim Salon',
          description: 'Buoc 1: Duyet va chon salon gan ban nhat. Xem danh gia, dich vu va doi ngu.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        popover: {
          title: 'Chon Dich vu & Tho',
          description: 'Buoc 2: Chon dich vu ban muon, xem ho so va chon tho yeu thich.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        popover: {
          title: 'Dat lich',
          description: 'Buoc 3: Chon ngay gio phu hop va xac nhan. Ban se nhan thong bao khi salon xac nhan.',
          side: 'bottom',
          align: 'center',
        },
      },
    ],
  },
};
