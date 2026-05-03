import { InjectQueue, OnQueueActive, OnQueueCompleted, Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job, Queue } from "bull";
import { ColoniesService } from "../colonies/colonies.services";
import { AnthillGateway } from "../gateway/stats.controller";
import { PrismaService } from "../prisma/prisma.service";
import { ANTHILL_CONFIG } from "../config/anthill.config";
import { ResourceType } from "@prisma/client";

@Processor('cria')
export class QueenDataConsumer {
  constructor(
    @InjectQueue('cria') private queue: Queue,
    private readonly colonyService: ColoniesService,
    private readonly anthillGateway: AnthillGateway,
    private readonly prisma: PrismaService,
  ) { }

  @Process('new_egg')
  async processqueenData(job: Job<{ userId: string }>) {
    const { userId } = job.data;

    // Comprobar si la colonia debe pausarse (sin comida + inactiva 7 días)
    const shouldPause = await this.shouldPauseColony(userId);
    if (shouldPause) {
      Logger.log(`🛑 Colonia del usuario ${userId} pausada: sin comida y sin actividad en 7 días.`);
      return; // No re-encolar — el ciclo se reanudará al reconectar
    }

    let egg = await this.colonyService.addEggToColony(userId);

    const newEggTimeInMinutes = await this.colonyService.getNewEggTimeInMinutes(userId);
    const delayInMilliseconds = newEggTimeInMinutes * 60 * 1000;

    await this.queue.add('new_egg', { userId }, {
      delay: delayInMilliseconds,
      removeOnComplete: true,
      removeOnFail: true,
    });
    Logger.log(`Próxima puesta de huevo para ${userId} programada en ${newEggTimeInMinutes} minutos.`);

    if (!egg) return;

    const delayInMillisecondsForLarva = 1.5 * 60 * 1000; // 1.5 minutos
    await this.queue.add('egg_to_larva', { userId }, {
      delay: delayInMillisecondsForLarva,
      removeOnComplete: true,
      removeOnFail: true,
    });

    this.anthillGateway.sendUpdate(userId);

  }

  @Process('egg_to_larva')
  async processEggToLarva(job: Job<{ userId: string }>) {
    const { userId } = job.data;

    let larva = await this.colonyService.convertEggToLarva(userId);

    const delayInMilliseconds = 2 * 60 * 1000; // 2 minutos

    if (!larva) return;

    await this.queue.add('larva_to_ant', { userId }, {
      delay: delayInMilliseconds,
      removeOnComplete: true,
      removeOnFail: true,
    });
  }

  @Process('larva_to_ant')
  async processLarvaToAnt(job: Job<{ userId: string }>) {
    const { userId } = job.data;

    await this.colonyService.convertLarvaToAnt(userId);
    this.anthillGateway.sendUpdate(userId);
  }

  @OnQueueActive()
  onActive(job: Job<{ userId: string }>) {
    // Log that job is starting
    Logger.log(`Starting job ${job.id} : ${job.data['custom_id']}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<{ userId: string }>) {
    // Log job completion status
    Logger.log(`Job ${job.id} has been finished`);
  }

  /**
   * Comprueba si la colonia debe pausarse.
   * Se pausa si NO tiene comida suficiente para un huevo Y el usuario no ha entrado en 7 días.
   */
  private async shouldPauseColony(userId: string): Promise<boolean> {
    try {
      const anthill = await this.prisma.anthill.findFirst({
        where: { ownerId: Number(userId) },
        include: {
          owner: { select: { lastLogin: true } },
          resources: { include: { resource: true } }
        }
      });

      if (!anthill) return true; // Sin hormiguero, pausar

      const foodResource = anthill.resources.find(r => r.resource.type === ResourceType.FOOD);
      const hasEnoughFood = foodResource && foodResource.stock >= ANTHILL_CONFIG.BIOLOGY.EGG_COST_FOOD;

      if (hasEnoughFood) return false; // Tiene comida, no pausar

      // Sin comida — comprobar si el usuario está activo
      const lastLogin = anthill.owner?.lastLogin;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const isInactive = !lastLogin || lastLogin < sevenDaysAgo;

      return isInactive; // Pausar solo si también está inactivo
    } catch (e) {
      Logger.error(`Error comprobando pausa de colonia: ${e.message}`);
      return false; // En caso de error, no pausar
    }
  }
}