import { InjectQueue, Processor, Process } from "@nestjs/bull";
import { Queue } from "bull";
import { Job } from "bullmq";
import { ConstructionService } from "src/construction/construction.service";

@Processor('construccion')
export class ConstructionConsumer {
    constructor(
        @InjectQueue('construccion') private readonly constructionQueue: Queue,
        private readonly constructionService: ConstructionService
    ) { }

    @Process('new_construction')
    async processNewConstruction(job: Job<{ constructionAnthillId }>) {
        const { constructionAnthillId } = job.data;

        let construction = await this.constructionService.finishConstruction(constructionAnthillId);
    }
}