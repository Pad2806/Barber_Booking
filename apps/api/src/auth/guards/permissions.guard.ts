import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, hasAnyPermission, Role } from '@reetro/shared';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No permissions required → allow
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        const role = user.role as Role;

        // For STAFF, we need to resolve their position from DB
        let staffPosition: string | null = null;
        if (role === Role.STAFF) {
            const staff = await this.prisma.staff.findUnique({
                where: { userId: user.id },
                select: { position: true },
            });
            staffPosition = staff?.position || null;
        }

        const allowed = hasAnyPermission(role, requiredPermissions, staffPosition);

        if (!allowed) {
            throw new ForbiddenException(
                `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
            );
        }

        return true;
    }
}
