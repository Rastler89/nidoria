import { PrismaClient, ItemType } from "@prisma/client";
import { requirements } from "../data/requirements.data";

export async function seedRequirements(prisma: PrismaClient) {

    var getItem = async (type: string, code: string) => {
        let item;
        switch (type) {
            case ItemType.CONSTRUCTION:
                item = await prisma.construction.findUnique({
                    where: {
                        code: code,
                    },
                });
                break;
            case ItemType.INVESTIGATION:
                item = await prisma.investigation.findUnique({
                    where: {
                        code: code,
                    },
                });
                break;
            case ItemType.ANT:
                item = await prisma.ant.findUnique({
                    where: {
                        code: code,
                    },
                });
                break;
        }

        return item;
    }

    for (const requirement of requirements) {

        const target = await getItem(requirement.targetType, requirement.targetCode);

        if (!target) {
            console.log(`Item ${requirement.targetType} ${requirement.targetCode} not found`);
            continue;
        }

        const required = await getItem(requirement.requiredType, requirement.requiredCode);

        if (!required) {
            console.log(`Item ${requirement.requiredType} ${requirement.requiredCode} not found`);
            continue;
        }
        await prisma.requirement.create({
            data: {
                targetType: requirement.targetType,
                targetId: target.id,
                requiredType: requirement.requiredType,
                requiredId: required.id,
                targetLevel: requirement.targetLevel,
                requiredLevel: requirement.requiredLevel,
            },
        });
    }

    console.log('✔ Requirements seeded');
}

