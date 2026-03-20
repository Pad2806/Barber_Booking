import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationType, Notification, StaffPosition } from '@prisma/client';
import { BaseQueryService } from '../common/services/base-query.service';
import { SettingsService, SettingKey } from '../settings/settings.service';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService extends BaseQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {
    super();
  }

  async create(params: CreateNotificationParams): Promise<Notification> {
    return this.prisma.notification.create({
      data: params,
    });
  }

  async createMany(notifications: CreateNotificationParams[]): Promise<number> {
    const result = await this.prisma.notification.createMany({
      data: notifications,
    });
    return result.count;
  }

  async findAllByUser(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {},
  ) {
    const { unreadOnly = false } = params;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        ...this.getPaginationOptions(params),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        ...this.getPaginationMeta(total, params),
        unreadCount,
      },
    };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id, userId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return result.count;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id, userId },
    });
  }

  async deleteAll(userId: string): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Notification templates for booking events
  async notifyBookingCreated(
    userId: string,
    bookingCode: string,
    salonName: string,
    date: string,
    time: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.BOOKING_CREATED,
      title: 'Đặt lịch thành công',
      message: `Bạn đã đặt lịch tại ${salonName} vào ${time} ngày ${date}. Mã đặt lịch: ${bookingCode}`,
      data: { bookingCode, salonName, date, time },
    });
  }

  async notifyBookingConfirmed(
    userId: string,
    bookingCode: string,
    salonName: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Lịch hẹn đã được xác nhận',
      message: `Lịch hẹn ${bookingCode} tại ${salonName} đã được xác nhận. Vui lòng đến đúng giờ!`,
      data: { bookingCode, salonName },
    });
  }

  async notifyBookingCancelled(
    userId: string,
    bookingCode: string,
    reason?: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Lịch hẹn đã bị hủy',
      message: reason
        ? `Lịch hẹn ${bookingCode} đã bị hủy. Lý do: ${reason}`
        : `Lịch hẹn ${bookingCode} đã bị hủy.`,
      data: { bookingCode, reason },
    });
  }

  async notifyBookingReminder(
    userId: string,
    bookingCode: string,
    salonName: string,
    salonAddress: string,
    time: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.BOOKING_REMINDER,
      title: 'Nhắc nhở lịch hẹn',
      message: `Bạn có lịch hẹn tại ${salonName} lúc ${time} hôm nay. Địa chỉ: ${salonAddress}`,
      data: { bookingCode, salonName, salonAddress, time },
    });
  }

  async notifyPaymentReceived(
    userId: string,
    bookingCode: string,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Thanh toán thành công',
      message: `Đã nhận thanh toán ${amount.toLocaleString('vi-VN')}đ cho đơn hàng ${bookingCode}`,
      data: { bookingCode, amount },
    });
  }

  async notifyNewReview(
    salonOwnerId: string,
    customerName: string,
    rating: number,
    salonName: string,
  ): Promise<Notification> {
    return this.create({
      userId: salonOwnerId,
      type: NotificationType.REVIEW_RECEIVED,
      title: 'Đánh giá mới',
      message: `${customerName} đã đánh giá ${rating} sao cho ${salonName}`,
      data: { customerName, rating, salonName },
    });
  }

  /**
   * Send notifications to all relevant staff in a salon based on event type.
   * Checks the settings toggles before sending.
   */
  async notifyStaffBySalon(
    salonId: string,
    event: 'new_booking' | 'payment' | 'review' | 'cancel',
    params: { title: string; message: string; type: NotificationType; data?: Record<string, any>; specificStaffId?: string },
  ): Promise<number> {
    // Map event to settings toggle key
    const toggleMap: Record<string, SettingKey> = {
      new_booking: 'notify_new_booking',
      payment: 'notify_payment',
      review: 'notify_review',
      cancel: 'notify_new_booking',
    };

    const toggleKey = toggleMap[event];
    const isEnabled = await this.settingsService.get<boolean>(toggleKey, true);
    if (!isEnabled) return 0;

    // Determine which roles should receive this notification
    const roleMap: Record<string, StaffPosition[]> = {
      new_booking: [StaffPosition.MANAGER],
      payment: [StaffPosition.MANAGER, StaffPosition.CASHIER],
      review: [StaffPosition.MANAGER],
      cancel: [StaffPosition.MANAGER],
    };

    const targetPositions = roleMap[event] || [StaffPosition.MANAGER];

    // Find all staff with matching positions in this salon
    const staffMembers = await this.prisma.staff.findMany({
      where: {
        salonId,
        position: { in: targetPositions },
        isActive: true,
      },
      select: { userId: true },
    });

    const userIds = staffMembers.map(s => s.userId);

    // Also add the specifically assigned staff (e.g., barber for their booking)
    if (params.specificStaffId) {
      const specificStaff = await this.prisma.staff.findUnique({
        where: { id: params.specificStaffId },
        select: { userId: true },
      });
      if (specificStaff && !userIds.includes(specificStaff.userId)) {
        userIds.push(specificStaff.userId);
      }
    }

    if (userIds.length === 0) return 0;

    const notifications = userIds.map(userId => ({
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || undefined,
    }));

    return this.createMany(notifications);
  }
}
