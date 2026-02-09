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
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateServiceDto, user: User): Promise<Service> {
    // Verify salon ownership
    await this.verifySalonOwnership(dto.salonId, user);

    // Get max order for this salon
    const maxOrder = await this.prisma.service.aggregate({
      where: { salonId: dto.salonId },
      _max: { order: true },
    });

    return this.prisma.service.create({
      data: {
        ...dto,
        order: dto.order ?? (maxOrder._max.order || 0) + 1,
      },
    });
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

    return this.prisma.service.findMany({
      where,
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
  }

  async findOne(id: string): Promise<Service> {
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

    return service;
  }

  async update(id: string, dto: UpdateServiceDto, user: User): Promise<Service> {
    const service = await this.findOne(id);

    // Verify salon ownership
    await this.verifySalonOwnership(service.salonId, user);

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
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

  async toggleActive(id: string, user: User): Promise<Service> {
    const service = await this.findOne(id);

    // Verify salon ownership
    await this.verifySalonOwnership(service.salonId, user);

    return this.prisma.service.update({
      where: { id },
      data: { isActive: !service.isActive },
    });
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
