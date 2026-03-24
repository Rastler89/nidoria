import { PrismaClient } from '@prisma/client';
import { seedResources } from './seeders/resources.seeder';
import { seedAnts } from './seeders/ants.seeder';
import { seedStructures } from './seeders/structures.seeder';
import { seedInvestigations } from './seeders/investigation.seeder';
import { seedRequirements } from './seeders/requirements.seeder';


const prisma = new PrismaClient();

async function main() {
    const target = process.argv[2]; // structures | researches | units | all

    console.log('🌱 Seeding:', target ?? 'all');

    await seedResources(prisma); // siempre primero

    if (!target || target === 'all') {
        await seedAnts(prisma);
        await seedStructures(prisma);
        await seedInvestigations(prisma);
        await seedRequirements(prisma);
        return;
    }

    const map: Record<string, () => Promise<void>> = {
        ants: () => seedAnts(prisma),
        structures: () => seedStructures(prisma),
        investigations: () => seedInvestigations(prisma),
    };

    if (!map[target]) {
        throw new Error(`Seeder desconocido: ${target}`);
    }

    await map[target]();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());