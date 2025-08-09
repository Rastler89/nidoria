import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ColoniesService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async createColonyForUser(userId: number) {
        const colony = await this.prisma.colony.create({
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
        });

        //Todo: agregar cola para la reina

        return colony;
    }
}