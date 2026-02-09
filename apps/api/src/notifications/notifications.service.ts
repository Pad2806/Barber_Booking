import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationType, Notification } from '@prisma/client';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
      skip?: number;
      take?: number;
      unreadOnly?: boolean;
    } = {},
  ) {
    const { skip = 0, take = 20, unreadOnly = false } = params;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
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
        total,
        skip,
        take,
        hasMore: skip + take < total,
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
}
