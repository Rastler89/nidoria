import { PrismaClient } from '@prisma/client';
import { seedResources } from './seeders/resources.seeder';
import { seedAnts } from './seeders/ants.seeder';
import { seedStructures } from './seeders/structures.seeder';
import { seedInvestigations } from './seeders/investigation.seeder';
import { seedRequirements } from './seeders/requirements.seeder';
import { seedAdminUser } from './seeders/users.seeder';
import { seedMonsters } from './seeders/monsters.seeder';


const prisma = new PrismaClient();

async function main() {
    const target = process.argv[2]; // structures | researches | units | monsters | all

    console.log('🌱 Seeding:', target ?? 'all');

    await seedResources(prisma); // siempre primero
    await seedAdminUser(prisma); // siempre: garantiza el admin inicial

    if (!target || target === 'all') {
        await seedAnts(prisma);
        await seedStructures(prisma);
        await seedInvestigations(prisma);
        await seedRequirements(prisma);
        await seedMonsters(prisma);
        // Misiones iniciales
        await prisma.mission.upsert({
            where: { key: 'starter_ants_15' },
            update: {},
            create: { key: 'starter_ants_15', title: 'Primeras 15 obreras', description: 'Alcanza tener al menos 15 hormigas en tu colonia.', conditionType: 'HAVE_ANTS', target: 15, rewardFood: 100, rewardWood: 50, rewardLead: 20, sortOrder: 1, active: true },
        });
        await prisma.mission.upsert({
            where: { key: 'starter_food_200' },
            update: {},
            create: { key: 'starter_food_200', title: 'Reserva de comida', description: 'Consigue al menos 200 de comida en almacen.', conditionType: 'HAVE_FOOD_STOCK', target: 200, rewardFood: 50, rewardWood: 30, rewardLead: 10, sortOrder: 2, active: true },
        });
        await prisma.mission.upsert({
            where: { key: 'starter_build_1' },
            update: {},
            create: { key: 'starter_build_1', title: 'Primera construccion', description: 'Completa al menos 1 construccion.', conditionType: 'HAVE_CONSTRUCTIONS_COMPLETED', target: 1, rewardFood: 80, rewardWood: 80, rewardLead: 20, sortOrder: 3, active: true },
        });
        console.log('Missions seeded');
        return;
    }

    const map: Record<string, () => Promise<void>> = {
        ants: () => seedAnts(prisma),
        structures: () => seedStructures(prisma),
        investigations: () => seedInvestigations(prisma),
        monsters: () => seedMonsters(prisma),
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