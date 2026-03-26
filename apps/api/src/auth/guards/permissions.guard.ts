import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, hasAnyMultiRolePermission, Role } from '@reetro/shared';
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

        // Multi-role: query all roles from UserRole table
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId: user.id },
            select: { role: true },
        });

        let roles: Role[];
        if (userRoles.length > 0) {
            roles = userRoles.map(ur => ur.role as Role);
        } else {
            // Fallback to single role for backward compat
            roles = [user.role as Role];
        }

        // Attach roles to request user for downstream use
        user.roles = roles;

        const allowed = hasAnyMultiRolePermission(roles, requiredPermissions);

        if (!allowed) {
            throw new ForbiddenException(
                `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
            );
        }

        return true;
    }
}
