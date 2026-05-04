import { Process, Processor } from "@nestjs/bull";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { ResourceType } from "@prisma/client";


@Processor('consumo')
export class AntConsumptionProcessor {

    constructor(private prisma: PrismaService) { }

    @Process('calculate-consumption')
    async handleCalculateConsumption(job: Job) {
        console.log('Processing ant consumption job:', job.id, 'with data:', job.data);

        const allAnthillsData = await this.prisma.anthill.findMany({
            select: {
                id: true,
                ants: true,
                antsTotal: true
            }
        });

        const food = await this.prisma.resource.findFirst({
            where: { type: ResourceType.FOOD }
        });

        if (!food) {
            console.log('No food resource found, aborting consumption job.');
            return;
        }

        const updateOperations = allAnthillsData.map(async (anthill) => {
            console.log(`Calculating consumption for anthill ID: ${anthill.id}`);

            const civilConsumption = anthill.ants * 1;
            const militaryConsumption = anthill.antsTotal.reduce((sum, a) => sum + (a.total * 2), 0);
            const totalConsumption = civilConsumption + militaryConsumption;

            console.log(`Consumption for anthill ${anthill.id}: Civil=${civilConsumption}, Military=${militaryConsumption}, Total=${totalConsumption}`);

            // Transacción atómica para evitar race conditions
            await this.prisma.$transaction(async (tx) => {
                const resourceFood = await tx.resourceAnthill.findFirst({
                    where: { anthillId: anthill.id, resourceId: food.id }
                });

                if (!resourceFood) return;

                const currentStock = resourceFood.stock || 0;
                if (currentStock >= totalConsumption) {
                    await tx.resourceAnthill.update({
                        where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: food.id } },
                        data: { stock: { decrement: totalConsumption } }
                    });
                } else {
                    // Recursos insuficientes: poner stock a 0
                    await tx.resourceAnthill.update({
                        where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: food.id } },
                        data: { stock: 0 }
                    });
                    console.log(`⚠️ Anthill ${anthill.id}: comida insuficiente. Stock puesto a 0.`);
                }
            });
        });

        await Promise.all(updateOperations);
    }
}