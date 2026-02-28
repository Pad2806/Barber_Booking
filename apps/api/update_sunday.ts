import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating Sunday schedules...');

    const result = await prisma.staffSchedule.updateMany({
        where: {
            dayOfWeek: 0,
        },
        data: {
            isOff: false,
            startTime: '08:00',
            endTime: '12:00',
        }
    });

    console.log(`Successfully updated ${result.count} staff schedules for Sunday.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
