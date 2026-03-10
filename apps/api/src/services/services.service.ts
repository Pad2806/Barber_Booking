import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, Role, User, ServiceCategory } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateServiceDto, user: User) {
    // Verify salon ownership
    await this.verifySalonOwnership(dto.salonId, user);

    // Get max order for this salon
    const maxOrder = await this.prisma.service.aggregate({
      where: { salonId: dto.salonId },
      _max: { order: true },
    });

    const service = await this.prisma.service.create({
      data: {
        ...dto,
        order: dto.order ?? (maxOrder._max.order || 0) + 1,
      },
    });

    return this.formatService(service);
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    category?: ServiceCategory;
    isActive?: boolean;
    search?: string;
  } = {}) {
    const { skip = 0, take = 20, category, isActive = true, search } = params;

    const where: any = { isActive };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take,
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
        include: {
          salon: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: services.map(s => this.formatService(s)),
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async findAllBySalon(
    salonId: string,
    params: {
      category?: ServiceCategory;
      isActive?: boolean;
    } = {},
  ) {
    const { category, isActive = true } = params;

    const where: any = { salonId, isActive };

    if (category) {
      where.category = category;
    }

    const services = await this.prisma.service.findMany({
      where,
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });

    return services.map(s => this.formatService(s));
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return this.formatService(service);
  }

  async update(id: string, dto: UpdateServiceDto, user: User) {
    const service = await this.findOne(id);

    // Verify salon ownership
    await this.verifySalonOwnership((service as any).salonId, user);

    const updated = await this.prisma.service.update({
      where: { id },
      data: dto,
    });

    return this.formatService(updated);
  }

  async delete(id: string, user: User): Promise<void> {
    const service = await this.findOne(id);

    // Verify salon ownership
    await this.verifySalonOwnership(service.salonId, user);

    await this.prisma.service.delete({ where: { id } });
  }

  async reorder(salonId: string, serviceIds: string[], user: User): Promise<void> {
    // Verify salon ownership
    await this.verifySalonOwnership(salonId, user);

    // Update order for each service
    await Promise.all(
      serviceIds.map((id, index) =>
        this.prisma.service.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );
  }

  async toggleActive(id: string, user: User) {
    const service = await this.findOne(id);

    // Verify salon ownership
    await this.verifySalonOwnership((service as any).salonId, user);

    const updated = await this.prisma.service.update({
      where: { id },
      data: { isActive: !(service as any).isActive },
    });

    return this.formatService(updated);
  }

  private formatService(service: any) {
    if (!service) return null;
    return {
      ...service,
      price: Number(service.price),
    };
  }

  private async verifySalonOwnership(salonId: string, user: User): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return;
    }

    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID ${salonId} not found`);
    }

    if (salon.ownerId !== user.id) {
      throw new ForbiddenException('You can only manage services for your own salon');
    }
  }
}
