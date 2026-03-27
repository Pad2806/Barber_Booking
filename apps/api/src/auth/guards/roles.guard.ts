import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // Role hierarchy: SUPER_ADMIN > SALON_OWNER > MANAGER > STAFF/BARBER/CASHIER/SKINNER > CUSTOMER
    const roleHierarchy: Record<Role, number> = {
      [Role.SUPER_ADMIN]: 100,
      [Role.SALON_OWNER]: 50,
      [Role.MANAGER]: 40,
      [Role.STAFF]: 25,
      [Role.BARBER]: 25,
      [Role.CASHIER]: 25,
      [Role.SKINNER]: 25,
      [Role.CUSTOMER]: 10,
    };

    // Multi-role: use user.roles array, fallback to single user.role
    const userRoles: Role[] = (user.roles as Role[]) || [user.role as Role];
    let userRoleLevel = Math.max(...userRoles.map(r => roleHierarchy[r] || 0));

    // If any role includes STAFF with MANAGER position, elevate
    if (userRoles.includes(Role.STAFF) && user.staff?.position === 'MANAGER') {
      userRoleLevel = Math.max(userRoleLevel, roleHierarchy[Role.MANAGER]);
    }

    // 1. Direct match: user has at least one of the required roles explicitly
    const directMatch = requiredRoles.some(role => userRoles.includes(role));
    if (directMatch) return true;

    // 2. Hierarchy fallback: higher roles (SUPER_ADMIN, SALON_OWNER) access lower endpoints
    return requiredRoles.some(
      role => userRoleLevel >= roleHierarchy[role],
    );
  }
}
