/**
 * Fix Duplicate UserRole records
 *
 * Root cause: unique constraint is (userId, role, salonId)
 * So BARBER+salonId=X and BARBER+salonId=null are DIFFERENT keys — both allowed.
 * This script keeps the record with a real salonId and deletes the null duplicate.
 *
 * Run: npx ts-node --transpile-only prisma/fix-duplicate-roles.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Scanning for duplicate UserRole records...\n');

  const allRoles = await prisma.userRole.findMany({
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { name: true, email: true } } },
  });

  // Group by (userId, role) — duplicates = same userId+role but different salonId
  const groupMap = new Map<string, typeof allRoles>();

  for (const ur of allRoles) {
    const key = `${ur.userId}|${ur.role}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(ur);
  }

  let deleted = 0;

  for (const [key, records] of groupMap.entries()) {
    if (records.length <= 1) continue;

    console.log(`⚠️  Duplicate found for ${records[0].user.name || records[0].user.email} — role: ${records[0].role}`);
    records.forEach(r => console.log(`   id=${r.id} salonId=${r.salonId} createdAt=${r.createdAt.toISOString()}`));

    // Strategy: keep record with real salonId (not null), delete the rest
    // If all have salonId or all are null, keep the oldest
    const withSalon = records.filter(r => r.salonId !== null);
    const toKeep = withSalon.length > 0 ? withSalon[0] : records[0];
    const toDelete = records.filter(r => r.id !== toKeep.id);

    for (const dup of toDelete) {
      await prisma.userRole.delete({ where: { id: dup.id } });
      console.log(`   ✅ Deleted duplicate id=${dup.id} salonId=${dup.salonId}`);
      deleted++;
    }
    console.log(`   ✅ Kept id=${toKeep.id} salonId=${toKeep.salonId}\n`);
  }

  console.log('─────────────────────────────────────────');
  if (deleted === 0) {
    console.log('✅ No duplicates found — DB is clean!');
  } else {
    console.log(`✅ Removed ${deleted} duplicate UserRole records.`);
  }
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('🔥 Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
