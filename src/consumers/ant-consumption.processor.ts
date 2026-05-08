import { Process, Processor } from "@nestjs/bull";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { ResourceType } from "@prisma/client";
import { Logger } from "@nestjs/common";

@Processor('consumo')
export class AntConsumptionProcessor {
    private readonly logger = new Logger(AntConsumptionProcessor.name);
    private readonly CHUNK_SIZE = 100;

    constructor(private prisma: PrismaService) { }

    @Process('calculate-consumption')
    async handleCalculateConsumption(job: Job) {
        this.logger.log(`Iniciando consumo de recursos (Job: ${job.id})`);

        const food = await this.prisma.resource.findFirst({
            where: { type: ResourceType.FOOD }
        });

        if (!food) {
            this.logger.error('No se encontró el recurso FOOD. Abortando.');
            return;
        }

        let skip = 0;
        let hasMore = true;

        while (hasMore) {
            const anthills = await this.prisma.anthill.findMany({
                select: {
                    id: true,
                    ants: true,
                    antsTotal: {
                        select: {
                            total: true
                        }
                    }
                },
                take: this.CHUNK_SIZE,
                skip: skip,
            });

            if (anthills.length === 0) {
                hasMore = false;
                break;
            }

            this.logger.log(`Procesando lote de ${anthills.length} hormigueros (skip: ${skip})`);

            // Procesamos el lote con transacciones individuales para no bloquear toda la tabla
            // pero lo hacemos de forma secuencial dentro del lote para no saturar el pool
            for (const anthill of anthills) {
                try {
                    const civilConsumption = anthill.ants * 1;
                    const militaryConsumption = anthill.antsTotal.reduce((sum, a) => sum + (a.total * 2), 0);
                    const totalConsumption = civilConsumption + militaryConsumption;

                    if (totalConsumption <= 0) continue;

                    await this.prisma.$transaction(async (tx) => {
                        const resource = await tx.resourceAnthill.findFirst({
                            where: { anthillId: anthill.id, resourceId: food.id },
                            select: { stock: true }
                        });

                        if (!resource) return;

                        const newStock = Math.max(0, resource.stock - totalConsumption);

                        await tx.resourceAnthill.update({
                            where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: food.id } },
                            data: { stock: newStock }
                        });
                    });
                } catch (e) {
                    this.logger.error(`Error procesando consumo para hormiguero ${anthill.id}: ${e.message}`);
                }
            }

            skip += this.CHUNK_SIZE;
            
            // Pequeño respiro para el event loop y la DB
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        this.logger.log('Finalizado cálculo de consumo para todos los hormigueros.');
    }
}
