import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { VietQRService } from './vietqr.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment, PaymentStatus, PaymentMethod, PaymentType, BookingStatus } from '@prisma/client';

export interface PaymentWithQR extends Payment {
  qrCodeUrl?: string | null;
  bankName?: string | null;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vietQRService: VietQRService,
  ) { }

  /**
   * Create a DEPOSIT payment for an online booking (50% of totalAmount).
   * This is called when a customer books online via Web or Zalo.
   */
  async createPayment(dto: CreatePaymentDto): Promise<PaymentWithQR> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        salon: true,
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if a deposit already exists
    const existingDeposit = booking.payments.find(
      p => p.type === PaymentType.DEPOSIT && p.status !== PaymentStatus.REFUNDED,
    );
    if (existingDeposit) {
      throw new BadRequestException('Deposit payment already exists for this booking');
    }

    const salon = booking.salon;

    if (dto.method === PaymentMethod.VIETQR || dto.method === PaymentMethod.BANK_TRANSFER) {
      if (!salon.bankCode || !salon.bankAccount) {
        throw new BadRequestException('Salon does not have bank information configured');
      }
    }

    let qrCode: string | undefined;
    let qrContent: string | undefined;

    // Calculate deposit amount (50%)
    const depositAmount = Math.round(Number(booking.totalAmount) * 0.5);

    if (dto.method === PaymentMethod.VIETQR && salon.bankCode && salon.bankAccount) {
      const prefix = 'RB';
      const description = booking.bookingCode.startsWith(prefix)
        ? booking.bookingCode
        : `${prefix}${booking.bookingCode}`;

      qrCode = this.vietQRService.generateQRCodeUrl({
        bankCode: salon.bankCode,
        accountNumber: salon.bankAccount,
        accountName: salon.bankName || salon.name,
        amount: depositAmount,
        description,
      });

      qrContent = this.vietQRService.generateQRContent({
        bankCode: salon.bankCode,
        accountNumber: salon.bankAccount,
        accountName: salon.bankName || salon.name,
        amount: depositAmount,
        description,
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount: depositAmount,
        method: dto.method,
        type: PaymentType.DEPOSIT,
        status: PaymentStatus.PENDING,
        qrCode,
        qrContent,
        bankCode: salon.bankCode,
        bankAccount: salon.bankAccount,
      },
    });

    await this.prisma.booking.update({
      where: { id: dto.bookingId },
      data: { paymentMethod: dto.method },
    });

    return {
      ...payment,
      qrCodeUrl: qrCode,
      bankName: salon.bankName || salon.name,
    };
  }

  /**
   * Get all payments for a booking (deposit + final).
   */
  async getPaymentsByBooking(bookingId: string): Promise<PaymentWithQR[]> {
    const payments = await this.prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });

    if (!payments.length) return [];

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { salon: { select: { bankName: true, name: true } } },
    });

    return payments.map(p => ({
      ...p,
      qrCodeUrl: p.qrCode,
      bankName: booking?.salon?.bankName || booking?.salon?.name || null,
    }));
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
      bankName: (payment.booking as any)?.salon?.bankName || (payment.booking as any)?.salon?.name || null,
    };
  }

  /**
   * Confirm a DEPOSIT payment (via manual action or SePay webhook).
   * Sets booking to CONFIRMED & paymentStatus to DEPOSIT_PAID.
   */
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

    // Determine booking payment status based on payment type
    if (payment.type === PaymentType.DEPOSIT) {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: PaymentStatus.DEPOSIT_PAID,
          status: BookingStatus.CONFIRMED,
        },
      });
    } else {
      // FINAL or FULL payment → mark as fully PAID
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });
    }

    return updatedPayment;
  }

  /**
   * Checkout: create a FINAL payment for the remaining amount.
   * Called by Receptionist/Manager at the counter.
   */
  async checkout(
    bookingId: string,
    method: PaymentMethod,
  ): Promise<PaymentWithQR> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        salon: true,
        payments: true,
        services: { include: { service: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking is already completed');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot checkout a cancelled booking');
    }

    // Calculate total paid so far (sum of all PAID payments)
    const totalPaid = booking.payments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalAmount = Number(booking.totalAmount);
    const remainingAmount = totalAmount - totalPaid;

    if (remainingAmount <= 0) {
      // Already fully paid, just complete the booking
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: BookingStatus.COMPLETED,
        },
      });

      throw new BadRequestException('No remaining amount to collect. Booking marked as COMPLETED.');
    }

    const salon = booking.salon;
    let qrCode: string | undefined;
    let qrContent: string | undefined;

    if (method === PaymentMethod.VIETQR && salon.bankCode && salon.bankAccount) {
      const description = `${booking.bookingCode}F`;
      qrCode = this.vietQRService.generateQRCodeUrl({
        bankCode: salon.bankCode,
        accountNumber: salon.bankAccount,
        accountName: salon.bankName || salon.name,
        amount: remainingAmount,
        description,
      });
      qrContent = this.vietQRService.generateQRContent({
        bankCode: salon.bankCode,
        accountNumber: salon.bankAccount,
        accountName: salon.bankName || salon.name,
        amount: remainingAmount,
        description,
      });
    }

    // Create FINAL payment
    const finalPayment = await this.prisma.payment.create({
      data: {
        bookingId,
        amount: remainingAmount,
        method,
        type: PaymentType.FINAL,
        status: method === PaymentMethod.CASH ? PaymentStatus.PAID : PaymentStatus.PENDING,
        paidAt: method === PaymentMethod.CASH ? new Date() : undefined,
        qrCode,
        qrContent,
        bankCode: salon.bankCode,
        bankAccount: salon.bankAccount,
      },
    });

    // If cash payment → immediately complete the booking
    if (method === PaymentMethod.CASH) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: BookingStatus.COMPLETED,
        },
      });
    }

    return {
      ...finalPayment,
      qrCodeUrl: qrCode,
      bankName: salon.bankName || salon.name,
    };
  }

  /**
   * Get booking payment summary: deposit paid, remaining, total.
   */
  async getBookingPaymentSummary(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: true,
        services: { include: { service: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const totalAmount = Number(booking.totalAmount);
    const totalPaid = booking.payments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = totalAmount - totalPaid;

    return {
      totalAmount,
      depositPaid: booking.payments
        .filter(p => p.type === PaymentType.DEPOSIT && p.status === PaymentStatus.PAID)
        .reduce((sum, p) => sum + Number(p.amount), 0),
      finalPaid: booking.payments
        .filter(p => p.type === PaymentType.FINAL && p.status === PaymentStatus.PAID)
        .reduce((sum, p) => sum + Number(p.amount), 0),
      totalPaid,
      remaining: remaining > 0 ? remaining : 0,
      isFullyPaid: remaining <= 0,
      payments: booking.payments,
    };
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
      const bookingCodeRegex = /RB[A-Z0-9]{8,15}/i;
      const match = data.content.match(bookingCodeRegex);

      if (!match) {
        return {
          success: false,
          message: 'Could not extract booking code from transfer content',
        };
      }

      let bookingCode = match[0];
      if (bookingCode.startsWith('RBRB')) {
        bookingCode = bookingCode.substring(2);
      }
      // Strip trailing F for FINAL payment QR descriptions
      const isFinalPayment = bookingCode.endsWith('F');
      if (isFinalPayment) {
        bookingCode = bookingCode.slice(0, -1);
      }

      const booking = await this.prisma.booking.findUnique({
        where: { bookingCode },
        include: { payments: { orderBy: { createdAt: 'desc' } } },
      });

      if (!booking) {
        return {
          success: false,
          message: `Booking with code ${bookingCode} not found`,
        };
      }

      // Find the latest PENDING payment to confirm
      const pendingPayment = booking.payments.find(
        p => p.status === PaymentStatus.PENDING,
      );

      if (!pendingPayment) {
        return {
          success: false,
          message: 'No pending payment found for booking',
        };
      }

      if (data.transferAmount < Number(pendingPayment.amount)) {
        return {
          success: false,
          message: `Transfer amount (${data.transferAmount}) is less than required (${pendingPayment.amount})`,
        };
      }

      const dateStr = data.transactionDate.replace(' ', 'T');
      const paidAt = new Date(dateStr);

      await this.prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: isNaN(paidAt.getTime()) ? new Date() : paidAt,
          sepayTransId: String(data.id),
          sepayRef: String(data.referenceCode),
        },
      });

      // Determine new booking status
      if (pendingPayment.type === PaymentType.DEPOSIT) {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: PaymentStatus.DEPOSIT_PAID,
            status: BookingStatus.CONFIRMED,
          },
        });
      } else {
        // FINAL payment confirmed → COMPLETED
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: BookingStatus.COMPLETED,
          },
        });
      }

      return {
        success: true,
        message: `Payment confirmed for booking ${bookingCode}`,
      };
    } catch (error: any) {
      console.error('Sepay webhook error:', error);
      return {
        success: false,
        message: `Internal error: ${error.message || JSON.stringify(error)}`,
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
