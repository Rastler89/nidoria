import { Process, Processor } from "@nestjs/bull";
import { ResourceType } from "@prisma/client";
import { Job } from "bullmq";
import { PrismaService } from "src/prisma/prisma.service";


@Processor('consumo')
export class AntConsumptionProcessor {

    constructor(private prisma: PrismaService) {}

    @Process('callculate-consumption')
    async handleCalculateConsumption(job: Job) {
        console.log('Processing ant consumption job:', job.id, 'with data:', job.data);

        const allAnthillsData = await this.prisma.anthill.findMany({
            select: {
                id: true,
                ants: true,
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

            // Aquí iría la lógica para calcular y actualizar el consumo de hormigas
            const totalConsumption = anthill.ants * 1; // Ejemplo simple: 1 unidad por hormiga
            console.log(`Total consumption for anthill ID ${anthill.id}: ${totalConsumption}`);
            const resourceFood = await this.prisma.resourceAnthill.findFirst({
                where: { anthillId: anthill.id, resourceId: food.id }
            });
            if (resourceFood) {
                const newQuantity = (resourceFood.stock || 0) - totalConsumption;
                if (newQuantity >= 0) {
                    // Actualizar el stock de comida usando el campo compuesto único generado por Prisma
                    await this.prisma.resourceAnthill.update({
                        where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: food.id } },
                        data: { stock: newQuantity }
                    });
                } else {
                    // Manejar caso de recursos insuficientes
                    
                }
            }
        });

        await Promise.all(updateOperations);
    }
}