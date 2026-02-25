import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';
import { VietQRService } from './vietqr.service';
import { PaymentMethod, PaymentStatus, PaymentType, BookingStatus } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockBooking = {
    id: 'booking-1',
    bookingCode: 'RB12345678',
    totalAmount: 150000,
    status: BookingStatus.PENDING,
    salonId: 'salon-1',
    salon: {
      id: 'salon-1',
      name: 'Test Salon',
      bankCode: 'VCB',
      bankAccount: '1234567890',
      bankName: 'Vietcombank',
    },
    payments: [],
  };

  const mockDepositPayment = {
    id: 'payment-1',
    bookingId: 'booking-1',
    amount: 75000,
    method: PaymentMethod.VIETQR,
    type: PaymentType.DEPOSIT,
    status: PaymentStatus.PENDING,
    qrCode: 'https://img.vietqr.io/image/...',
    qrContent: 'test-qr-content',
    bankCode: 'VCB',
    bankAccount: '1234567890',
    sepayTransId: null,
    sepayRef: null,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockVietQRService = {
    generateQRCodeUrl: jest.fn().mockReturnValue('https://img.vietqr.io/image/...'),
    generateQRContent: jest.fn().mockReturnValue('test-qr-content'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: VietQRService, useValue: mockVietQRService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create a DEPOSIT payment (50%) with VietQR', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.payment.create.mockResolvedValue(mockDepositPayment);
      mockPrismaService.booking.update.mockResolvedValue({});

      const result = await service.createPayment({
        bookingId: 'booking-1',
        method: PaymentMethod.VIETQR,
      });

      expect(result).toHaveProperty('qrCodeUrl');
      expect(mockPrismaService.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PaymentType.DEPOSIT,
            amount: 75000, // 50% of 150000
          }),
        }),
      );
    });

    it('should throw if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment({ bookingId: 'invalid', method: PaymentMethod.VIETQR }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if deposit already exists', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        payments: [{ ...mockDepositPayment, status: PaymentStatus.PENDING, type: PaymentType.DEPOSIT }],
      });

      await expect(
        service.createPayment({ bookingId: 'booking-1', method: PaymentMethod.VIETQR }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm DEPOSIT and set booking to DEPOSIT_PAID', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockDepositPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockDepositPayment,
        status: PaymentStatus.PAID,
      });
      mockPrismaService.booking.update.mockResolvedValue({});

      const result = await service.confirmPayment('payment-1');

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentStatus: PaymentStatus.DEPOSIT_PAID,
          }),
        }),
      );
    });

    it('should return existing payment if already paid', async () => {
      const paidPayment = { ...mockDepositPayment, status: PaymentStatus.PAID };
      mockPrismaService.payment.findUnique.mockResolvedValue(paidPayment);

      const result = await service.confirmPayment('payment-1');

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('checkout', () => {
    it('should create FINAL payment with CASH and complete booking', async () => {
      const bookingWithDeposit = {
        ...mockBooking,
        status: BookingStatus.IN_PROGRESS,
        payments: [{ ...mockDepositPayment, status: PaymentStatus.PAID }],
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(bookingWithDeposit);
      mockPrismaService.payment.create.mockResolvedValue({
        ...mockDepositPayment,
        id: 'payment-2',
        type: PaymentType.FINAL,
        amount: 75000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
      });
      mockPrismaService.booking.update.mockResolvedValue({});

      const result = await service.checkout('booking-1', PaymentMethod.CASH);

      expect(mockPrismaService.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: PaymentType.FINAL,
            amount: 75000,
            status: PaymentStatus.PAID,
          }),
        }),
      );
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BookingStatus.COMPLETED,
          }),
        }),
      );
    });

    it('should throw if booking is already completed', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
        payments: [],
      });

      await expect(
        service.checkout('booking-1', PaymentMethod.CASH),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processSepayWebhook', () => {
    it('should return false if booking code not found in content', async () => {
      const result = await service.processSepayWebhook({
        id: 'sepay-123',
        gateway: 'VCB',
        transactionDate: '2024-01-15 10:30:00',
        accountNumber: '1234567890',
        transferType: 'in',
        transferAmount: 150000,
        accumulated: 150000,
        code: null,
        content: 'Random transfer',
        referenceCode: 'REF123',
        description: 'Payment',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('booking code');
    });
  });
});
