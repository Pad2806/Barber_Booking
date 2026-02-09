import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

import { BookingsService } from './bookings.service';
import { PrismaService } from '../database/prisma.service';

// Mock uuid module
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-1234'),
}));

describe('BookingsService', () => {
  let service: BookingsService;
  let prismaService: PrismaService;

  const mockSalon = {
    id: 'salon-1',
    name: 'Test Salon',
    openTime: '08:00',
    closeTime: '20:00',
    isActive: true,
  };

  const mockStaff = {
    id: 'staff-1',
    salonId: 'salon-1',
    userId: 'user-staff-1',
    isActive: true,
    schedules: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '20:00', isOff: false },
      { dayOfWeek: 2, startTime: '08:00', endTime: '20:00', isOff: false },
    ],
  };

  const mockService = {
    id: 'service-1',
    name: 'Haircut',
    price: 100000,
    duration: 30,
    salonId: 'salon-1',
    isActive: true,
  };

  const mockBooking = {
    id: 'booking-1',
    bookingCode: 'BK202602001',
    customerId: 'user-1',
    salonId: 'salon-1',
    staffId: 'staff-1',
    date: new Date('2026-02-10'),
    timeSlot: '10:00',
    endTime: '10:30',
    totalDuration: 30,
    totalAmount: 100000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    services: [{ serviceId: 'service-1', price: 100000, duration: 30 }],
  };

  const mockPrismaService = {
    salon: {
      findUnique: jest.fn(),
    },
    staff: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    bookingService: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      salonId: 'salon-1',
      staffId: 'staff-1',
      serviceIds: ['service-1'],
      date: '2026-02-10',
      timeSlot: '10:00',
    };

    const mockUser = { id: 'user-1', role: 'CUSTOMER' };

    it('should create a booking successfully', async () => {
      mockPrismaService.salon.findUnique.mockResolvedValue(mockSalon);
      mockPrismaService.service.findMany.mockResolvedValue([mockService]);
      mockPrismaService.staff.findFirst.mockResolvedValue(mockStaff);
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      mockPrismaService.booking.count.mockResolvedValue(0);
      mockPrismaService.booking.create.mockResolvedValue(mockBooking);

      const result = await service.create(createDto, 'user-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('bookingCode');
      expect(mockPrismaService.booking.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if salon not found', async () => {
      mockPrismaService.salon.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if services are invalid', async () => {
      mockPrismaService.salon.findUnique.mockResolvedValue(mockSalon);
      mockPrismaService.service.findMany.mockResolvedValue([]); // No services found

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return a booking by ID', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findOne('booking-1');

      expect(result).toEqual(mockBooking);
      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'booking-1' } }),
      );
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated bookings', async () => {
      const bookings = [mockBooking];
      mockPrismaService.booking.findMany.mockResolvedValue(bookings);
      mockPrismaService.booking.count.mockResolvedValue(1);

      const result = await service.findAll({ customerId: 'user-1' });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual(bookings);
    });
  });

  describe('cancel', () => {
    const mockUser = { 
      id: 'user-1', 
      role: 'CUSTOMER',
      name: 'Test User',
      email: 'test@example.com',
      phone: '0901234567',
      password: 'hashed',
      avatar: null,
      googleId: null,
      isActive: true,
      isVerified: false,
      authProvider: 'LOCAL',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    it('should cancel a booking successfully', async () => {
      const pendingBooking = { 
        ...mockBooking, 
        customerId: 'user-1', 
        status: 'PENDING',
        customer: { id: 'user-1' },
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(pendingBooking);
      mockPrismaService.staff.findFirst.mockResolvedValue(null); // User is not a staff
      mockPrismaService.booking.update.mockResolvedValue({
        ...pendingBooking,
        status: 'CANCELLED',
      });

      const result = await service.cancel('booking-1', 'Changed my mind', mockUser as any);

      expect(result.status).toBe('CANCELLED');
      expect(mockPrismaService.booking.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const otherUserBooking = { 
        ...mockBooking, 
        customerId: 'other-user',
        customer: { id: 'other-user' },
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(otherUserBooking);
      mockPrismaService.staff.findFirst.mockResolvedValue(null); // User is not a staff

      await expect(
        service.cancel('booking-1', 'reason', mockUser as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if booking is already completed', async () => {
      const completedBooking = { 
        ...mockBooking, 
        customerId: 'user-1', 
        status: 'COMPLETED',
        customer: { id: 'user-1' },
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(completedBooking);
      mockPrismaService.staff.findFirst.mockResolvedValue(null); // User is not a staff

      await expect(
        service.cancel('booking-1', 'reason', mockUser as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
