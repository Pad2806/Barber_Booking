import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';
import { VietQRService } from './vietqr.service';
import { PaymentMethod, PaymentStatus, BookingStatus } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let vietQRService: VietQRService;

  const mockBooking = {
    id: 'booking-1',
    bookingCode: 'BK12345678',
    totalAmount: 150000,
    status: BookingStatus.PENDING,
    salon: {
      id: 'salon-1',
      name: 'Test Salon',
      bankCode: 'VCB',
      bankAccount: '1234567890',
      bankName: 'Vietcombank',
    },
    payment: null,
  };

  const mockPayment = {
    id: 'payment-1',
    bookingId: 'booking-1',
    amount: 150000,
    method: PaymentMethod.VIETQR,
    status: PaymentStatus.PENDING,
    qrCode: 'https://img.vietqr.io/image/...',
    qrContent: 'test-qr-content',
    bankCode: 'VCB',
    bankAccount: '1234567890',
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
      update: jest.fn(),
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
    prismaService = module.get<PrismaService>(PrismaService);
    vietQRService = module.get<VietQRService>(VietQRService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create VietQR payment successfully', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);
      mockPrismaService.booking.update.mockResolvedValue({ ...mockBooking, paymentMethod: PaymentMethod.VIETQR });

      const result = await service.createPayment({
        bookingId: 'booking-1',
        method: PaymentMethod.VIETQR,
      });

      expect(result).toHaveProperty('qrCodeUrl');
      expect(mockVietQRService.generateQRCodeUrl).toHaveBeenCalled();
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment({ bookingId: 'invalid-id', method: PaymentMethod.VIETQR }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment already exists', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        payment: mockPayment,
      });

      await expect(
        service.createPayment({ bookingId: 'booking-1', method: PaymentMethod.VIETQR }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if salon has no bank info for VietQR', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        salon: { ...mockBooking.salon, bankCode: null, bankAccount: null },
      });

      await expect(
        service.createPayment({ bookingId: 'booking-1', method: PaymentMethod.VIETQR }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPaymentByBooking', () => {
    it('should return payment with QR URL', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await service.getPaymentByBooking('booking-1');

      expect(result).toHaveProperty('qrCodeUrl');
      expect(result?.qrCodeUrl).toBe(mockPayment.qrCode);
    });

    it('should return null if no payment exists', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      const result = await service.getPaymentByBooking('booking-1');

      expect(result).toBeNull();
    });
  });

  describe('getPayment', () => {
    it('should return payment by ID', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        booking: mockBooking,
      });

      const result = await service.getPayment('payment-1');

      expect(result.id).toBe('payment-1');
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(service.getPayment('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      });
      mockPrismaService.booking.update.mockResolvedValue({});

      const result = await service.confirmPayment('payment-1', 'TXN123');

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPayment.bookingId },
          data: expect.objectContaining({
            paymentStatus: PaymentStatus.PAID,
            status: BookingStatus.CONFIRMED,
          }),
        }),
      );
    });

    it('should return existing payment if already paid', async () => {
      const paidPayment = { ...mockPayment, status: PaymentStatus.PAID };
      mockPrismaService.payment.findUnique.mockResolvedValue(paidPayment);

      const result = await service.confirmPayment('payment-1');

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(service.confirmPayment('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('processSepayWebhook', () => {
    it('should process webhook and confirm payment', async () => {
      const booking = {
        id: 'booking-1',
        payment: mockPayment,
        salon: mockBooking.salon,
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
      });
      mockPrismaService.booking.update.mockResolvedValue({});

      const result = await service.processSepayWebhook({
        id: 'sepay-123',
        gateway: 'VCB',
        transactionDate: '2024-01-15 10:30:00',
        accountNumber: '1234567890',
        transferType: 'in',
        transferAmount: 150000,
        accumulated: 150000,
        code: null,
        content: 'RBBK12345678 payment',
        referenceCode: 'REF123',
        description: 'Payment',
      });

      expect(result.success).toBe(true);
    });

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
