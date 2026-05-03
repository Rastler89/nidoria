import { InjectQueue, Processor, Process } from "@nestjs/bull";
import { Queue } from "bull";
import { Job } from "bullmq";
import { ConstructionService } from "src/construction/construction.service";
import { PrismaService } from "../prisma/prisma.service";
import { AnthillGateway } from "../gateway/stats.controller";

@Processor('construccion')
export class ConstructionConsumer {
    constructor(
        @InjectQueue('construccion') private readonly constructionQueue: Queue,
        private readonly constructionService: ConstructionService,
        private readonly prisma: PrismaService,
        private readonly anthillGateway: AnthillGateway,
    ) { }

    @Process('new_construction')
    async processNewConstruction(job: Job<{ constructionAnthillId }>) {
        const { constructionAnthillId } = job.data;

        await this.constructionService.finishConstruction(constructionAnthillId);

        // Notificar al usuario vía WebSocket
        const ca = await this.prisma.constructionAnthill.findUnique({
            where: { id: constructionAnthillId },
            include: { anthill: { select: { ownerId: true } } }
        });
        if (ca?.anthill) {
            await this.anthillGateway.sendUpdate(ca.anthill.ownerId.toString());
        }
    }
}