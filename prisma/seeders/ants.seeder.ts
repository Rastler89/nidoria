import { PrismaClient } from '@prisma/client';
import { ANTS } from '../data/ants.data';

export async function seedAnts(prisma: PrismaClient) {
    for (const ant of ANTS) {
        await prisma.ant.upsert({
            where: { name: ant.name },
            update: ant,
            create: ant,
        });
    }

    console.log('✔ Ants seeded');
}