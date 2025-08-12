import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Queue } from "bull";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ColoniesService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('queens') private queue: Queue
    ) {}

    async createColonyForUser(userId: number) {
        /*const colony = await this.prisma.colony.create({
            data: {
                name: `Colony of User ${userId}`,
                ownerId: userId,
                food: 300,
                queenChamber: 1,
                ants: {
                    create: {
                        type: 'queen',
                    },
                },
            },
            include: {
                ants: true,
            },
        });*/

        //Todo: agregar cola para la reina
        console.log('Processing queen for user:', userId);
        return await this.queue.add(
            'process_queen',
            { custom_id: Math.floor(Math.random() * 10000000), userId: userId },
            { priority: 1 },
        );
    }
}