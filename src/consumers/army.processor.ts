import { Process, Processor, OnQueueActive, OnQueueCompleted } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { AnthillGateway } from "../gateway/stats.controller";

@Processor('reclutamiento')
export class ArmyProcessor {
  private readonly logger = new Logger(ArmyProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anthillGateway: AnthillGateway,
  ) { }

  @Process('recruit_units')
  async handleRecruitment(job: Job<{ anthillId: number, antId: number, quantity: number }>) {
    const { anthillId, antId, quantity } = job.data;
    this.logger.log(`Finalizando reclutamiento de ${quantity} unidades (ID: ${antId}) para hormiguero ${anthillId}`);

    try {
        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Actualizar/Crear registro de hormigas
            const antsAnthill = await tx.antsAnthill.upsert({
                where: {
                    antId_anthillId: {
                        antId: antId,
                        anthillId: anthillId
                    }
                },
                update: {
                    total: { increment: quantity }
                },
                create: {
                    antId: antId,
                    anthillId: anthillId,
                    total: quantity,
                    busy: 0
                }
            });

            // 2. Sumar puntos al ranking
            const antCatalog = await tx.ant.findUnique({ where: { id: antId } });
            const pts = (antCatalog?.points || 0) * quantity;
            
            const anthill = await tx.anthill.findUnique({ where: { id: anthillId } });
            if (anthill) {
                const newPowerMilitary = anthill.powerMilitary + pts;
                const newPowerTotal = anthill.powerTotal + pts;

                await tx.anthill.update({
                    where: { id: anthillId },
                    data: {
                        powerMilitary: newPowerMilitary,
                        powerTotal: newPowerTotal
                    }
                });
            }

            return anthill;
        });

        // Notificar al usuario a través del socket
        if (result) {
            await this.anthillGateway.sendUpdate(result.ownerId.toString());
        }

        this.logger.log(`Reclutamiento completado con éxito.`);
    } catch (error) {
        this.logger.error(`Error procesando reclutamiento: ${error.message}`);
        throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Procesando trabajo ${job.id} de reclutamiento...`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Trabajo ${job.id} completado.`);
  }
}
