import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { BaseQueryService } from '../common/services/base-query.service';
import { UserQueryDto } from './dto/user-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class UsersService extends BaseQueryService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : {},
          dto.phone ? { phone: dto.phone } : {},
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Email or phone already exists');
    }

    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });
  }

  async createStaff(dto: CreateStaffDto): Promise<any> {
    // Check if email or phone already exists
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { phone: dto.phone },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Email or phone already exists');
    }

    // Verify salon exists
    if (!dto.salonId) {
      throw new NotFoundException('salonId is required');
    }
    const salon = await this.prisma.salon.findUnique({
      where: { id: dto.salonId },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user and staff in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          name: dto.name,
          avatar: dto.avatar,
          role: Role.STAFF,
          authProvider: 'LOCAL',
        },
      });

      // Create staff record
      const staff = await prisma.staff.create({
        data: {
          userId: user.id,
          position: dto.position,
          salonId: dto.salonId!,
          bio: dto.bio,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          salon: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return staff;
    });
  }

  async findAll(query: UserQueryDto) {
    const {
      role,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      Object.assign(where, this.buildSearchWhere(search, ['name', 'email', 'phone']));
    }

    const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        ...this.getPaginationOptions(query),
        orderBy,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: this.getPaginationMeta(total, query),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        staff: {
          include: {
            salon: true,
          },
        },
        ownedSalons: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    if (dto.phone) {
      const existing = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('Phone already exists');
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...dto };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async updateRole(id: string, role: Role): Promise<User> {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async deactivate(id: string): Promise<User> {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string): Promise<User> {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }

  async getBookingHistory(userId: string, params: PaginationQueryDto) {
    const where = { customerId: userId };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        ...this.getPaginationOptions(params),
        orderBy: { date: 'desc' },
        include: {
          salon: {
            select: {
              id: true,
              name: true,
              address: true,
              logo: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
          staff: {
            include: {
              user: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          review: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: this.getPaginationMeta(total, params),
    };
  }

  async updateStaff(userId: string, dto: UpdateStaffDto): Promise<any> {
    // Verify user exists and has staff record
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { staff: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.staff) {
      throw new NotFoundException('Staff record not found for this user');
    }

    // Check email uniqueness if provided
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check phone uniqueness if provided
    if (dto.phone && dto.phone !== user.phone) {
      const existing = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new ConflictException('Phone already exists');
      }
    }

    // Separate user and staff fields
    const userUpdateData: any = {};
    const staffUpdateData: any = {};

    // User fields
    if (dto.email !== undefined) userUpdateData.email = dto.email;
    if (dto.phone !== undefined) userUpdateData.phone = dto.phone;
    if (dto.name !== undefined) userUpdateData.name = dto.name;
    if (dto.avatar !== undefined) userUpdateData.avatar = dto.avatar;
    if (dto.password) {
      userUpdateData.password = await bcrypt.hash(dto.password, 10);
    }

    // Staff fields
    if (dto.position !== undefined) staffUpdateData.position = dto.position;
    if (dto.salonId !== undefined) staffUpdateData.salonId = dto.salonId;
    if (dto.isActive !== undefined) staffUpdateData.isActive = dto.isActive;
    if (dto.bio !== undefined) staffUpdateData.bio = dto.bio;

    // Update both User and Staff in a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Update user fields if any
      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      // Update staff fields if any
      if (Object.keys(staffUpdateData).length > 0) {
        await prisma.staff.update({
          where: { userId: userId },
          data: staffUpdateData,
        });
      }

      // Return staff with user and salon relations (matching GET /staff/:id format)
      return prisma.staff.findUnique({
        where: { userId: userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          salon: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new ConflictException('Cannot change password for social login accounts');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
