import { InjectQueue } from "@nestjs/bull";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ItemType, ResourceType, InvestigationStatus } from "@prisma/client";
import { Queue } from "bull";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class InvestigationService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('investigacion') private queue: Queue
    ) { }

    async getUserInvestigations(userId: number) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: userId },
            include: {
                investigations: {
                    include: {
                        investigation: true
                    },
                },
            },
        });

        if (!anthill) throw new NotFoundException('Hormiguero no encontrado');
        return anthill.investigations;
    }

    async getAvailableInvestigations(userId: number) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: userId },
            include: {
                constructions: { include: { construction: true } },
                investigations: { include: { investigation: true } },
                resources: { include: { resource: true } },
            }
        });

        if (!anthill) throw new NotFoundException('Hormiguero no encontrado');

        const allInvestigations = await this.prisma.investigation.findMany();
        const allRequirements = await this.prisma.requirement.findMany({
            where: { targetType: ItemType.INVESTIGATION }
        });

        const availableActions = [];

        for (const investigation of allInvestigations) {
            const userInstances = anthill.investigations.filter(i => i.investigationId === investigation.id);

            if (userInstances.length < 1) {
                const cost = this.calculateCosts(investigation);
                const requirements = allRequirements.filter(r => r.targetId === investigation.id);
                const reqMet = this.checkRequirements(requirements, anthill);
                const resMet = this.checkResources(cost, anthill);

                availableActions.push({
                    type: 'NEW',
                    investigation,
                    level,
                    cost,
                    requirements,
                    requirementsMet: reqMet,
                    resourcesMet: resMet,
                });
            }

            for (const instance of userInstances) {
                if (instance.status === InvestigationStatus.COMPLETED) {
                    const nextLevel = instance.level + 1;
                    const cost = this.calculateCosts(investigation, nextLevel);
                    const requirements = allRequirements.filter(r => r.targetId === investigation.id);
                    const reqMet = this.checkRequirements(requirements, anthill);
                    const resMet = this.checkResources(cost, anthill);

                    availableActions.push({
                        type: 'UPGRADE',
                        investigation,
                        level: nextLevel,
                        cost,
                        requirements,
                        requirementsMet: reqMet,
                        resourcesMet: resMet,
                    });
                }
            }
        }
        return availableActions;
    }
}