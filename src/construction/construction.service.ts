import { InjectQueue } from "@nestjs/bull";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConstructionStatus, ItemType, ResourceType } from "@prisma/client";
import { Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";


@Injectable()
export class ConstructionService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('construccion') private readonly constructionQueue: Queue,
    ) { }

    async getUserConstructions(userId: number) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: userId },
            include: {
                constructions: {
                    include: {
                        construction: true
                    },
                },
            },
        });

        if (!anthill) throw new NotFoundException('Hormiguero no encontrado');
        return anthill.constructions;
    }

    async getAvailableConstructions(userId: number) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: userId },
            include: {
                constructions: { include: { construction: true } },
                investigations: { include: { investigation: true } },
                resources: { include: { resource: true } },
            }
        });

        if (!anthill) throw new NotFoundException('Hormiguero no encontrado');

        const allConstructions = await this.prisma.construction.findMany();
        const allRequirements = await this.prisma.requirement.findMany({
            where: { targetType: ItemType.CONSTRUCTION }
        });

        const availableActions = [];

        for (const construction of allConstructions) {
            const userInstances = anthill.constructions.filter(c => c.constructionId === construction.id);

            if (userInstances.length < construction.maxInstances) {
                const level = 1;
                const cost = this.calculateCosts(construction, level);
                const requirements = allRequirements.filter(r => r.targetId === construction.id);
                const reqMet = this.checkRequirements(requirements, anthill);
                const resMet = this.checkResources(cost, anthill);

                availableActions.push({
                    type: 'NEW',
                    construction,
                    level,
                    cost,
                    requirements,
                    requirementsMet: reqMet,
                    resourcesMet: resMet,
                });
            }

            for (const instance of userInstances) {
                if (instance.status === ConstructionStatus.COMPLETED) {
                    const nextLevel = instance.level + 1;
                    const cost = this.calculateCosts(construction, nextLevel);
                    const requirements = allRequirements.filter(r => r.targetId === construction.id);
                    const reqMet = this.checkRequirements(requirements, anthill);
                    const resMet = this.checkResources(cost, anthill);

                    availableActions.push({
                        type: 'UPGRADE',
                        instanceId: instance.id,
                        construction,
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

    async startConstruction(userId: number, constructionId: number, instanceId?: number) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: userId },
            include: {
                constructions: true,
                resources: { include: { resource: true } }
            }
        });

        if (!anthill) throw new NotFoundException('Hormiguero no encontrado');

        const construction = await this.prisma.construction.findUnique({ where: { id: constructionId } });
        if (!construction) throw new NotFoundException('Construcción no encontrada');

        let targetLevel = 1;
        let constructionAnthillInstance;

        if (instanceId) {
            constructionAnthillInstance = anthill.constructions.find(c => c.id === instanceId);
            if (!constructionAnthillInstance) throw new NotFoundException('Instancia de construcción no encontrada');
            if (constructionAnthillInstance.status !== ConstructionStatus.COMPLETED) throw new BadRequestException('La construcción ya está en proceso');
            targetLevel = constructionAnthillInstance.level + 1;
        } else {
            const userInstances = anthill.constructions.filter(c => c.constructionId === constructionId);
            if (userInstances.length >= construction.maxInstances) throw new BadRequestException('Límite de instancias alcanzado');
        }

        const cost = this.calculateCosts(construction, targetLevel);

        // Verificar requisitos
        const requirements = await this.prisma.requirement.findMany({
            where: { targetId: constructionId, targetType: ItemType.CONSTRUCTION, targetLevel }
        });
        if (!this.checkRequirements(requirements, anthill)) throw new BadRequestException('No se cumplen los requisitos');

        // Verificar recursos
        if (!this.checkResources(cost, anthill)) throw new BadRequestException('Recursos insuficientes');

        // Verificar hormigas
        if (anthill.ants - anthill.antsBusy < construction.base_ants * targetLevel) throw new BadRequestException('Hormigas insuficientes');

        const duration = cost.time * targetLevel;
        const finishingAt = new Date(Date.now() + duration * 1000);

        // Iniciar transacción
        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Deducir recursos
            for (const [resType, amount] of Object.entries(cost)) {
                if (resType !== 'time' && (amount as number) > 0) {
                    const resource = anthill.resources.find(r => r.resource.type === resType);
                    if (resource) {
                        await tx.resourceAnthill.update({
                            where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: resource.resourceId } },
                            data: { stock: { decrement: (amount as number) * targetLevel } }
                        });
                    }
                }
            }

            // 2. Incrementar hormigas ocupadas <-- restar hormigas del total
            await tx.anthill.update({
                where: { id: anthill.id },
                data: { ants: { decrement: construction.base_ants * targetLevel } }
            });

            // 3. Crear o actualizar registro de construcción
            let ca;
            if (instanceId) {
                ca = await tx.constructionAnthill.update({
                    where: { id: instanceId },
                    data: {
                        level: targetLevel,
                        status: ConstructionStatus.BUILDING,
                        finishingAt
                    }
                });
            } else {
                ca = await tx.constructionAnthill.create({
                    data: {
                        anthillId: anthill.id,
                        constructionId: construction.id,
                        level: targetLevel,
                        status: ConstructionStatus.BUILDING,
                        finishingAt
                    }
                });
            }
            return ca;
        });

        // Añadir a la cola
        await this.constructionQueue.add(
            'new_construction',
            { constructionAnthillId: result.id, },
            { delay: duration * 1000 }
        );

        return {
            message: 'Construcción iniciada',
            constructionAnthill: result,
            finishingAt
        };
    }

    async finishConstruction(constructionAnthillId: number) {
        const ca = await this.prisma.constructionAnthill.findUnique({
            where: { id: constructionAnthillId },
            include: { construction: true }
        });

        if (!ca) return;

        await this.prisma.$transaction([
            this.prisma.constructionAnthill.update({
                where: { id: constructionAnthillId },
                data: { status: ConstructionStatus.COMPLETED, finishingAt: null }
            })
        ]);
    }

    private calculateCosts(construction: any, level: number) {
        const mult = Math.pow(construction.multiplier, level - 1);
        return {
            [ResourceType.FOOD]: Math.floor(construction.base_food * mult),
            [ResourceType.WOOD]: Math.floor(construction.base_wood * mult),
            [ResourceType.LEAD]: Math.floor(construction.base_lead * mult),
            ['ANTS']: Math.floor(construction.base_ants * mult),
            time: Math.floor(construction.base_time * mult),
        };
    }

    private checkRequirements(requirements: any[], anthill: any) {
        // 1. Verificación de seguridad inicial
        if (!requirements || !Array.isArray(requirements)) return true;

        for (const req of requirements) {
            if (req.requiredType === ItemType.CONSTRUCTION) {
                // Añadimos ?. y || [] para asegurar que siempre haya un array
                const hasIt = (anthill.constructions ?? []).some(c =>
                    c.constructionId === req.requiredId &&
                    c.level >= req.requiredLevel &&
                    c.status === ConstructionStatus.COMPLETED
                );
                if (!hasIt) return false;

            } else if (req.requiredType === ItemType.INVESTIGATION) {
                // Lo mismo para investigaciones
                const hasIt = (anthill.investigations ?? []).some(i =>
                    i.investigationId === req.requiredId &&
                    i.level >= req.requiredLevel
                );
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