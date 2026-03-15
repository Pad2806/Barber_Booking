import { Test, TestingModule } from '@nestjs/testing';
import { ManagerService } from './manager.service';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ManagerService', () => {
    let service: ManagerService;
    let prisma: PrismaService;
    let usersService: UsersService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
        },
        staff: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
        },
        booking: {
            count: jest.fn(),
            aggregate: jest.fn(),
            groupBy: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        review: {
            aggregate: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        staffShift: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
        }
    };

    const mockUsersService = {
        createStaff: jest.fn(),
        updateStaff: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ManagerService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: UsersService, useValue: mockUsersService },
            ],
        }).compile();

        service = module.get<ManagerService>(ManagerService);
        prisma = module.get<PrismaService>(PrismaService);
        usersService = module.get<UsersService>(UsersService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getManagerSalonId', () => {
        it('should return salonId for a staff manager', async () => {
            const mockUser = {
                id: 'user-1',
                role: 'STAFF',
                staff: { salonId: 'salon-1', position: 'MANAGER' },
            };
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.getManagerSalonId('user-1');
            expect(result).toBe('salon-1');
        });

        it('should return salonId for a salon owner', async () => {
            const mockUser = {
                id: 'user-2',
                role: 'SALON_OWNER',
                ownedSalons: [{ id: 'salon-2' }],
            };
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.getManagerSalonId('user-2');
            expect(result).toBe('salon-2');
        });

        it('should throw ForbiddenException if user is not a manager', async () => {
            const mockUser = {
                id: 'user-3',
                role: 'USER',
            };
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            await expect(service.getManagerSalonId('user-3')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('Staff Management', () => {
        const managerId = 'manager-1';
        const salonId = 'salon-1';
        const mockManager = {
            id: managerId,
            role: 'MANAGER',
            staff: { salonId, position: 'MANAGER' },
        };

        beforeEach(() => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockManager);
        });

        it('should create staff with manager salonId', async () => {
            const dto = { name: 'New Staff', email: 'staff@test.com' } as any;
            await service.createStaff(managerId, dto);

            expect(usersService.createStaff).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...dto,
                    salonId: salonId,
                })
            );
        });

        it('should update staff if they belong to manager salon', async () => {
            const staffUserId = 'staff-user-1';
            mockPrismaService.staff.findUnique.mockResolvedValue({ userId: staffUserId, salonId });
            
            const dto = { name: 'Updated Name' } as any;
            await service.updateStaff(managerId, staffUserId, dto);

            expect(usersService.updateStaff).toHaveBeenCalledWith(staffUserId, expect.objectContaining(dto));
        });

        it('should throw ForbiddenException if updating staff from another salon', async () => {
            const staffUserId = 'staff-user-2';
            mockPrismaService.staff.findUnique.mockResolvedValue({ userId: staffUserId, salonId: 'other-salon' });

            await expect(service.updateStaff(managerId, staffUserId, {} as any)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('Booking Management', () => {
        const managerId = 'manager-1';
        const salonId = 'salon-1';
        const mockManager = {
            id: managerId,
            role: 'MANAGER',
            staff: { salonId, position: 'MANAGER' },
        };

        beforeEach(() => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockManager);
        });

        it('should update booking status if it belongs to manager salon', async () => {
            const bookingId = 'booking-1';
            mockPrismaService.booking.findUnique.mockResolvedValue({ id: bookingId, salonId });
            
            await service.updateBookingStatus(managerId, bookingId, 'CONFIRMED' as any);

            expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
                where: { id: bookingId },
                data: expect.objectContaining({ status: 'CONFIRMED' }),
            });
        });

        it('should throw ForbiddenException if updating booking from another salon', async () => {
            const bookingId = 'booking-2';
            mockPrismaService.booking.findUnique.mockResolvedValue({ id: bookingId, salonId: 'other-salon' });

            await expect(service.updateBookingStatus(managerId, bookingId, 'CONFIRMED' as any)).rejects.toThrow(ForbiddenException);
        });

        it('should bulk update bookings filtered by salonId', async () => {
            const ids = ['b1', 'b2'];
            await service.bulkUpdateBookingStatus(managerId, ids, 'COMPLETED' as any);

            expect(mockPrismaService.booking.updateMany).toHaveBeenCalledWith({
                where: {
                    id: { in: ids },
                    salonId: salonId
                },
                data: expect.objectContaining({ status: 'COMPLETED' })
            });
        });
    });
});
