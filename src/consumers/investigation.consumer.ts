import { InjectQueue, Processor, Process } from "@nestjs/bull";
import { Queue } from "bull";
import { Job } from "bullmq";
import { InvestigationService } from "src/investigation/investigation.service";
import { PrismaService } from "../prisma/prisma.service";
import { AnthillGateway } from "../gateway/stats.controller";

@Processor('investigation')
export class InvestigationConsumer {
    constructor(
        @InjectQueue('investigation') private readonly investigationQueue: Queue,
        private readonly investigationService: InvestigationService,
        private readonly prisma: PrismaService,
        private readonly anthillGateway: AnthillGateway,
    ) { }

    @Process('new_investigation')
    async processNewInvestigation(job: Job<{ investigationAnthillId }>) {
        const { investigationAnthillId } = job.data;

        await this.investigationService.finishInvestigation(investigationAnthillId);

        // Notificar al usuario vía WebSocket
        const ia = await this.prisma.investigationAnthill.findUnique({
            where: { id: investigationAnthillId },
            include: { anthill: { select: { ownerId: true } } }
        });
        if (ia?.anthill) {
            await this.anthillGateway.sendUpdate(ia.anthill.ownerId.toString());
        }
    }
}
