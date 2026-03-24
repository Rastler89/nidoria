import { PrismaClient } from "@prisma/client";
import { STRUCTURES } from "../data/structure.data";

export async function seedStructures(prisma: PrismaClient) {
    for (const structure of STRUCTURES) {
        await prisma.construction.upsert({
            where: { name: structure.name },
            update: structure,
            create: structure,
        });
    }

    console.log('✔ Structures seeded');
}