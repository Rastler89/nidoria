import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';
import { ConstructionsService } from '../constructions/constructions.service';

@Processor('construccion')
export class ConstructionProcessor {
  constructor(private readonly constructionsService: ConstructionsService) {}

  @Process('finish-construction')
  async handleFinishConstruction(job: Job<{ constructionAnthillId: number }>) {
    await this.constructionsService.finishConstruction(job.data.constructionAnthillId);
  }
}
