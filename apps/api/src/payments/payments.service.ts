import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { VietQRService } from './vietqr.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentStatus, PaymentMethod, BookingStatus } from '@prisma/client';

export interface PaymentWithQR extends Payment {
  qrCodeUrl?: string | null;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vietQRService: VietQRService,
  ) {}

  async createPayment(dto: CreatePaymentDto): Promise<PaymentWithQR> {
    // Get booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        salon: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.payment) {
      throw new BadRequestException('Payment already exists for this booking');
    }

    const salon = booking.salon;

    // For bank transfer/VietQR, salon must have bank info
    if (dto.method === PaymentMethod.VIETQR || dto.method === PaymentMethod.BANK_TRANSFER) {
      if (!salon.bankCode || !salon.bankAccount) {
        throw new BadRequestException('Salon does not have bank information configured');
      }
    }

    // Generate QR if VietQR method
    let qrCode: string | undefined;
    let qrContent: string | undefined;

    if (dto.method === PaymentMethod.VIETQR && salon.bankCode && salon.bankAccount) {
      const description = `RB${booking.bookingCode}`;

      qrCode = this.vietQRService.generateQRCodeUrl({
        bankCode: salon.bankCode,
        accountNumber: salon.bankAccount,
        accountName: salon.bankName || salon.name,
        amount: Number(booking.totalAmount),
        description,
      });

      qrContent = this.vietQRService.generateQRContent({
        bankCode: salon.bankCode,
        accountNumber: salon.bankAccount,
        accountName: salon.bankName || salon.name,
        amount: Number(booking.totalAmount),
        description,
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount: booking.totalAmount,
        method: dto.method,
        status: PaymentStatus.PENDING,
        qrCode,
        qrContent,
        bankCode: salon.bankCode,
        bankAccount: salon.bankAccount,
      },
    });

    // Update booking payment status
    await this.prisma.booking.update({
      where: { id: dto.bookingId },
      data: { paymentMethod: dto.method },
    });

    return {
      ...payment,
      qrCodeUrl: qrCode,
    };
  }

  async getPaymentByBooking(bookingId: string): Promise<PaymentWithQR | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      return null;
    }

    return {
      ...payment,
      qrCodeUrl: payment.qrCode,
    };
  }

  async getPayment(id: string): Promise<PaymentWithQR> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            salon: true,
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      ...payment,
      qrCodeUrl: payment.qrCode,
    };
  }

  async confirmPayment(id: string, transactionId?: string): Promise<Payment> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment;
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        sepayTransId: transactionId,
      },
    });

    // Update booking status
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
      },
    });

    return updatedPayment;
  }

  /**
   * Process Sepay webhook
   * Sepay sends transaction data when payment is received
   */
  async processSepayWebhook(data: {
    id: string;
    gateway: string;
    transactionDate: string;
    accountNumber: string;
    transferType: string;
    transferAmount: number;
    accumulated: number;
    code: string | null;
    content: string;
    referenceCode: string;
    description: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Extract booking code from content
      // Content format: "RB{bookingCode}" or contains booking code
      const bookingCodeMatch = data.content.match(/RB[A-Z0-9]{8,12}/i);

      if (!bookingCodeMatch) {
        return {
          success: false,
          message: 'Could not extract booking code from transfer content',
        };
      }

      const bookingCode = bookingCodeMatch[0];

      // Find booking
      const booking = await this.prisma.booking.findUnique({
        where: { bookingCode },
        include: { payment: true },
      });

      if (!booking) {
        return {
          success: false,
          message: `Booking with code ${bookingCode} not found`,
        };
      }

      if (!booking.payment) {
        return {
          success: false,
          message: 'No payment record found for booking',
        };
      }

      // Verify amount
      if (data.transferAmount < Number(booking.payment.amount)) {
        return {
          success: false,
          message: `Transfer amount (${data.transferAmount}) is less than required (${booking.payment.amount})`,
        };
      }

      // Check if already processed
      if (booking.payment.status === PaymentStatus.PAID) {
        return {
          success: true,
          message: 'Payment already confirmed',
        };
      }

      // Confirm payment
      await this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(data.transactionDate),
          sepayTransId: data.id,
          sepayRef: data.referenceCode,
        },
      });

      // Update booking
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: BookingStatus.CONFIRMED,
        },
      });

      return {
        success: true,
        message: `Payment confirmed for booking ${bookingCode}`,
      };
    } catch (error) {
      console.error('Sepay webhook error:', error);
      return {
        success: false,
        message: 'Internal error processing webhook',
      };
    }
  }

  async getPaymentStats(salonId: string, period: 'day' | 'week' | 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }

    const [totalPaid, totalPending, transactions] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          booking: { salonId },
          status: PaymentStatus.PAID,
          paidAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          booking: { salonId },
          status: PaymentStatus.PENDING,
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.findMany({
        where: {
          booking: { salonId },
          paidAt: { gte: startDate },
        },
        orderBy: { paidAt: 'desc' },
        take: 10,
        include: {
          booking: {
            select: {
              bookingCode: true,
              customer: {
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      totalPaid: totalPaid._sum.amount || 0,
      totalPaidCount: totalPaid._count,
      totalPending: totalPending._sum.amount || 0,
      totalPendingCount: totalPending._count,
      recentTransactions: transactions,
    };
  }
}
