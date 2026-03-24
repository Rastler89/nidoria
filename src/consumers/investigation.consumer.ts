import { InjectQueue, Processor, Process } from "@nestjs/bull";
import { Queue } from "bull";
import { Job } from "bullmq";
import { InvestigationService } from "src/investigation/investigation.service";

@Processor('investigation')
export class InvestigationConsumer {
    constructor(
        @InjectQueue('investigation') private readonly investigationQueue: Queue,
        private readonly investigationService: InvestigationService
    ) { }

    @Process('new_investigation')
    async processNewConstruction(job: Job<{ investigationAnthillId }>) {
        const { investigationAnthillId } = job.data;

        let investigation = await this.investigationService.finishInvestigation(investigationAnthillId);
    }
}