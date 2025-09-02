import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ResourcesService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async getAllResources(userId) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: Number(userId) },
        });

        if (!anthill) {
            throw new Error('Hormiguero no encontrado para el usuario.');
        }

        const resource = await this.prisma.resourceAnthill.findMany({
            where: { anthillId: anthill.id },
        });

        return resource;
    }
}