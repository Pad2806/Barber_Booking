// ============== User Types ==============
export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  ZALO = 'ZALO',
}

export enum Role {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  SALON_OWNER = 'SALON_OWNER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: string;
  googleId?: string;
  facebookId?: string;
  zaloId?: string;
  authProvider: AuthProvider;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// ============== Salon Types ==============
export interface Salon {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email?: string;
  openTime: string;
  closeTime: string;
  workingDays: string[];
  logo?: string;
  coverImage?: string;
  images: string[];
  isActive: boolean;
  ownerId: string;
  bankCode?: string;
  bankAccount?: string;
  bankName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============== Service Types ==============
export enum ServiceCategory {
  HAIRCUT = 'HAIRCUT',
  HAIR_STYLING = 'HAIR_STYLING',
  HAIR_COLORING = 'HAIR_COLORING',
  HAIR_TREATMENT = 'HAIR_TREATMENT',
  SHAVE = 'SHAVE',
  FACIAL = 'FACIAL',
  COMBO = 'COMBO',
  OTHER = 'OTHER',
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  category: ServiceCategory;
  image?: string;
  isActive: boolean;
  order: number;
  salonId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============== Staff Types ==============
export enum StaffPosition {
  STYLIST = 'STYLIST',
  SENIOR_STYLIST = 'SENIOR_STYLIST',
  MASTER_STYLIST = 'MASTER_STYLIST',
  SKINNER = 'SKINNER',
  MANAGER = 'MANAGER',
}

export interface Staff {
  id: string;
  position: StaffPosition;
  bio?: string;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  userId: string;
  salonId: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

// ============== Booking Types ==============
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  VIETQR = 'VIETQR',
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  salonId: string;
  staffId?: string;
  date: Date;
  timeSlot: string;
  endTime: string;
  totalDuration: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  note?: string;
  cancelReason?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: User;
  salon?: Salon;
  staff?: Staff;
  services?: BookingService[];
}

export interface BookingService {
  id: string;
  bookingId: string;
  serviceId: string;
  price: number;
  duration: number;
  service?: Service;
}

// ============== Payment Types ==============
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  qrCode?: string;
  qrContent?: string;
  bankCode?: string;
  bankAccount?: string;
  sepayTransId?: string;
  sepayRef?: string;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============== Review Types ==============
export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  salonId: string;
  rating: number;
  comment?: string;
  images: string[];
  reply?: string;
  repliedAt?: Date;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  customer?: User;
}

// ============== Notification Types ==============
export enum NotificationType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// ============== API Response Types ==============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============== Auth Types ==============
export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  phone?: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ============== Time Slot Types ==============
export interface TimeSlot {
  time: string;
  available: boolean;
  staffId?: string;
}

export interface AvailableSlots {
  date: string;
  slots: TimeSlot[];
}
