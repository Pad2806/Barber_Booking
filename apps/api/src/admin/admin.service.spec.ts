import { Test, TestingModule } from '@nestjs/testing';

import { AdminService } from './admin.service';
import { PrismaService } from '../database/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    salon: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    booking: {
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    staff: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    service: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    review: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.salon.count.mockResolvedValue(5);
      mockPrismaService.booking.count
        .mockResolvedValueOnce(500)  // totalBookings
        .mockResolvedValueOnce(20)   // todayBookings
        .mockResolvedValueOnce(150)  // monthBookings
        .mockResolvedValueOnce(120)  // lastMonthBookings
        .mockResolvedValueOnce(10);  // pendingBookings
      mockPrismaService.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 50000000 } })  // monthRevenue
        .mockResolvedValueOnce({ _sum: { amount: 45000000 } }); // lastMonthRevenue
      mockPrismaService.booking.findMany.mockResolvedValue([
        { id: 'booking-1', bookingCode: 'BK001', status: 'PENDING' },
      ]);

      const result = await service.getDashboardStats();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('totalSalons');
      expect(result).toHaveProperty('totalBookings');
      expect(result).toHaveProperty('monthRevenue');
      expect(result).toHaveProperty('recentBookings');
      expect(result.totalUsers).toBe(100);
      expect(result.totalSalons).toBe(5);
    });
  });

  describe('getAllBookings', () => {
    it('should return paginated bookings', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          bookingCode: 'BK001',
          customer: { name: 'Test User' },
          salon: { name: 'Test Salon' },
          staff: { id: 'staff-1', user: { name: 'Staff Name' } },
          services: [{ service: { name: 'Haircut', price: 100000 } }],
        },
      ];
      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);
      mockPrismaService.booking.count.mockResolvedValue(1);

      const result = await service.getAllBookings({ skip: 0, take: 10 });

      expect(result).toHaveProperty('bookings');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);
      mockPrismaService.booking.count.mockResolvedValue(0);

      await service.getAllBookings({ status: 'PENDING' as any });

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status', async () => {
      const updatedBooking = {
        id: 'booking-1',
        status: 'CONFIRMED',
        customer: { name: 'Test User' },
        salon: { name: 'Test Salon' },
      };
      mockPrismaService.booking.update.mockResolvedValue(updatedBooking);

      const result = await service.updateBookingStatus('booking-1', 'CONFIRMED' as any);

      expect(result.status).toBe('CONFIRMED');
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-1' },
          data: { status: 'CONFIRMED' },
        }),
      );
    });
  });

  describe('getAllStaff', () => {
    it('should return paginated staff list', async () => {
      const mockStaff = [
        {
          id: 'staff-1',
          user: { name: 'Staff 1', phone: '0901234567', email: 'staff@test.com' },
          salon: { id: 'salon-1', name: 'Test Salon' },
          position: 'STYLIST',
          rating: 4.5,
          totalReviews: 10,
          isActive: true,
          _count: { bookings: 50 },
        },
      ];
      mockPrismaService.staff.findMany.mockResolvedValue(mockStaff);
      mockPrismaService.staff.count.mockResolvedValue(1);

      const result = await service.getAllStaff({ skip: 0, take: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('totalBookings');
    });
  });

  describe('getAllServices', () => {
    it('should return paginated services list', async () => {
      const mockServices = [
        {
          id: 'service-1',
          name: 'Haircut',
          price: 100000,
          duration: 30,
          category: 'HAIRCUT',
          salon: { id: 'salon-1', name: 'Test Salon' },
          _count: { bookings: 100 },
        },
      ];
      mockPrismaService.service.findMany.mockResolvedValue(mockServices);
      mockPrismaService.service.count.mockResolvedValue(1);

      const result = await service.getAllServices({ skip: 0, take: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data[0]).toHaveProperty('totalBookings');
    });
  });

  describe('getAllReviews', () => {
    it('should return paginated reviews list', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          comment: 'Great service!',
          customer: { id: 'user-1', name: 'Customer' },
          salon: { id: 'salon-1', name: 'Test Salon' },
          booking: {
            staff: {
              id: 'staff-1',
              user: { name: 'Staff Name' },
            },
          },
        },
      ];
      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);
      mockPrismaService.review.count.mockResolvedValue(1);

      const result = await service.getAllReviews({ skip: 0, take: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data[0]).toHaveProperty('rating');
    });

    it('should filter by rating', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(0);

      await service.getAllReviews({ rating: 5 });

      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rating: 5 }),
        }),
      );
    });
  });
});
