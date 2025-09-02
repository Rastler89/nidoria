import { InjectQueue, OnQueueActive, OnQueueCompleted, Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job, Queue } from "bull";
import { ColoniesService } from "src/colonies/colonies.services";

@Processor('cria')
export class QueenDataConsumer {
    constructor(
      @InjectQueue('cria') private queue: Queue,
      private readonly colonyService: ColoniesService,
    ) {}

    @Process('new_egg')
    async processqueenData(job: Job<{ userId: string}>) {
      const { userId } = job.data;

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
      
      const delayInMillisecondsForLarva = 1.5 * 60 * 1000; // 5 minutos
      await this.queue.add('egg_to_larva', { userId }, {
          delay: delayInMillisecondsForLarva,
          removeOnComplete: true,
          removeOnFail: true,
      });

    }

    @Process('egg_to_larva')
    async processEggToLarva(job: Job<{ userId: string}>) {
      const { userId } = job.data;

      let larva = await this.colonyService.convertEggToLarva(userId);

      const delayInMilliseconds = 2 * 60 * 1000; // 5 minutos

      if (!larva) return;

      await this.queue.add('larva_to_ant', { userId }, {
        delay: delayInMilliseconds,
        removeOnComplete: true,
        removeOnFail: true,
      }); 
    }

    @Process('larva_to_ant')
    async processLarvaToAnt(job: Job<{ userId: string}>) {
      const { userId } = job.data;

      await this.colonyService.convertLarvaToAnt(userId);
    } 

    @OnQueueActive()
      onActive(job: Job<{ userId: string}>) {
        // Log that job is starting
        Logger.log(`Starting job ${job.id} : ${job.data['custom_id']}`);
      }
    
      @OnQueueCompleted()
      onCompleted(job: Job<{ userId: string}>) {
        // Log job completion status
        Logger.log(`Job ${job.id} has been finished`);
      }
}