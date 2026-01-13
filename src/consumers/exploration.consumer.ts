import { InjectQueue, Processor, Process } from "@nestjs/bull";
import { Queue } from "bull";
import { ExpeditionService } from "../expedition/expedition.services";
import { Job } from "bullmq";

@Processor('exploraciones')
export class ExplorationConsumer {
    constructor(
        @InjectQueue('exploraciones') private readonly queue: Queue,
        private readonly expeditionService: ExpeditionService,
    ) { }

    @Process('exploration')
    async processExploration(job: Job<{ anthillId: number, resourceTypeId: number, ants: number, duration: number }>) {
        const { anthillId, resourceTypeId, ants, duration } = job.data;

        const exploration = await this.expeditionService.finishExpedition(anthillId, resourceTypeId, ants, duration);

    }
}
