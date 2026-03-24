import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ResourcesService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async getAllResources(userId) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: parseInt(userId) },
            include: {
                resources: { include: { resource: true } },
                constructions: { include: { construction: true } },
                investigations: { include: { investigation: true } },
                antsTotal: { include: { ant: true } },
            },
        });


        if (!anthill) {
            throw new Error('Hormiguero no encontrado para el usuario.');
        }

        const resource = await this.prisma.resourceAnthill.findMany({
            where: { anthillId: anthill.id },
        });

        const gameState = {
            stats: {
                eggs: anthill.eggs,
                larva: anthill.larva,
                ants: anthill.ants,
                antsBusy: anthill.antsBusy,
            },
            resources: anthill.resources.map((r) => ({
                type: r.resource.name,
                stock: r.stock,
            })),
            buildings: anthill.constructions.map((c) => ({
                id: c.construction.id,
                name: c.construction.name,
                code: c.construction.code,
                level: c.level,
                status: c.status,
                finishingAt: c.finishingAt,
            })),
            techs: anthill.investigations.map((i) => ({
                id: i.investigation.id,
                name: i.investigation.name,
                level: i.level,
                status: i.status,
            })),
            army: anthill.antsTotal.map((a) => ({
                type: a.ant.type,
                name: a.ant.name,
                total: a.total,
                busy: a.busy,
            })),
        };

        return gameState;
    }
}