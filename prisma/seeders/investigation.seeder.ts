import { PrismaClient } from "@prisma/client";
import { INVESTIGATIONS } from "../data/investigation.data";

export async function seedInvestigations(prisma: PrismaClient) {
    for (const investigation of INVESTIGATIONS) {
        await prisma.investigation.upsert({
            where: { name: investigation.name },
            update: investigation,
            create: investigation,
        });
    }

    console.log('✔ Investigations seeded');
}