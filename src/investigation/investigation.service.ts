import { InjectQueue } from "@nestjs/bull";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ItemType, ResourceType, InvestigationStatus, ConstructionStatus } from "@prisma/client";
import { Queue } from "bull";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class InvestigationService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('investigation') private readonly investigationQueue: Queue
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
                const level = 1
                const cost = this.calculateCosts(investigation, level);
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

    async startInvestigation(userId: number, investigationId: number, instanceId?: number) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: userId },
            include: {
                investigations: true,
                resources: { include: { resource: true } }
            }
        });

        if (!anthill) throw new NotFoundException('Hormiguero no encontrado');

        const investigation = await this.prisma.investigation.findUnique({ where: { id: investigationId } });
        if (!investigation) throw new NotFoundException('Investigación no encontrada');

        let targetLevel = 1;
        let investigationAnthillInstance;

        if (instanceId) {
            investigationAnthillInstance = anthill.investigations.find(i => i.id === instanceId);
            if (!investigationAnthillInstance) throw new NotFoundException('Instancia de investigación no encontrada');
            if (investigationAnthillInstance.status !== InvestigationStatus.COMPLETED) throw new BadRequestException('La investigación ya está en proceso');
            targetLevel = investigationAnthillInstance.level + 1;
        } else {
            const userInstances = anthill.investigations.filter(i => i.investigationId === investigationId);
            if (userInstances.length >= 1) throw new BadRequestException('Ya tienes una investigación en curso');
        }

        const cost = this.calculateCosts(investigation, targetLevel);

        const requirements = await this.prisma.requirement.findMany({
            where: {
                targetId: investigationId,
                targetType: ItemType.INVESTIGATION,
                targetLevel: targetLevel
            }
        });

        if (!this.checkRequirements(requirements, anthill)) throw new BadRequestException('No cumples los requisitos');
        if (!this.checkResources(cost, anthill)) throw new BadRequestException('No tienes suficientes recursos');
        if (anthill.ants - anthill.antsBusy < investigation.base_ants * targetLevel) throw new BadRequestException('No hay hormigas suficientes');

        const duration = cost.time * targetLevel;
        const finishingAt = new Date(Date.now() + duration * 1000);

        const result = await this.prisma.$transaction(async (tx) => {
            for (const [resType, amount] of Object.entries(cost)) {
                if (resType !== 'time' && (amount as number) > 0) {
                    const resource = anthill.resources.find(r => r.resource.type == resType);
                    if (resource) {
                        await tx.resourceAnthill.update({
                            where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: resource.resourceId } },
                            data: { stock: { decrement: (amount as number) * targetLevel } }
                        });
                    }
                }
            }

            await tx.anthill.update({
                where: { id: anthill.id },
                data: { ants: { decrement: investigation.base_ants * targetLevel } }
            });

            let ca;
            if (instanceId) {
                ca = await tx.investigationAnthill.update({
                    where: { id: instanceId },
                    data: {
                        level: targetLevel,
                        status: InvestigationStatus.INVESTIGATING,
                        finishingAt: finishingAt
                    }
                })
            } else {
                ca = await tx.investigationAnthill.create({
                    data: {
                        anthillId: anthill.id,
                        investigationId: investigation.id,
                        level: targetLevel,
                        status: InvestigationStatus.INVESTIGATING,
                        finishingAt: finishingAt
                    }
                })
            }
            return ca;
        })

        await this.investigationQueue.add(
            'new_investigation',
            { investigationAnthillId: result.id, },
            { delay: duration * 1000 }
        );

        return {
            message: 'Investigación iniciada',
            investigationAnthill: result,
            finishingAt
        };
    }

    async finishInvestigation(investigationAnthillId: number) {
        const ia = await this.prisma.investigationAnthill.findUnique({
            where: { id: investigationAnthillId },
            include: { investigation: true }
        });

        if (!ia) return;

        await this.prisma.$transaction([
            this.prisma.investigationAnthill.update({
                where: { id: investigationAnthillId },
                data: { status: InvestigationStatus.COMPLETED, finishingAt: null }
            })
        ]);
    }

    private calculateCosts(investigation: any, level: number) {
        const mult = Math.pow(investigation.multiplier, level - 1);
        return {
            [ResourceType.FOOD]: Math.floor(investigation.base_food * mult),
            [ResourceType.WOOD]: Math.floor(investigation.base_wood * mult),
            [ResourceType.LEAD]: Math.floor(investigation.base_lead * mult),
            ['ANTS']: Math.floor(investigation.base_ants * mult),
            time: Math.floor(investigation.base_time * mult),
        };
    }

    private checkRequirements(requirements: any[], anthill: any) {
        if (!requirements || !Array.isArray(requirements)) return true;

        for (const req of requirements) {
            if (req.requiredType === ItemType.CONSTRUCTION) {
                const hasIt = (anthill.constructions ?? []).some(c =>
                    c.construccionId == req.requiredId &&
                    c.level >= req.requiredLevel &&
                    c.status === ConstructionStatus.COMPLETED
                )
                if (!hasIt) return false;
            } else if (req.requiredType === ItemType.INVESTIGATION) {
                const hasIt = (anthill.investigations ?? []).some(i =>
                    i.investigationId == req.requiredId &&
                    i.level >= req.requiredLevel &&
                    i.status === InvestigationStatus.COMPLETED
                )
                if (!hasIt) return false;
            }
        }

        return true;
    }

    private checkResources(cost: any, anthill: any) {
        for (const [resType, amount] of Object.entries(cost)) {
            if (resType === 'time' || resType === 'ANTS') continue;
            const userRes = anthill.resources.find(r => r.resource.type === resType);
            if (!userRes || userRes.stock < (amount as number)) return false;
        }
        if (cost.ANTS > anthill.ants - anthill.antsBusy) return false;
        return true;
    }
}