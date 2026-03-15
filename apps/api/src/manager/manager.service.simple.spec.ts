import { Test, TestingModule } from '@nestjs/testing';
import { ManagerService } from './manager.service';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';

describe('ManagerService Simple', () => {
    let service: ManagerService;

    const mockPrismaService = {
        user: { findUnique: jest.fn() },
        staff: { findMany: jest.fn() },
        booking: { count: jest.fn() }
    };

    const mockUsersService = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ManagerService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: UsersService, useValue: mockUsersService },
            ],
        }).compile();

        service = module.get<ManagerService>(ManagerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
