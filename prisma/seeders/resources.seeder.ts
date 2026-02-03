import { PrismaClient, ResourceType } from "@prisma/client";

export async function seedResources(prisma: PrismaClient) {
    const resources = [
        { name: 'Comida', type: ResourceType.FOOD },
        { name: 'Madera', type: ResourceType.WOOD },
        { name: 'Hojas', type: ResourceType.LEAD },
    ];

    for (const r of resources) {
        await prisma.resource.upsert({
            where: { name: r.name },
            update: r,
            create: r,
        });
    }

    console.log('✔ Resources seeded');
}