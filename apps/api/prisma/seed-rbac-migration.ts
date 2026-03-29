/**
 * RBAC Migration Script — Phase 1
 *
 * Creates UserRole records for ALL existing Staff records that don't have one.
 * Maps Staff.position → Role enum using the canonical POSITION_TO_ROLE mapping.
 *
 * Run once: npx ts-node prisma/seed-rbac-migration.ts
 */

import { PrismaClient, Role, StaffPosition } from '@prisma/client';

const prisma = new PrismaClient();

// Canonical mapping: job title → auth role
// STYLIST, SENIOR_STYLIST, MASTER_STYLIST all map to BARBER (same permissions)
const POSITION_TO_ROLE: Record<string, Role> = {
  [StaffPosition.BARBER]: Role.BARBER,
  [StaffPosition.STYLIST]: Role.BARBER,
  [StaffPosition.SENIOR_STYLIST]: Role.BARBER,
  [StaffPosition.MASTER_STYLIST]: Role.BARBER,
  [StaffPosition.SKINNER]: Role.SKINNER,
  [StaffPosition.CASHIER]: Role.CASHIER,
  [StaffPosition.MANAGER]: Role.MANAGER,
};

const ROLE_PRIORITY: Record<string, number> = {
  SUPER_ADMIN: 100,
  SALON_OWNER: 50,
  MANAGER: 40,
  CASHIER: 25,
  BARBER: 25,
  SKINNER: 25,
  STAFF: 25,
  CUSTOMER: 10,
};

async function main() {
  console.log('🚀 Starting RBAC Migration...\n');

  // 1. Fetch all staff with their user and salon info
  const allStaff = await prisma.staff.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  console.log(`📊 Found ${allStaff.length} staff records to process\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const staff of allStaff) {
    try {
      const authRole = POSITION_TO_ROLE[staff.position] ?? Role.STAFF;

      // Check existing UserRole for this user+salon combo
      const existingUserRole = await prisma.userRole.findFirst({
        where: {
          userId: staff.userId,
          salonId: staff.salonId,
        },
      });

      if (!existingUserRole) {
        // Create UserRole record
        await prisma.userRole.create({
          data: {
            userId: staff.userId,
            role: authRole,
            salonId: staff.salonId,
          },
        });

        // Sync User.role to the highest-priority role from UserRole table
        const allUserRoles = await prisma.userRole.findMany({
          where: { userId: staff.userId },
          select: { role: true },
        });

        const highestRole = allUserRoles.reduce((best, ur) => {
          return (ROLE_PRIORITY[ur.role] ?? 0) > (ROLE_PRIORITY[best] ?? 0)
            ? ur.role
            : best;
        }, authRole as string);

        await prisma.user.update({
          where: { id: staff.userId },
          data: { role: highestRole as Role },
        });

        console.log(
          `  ✅ ${staff.user.name || staff.user.email} | position: ${staff.position} → role: ${authRole}`,
        );
        created++;
      } else {
        console.log(
          `  ⏭️  ${staff.user.name || staff.user.email} | already has UserRole (${existingUserRole.role}), skipping`,
        );
        skipped++;
      }
    } catch (err) {
      console.error(
        `  ❌ Error processing staff ${staff.userId}:`,
        (err as Error).message,
      );
      errors++;
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅ Created: ${created} UserRole records`);
  console.log(`⏭️  Skipped: ${skipped} (already had UserRole)`);
  if (errors > 0) console.log(`❌ Errors:  ${errors}`);
  console.log('─────────────────────────────────────────');
  console.log('\n✨ RBAC Migration complete!\n');
}

main()
  .catch((e) => {
    console.error('🔥 Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
