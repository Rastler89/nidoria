import { PrismaClient, ItemType } from "@prisma/client";
import { REQUIREMENTS } from "../data/requirements.data";

export async function seedRequirements(prisma: PrismaClient) {

    var getItem = async (type: string, id: number) => {
        let item;
        switch (type) {
            case ItemType.CONSTRUCTION:
                item = await prisma.construction.findUnique({
                    where: {
                        id: id,
                    },
                });
                break;
            case ItemType.INVESTIGATION:
                item = await prisma.investigation.findUnique({
                    where: {
                        id: id,
                    },
                });
                break;
            case ItemType.ANT:
                item = await prisma.ant.findUnique({
                    where: {
                        id: id,
                    },
                });
                break;
        }

        return item;
    }

    for (const requirement of REQUIREMENTS) {

        const target = await getItem(requirement.targetType, requirement.targetId);

        if (!target) {
            console.log(`Item ${requirement.targetType} ${requirement.targetId} not found`);
            continue;
        }

        const required = await getItem(requirement.requiredType, requirement.requiredId);

        if (!required) {
            console.log(`Item ${requirement.requiredType} ${requirement.requiredId} not found`);
            continue;
        }

        await prisma.requirement.create({
            data: {
                targetType: requirement.targetType,
                targetId: requirement.targetId,
                targetLevel: requirement.targetLevel,
                requiredType: requirement.requiredType,
                requiredId: requirement.requiredId,
                requiredLevel: requirement.requiredLevel,
            },
        });
    }

    console.log('✔ Requirements seeded');
}

