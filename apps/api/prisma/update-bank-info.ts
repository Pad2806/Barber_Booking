/**
 * Script to update bank info for all existing salons.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx ts-node prisma/update-bank-info.ts
 * 
 * Or set DATABASE_URL in .env to your production DB URL from Dokploy.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🏦 Updating bank info for all salons...');
    console.log('📡 Database URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@'));

    const result = await prisma.salon.updateMany({
        data: {
            bankCode: '970423',
            bankAccount: '23238628888',
            bankName: 'TPBank',
        },
    });

    console.log(`✅ Updated ${result.count} salon(s) to TPBank / 23238628888`);

    // Also update salon images if they're using placeholder URLs
    const salons = await prisma.salon.findMany({
        select: { id: true, name: true, images: true },
    });

    for (const salon of salons) {
        const images = salon.images as string[];
        const hasPlaceholders = images.some((img: string) => img.includes('placeholder.com'));
        if (hasPlaceholders) {
            await prisma.salon.update({
                where: { id: salon.id },
                data: {
                    images: ['https://images.unsplash.com/photo-1585747860019-8e2e0c35c0e1?w=600&h=400&fit=crop'],
                },
            });
            console.log(`🖼️  Updated images for: ${salon.name}`);
        }
    }

    console.log('🎉 Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
