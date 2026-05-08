import { InjectQueue } from "@nestjs/bull";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ItemType, ResourceType, ConstructionStatus, InvestigationStatus } from "@prisma/client";
import { Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { ResourcesService } from "../resources/resources.service";

@Injectable()
export class ArmyService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('reclutamiento') private readonly recruitmentQueue: Queue,
        private readonly resourcesService: ResourcesService
    ) { }

    async getAvailableAnts(userId: number) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: userId },
            include: {
                constructions: { include: { construction: true } },
                investigations: { include: { investigation: true } },
                resources: { include: { resource: true } },
                antsTotal: { include: { ant: true } }
            }
        });

        if (!anthill) throw new NotFoundException('Hormiguero no encontrado');

        const allAnts = await this.prisma.ant.findMany();
        const allConstructions = await this.prisma.construction.findMany();
        const allInvestigations = await this.prisma.investigation.findMany();

        const allRequirements = await this.prisma.requirement.findMany({
            where: { targetType: ItemType.ANT }
        });

        const availableUnits = [];

        for (const ant of allAnts) {
            const rawRequirements = allRequirements.filter(r => r.targetId === ant.id);

            const requirementsWithNames = rawRequirements.map(req => {
                let name = 'Desconocido';
                if (req.requiredType === ItemType.CONSTRUCTION) {
                    name = allConstructions.find(c => c.id === req.requiredId)?.name || 'Edificio';
                } else if (req.requiredType === ItemType.INVESTIGATION) {
                    name = allInvestigations.find(i => i.id === req.requiredId)?.name || 'Investigación';
                }

                return {
                    ...req,
                    requiredName: name
                };
            });

            const reqMet = this.checkRequirements(rawRequirements, anthill);
            const cost = {
                [ResourceType.FOOD]: ant.base_food,
                [ResourceType.WOOD]: ant.base_wood,
                [ResourceType.LEAD]: ant.base_lead,
                ['ANTS']: ant.base_ants,
                time: ant.base_time
            };
            const resMet = this.checkResources(cost, anthill);

            availableUnits.push({
                ant,
                cost,
                requirements: requirementsWithNames,
                requirementsMet: reqMet,
                resourcesMet: resMet,
            });
        }

        return availableUnits;
    }

    async startRecruitment(userId: number, antId: number, quantity: number) {
        if (quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');

        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: userId },
            include: {
                resources: { include: { resource: true } },
                constructions: true,
                investigations: true,
                antsTotal: true
            }
        });

        if (!anthill) throw new NotFoundException('Hormiguero no encontrado');

        const ant = await this.prisma.ant.findUnique({ where: { id: antId } });
        if (!ant) throw new NotFoundException('Unidad no encontrada');

        const totalCost = {
            [ResourceType.FOOD]: ant.base_food * quantity,
            [ResourceType.WOOD]: ant.base_wood * quantity,
            [ResourceType.LEAD]: ant.base_lead * quantity,
            ['ANTS']: ant.base_ants * quantity,
            time: ant.base_time * quantity
        };

        // Verificar requisitos
        const requirements = await this.prisma.requirement.findMany({
            where: { targetId: antId, targetType: ItemType.ANT }
        });
        if (!this.checkRequirements(requirements, anthill)) throw new BadRequestException('No se cumplen los requisitos');

        // Verificar recursos
        if (!this.checkResources(totalCost, anthill)) throw new BadRequestException('Recursos insuficientes');

        // Verificar población militar
        const currentMilitaryPop = anthill.antsTotal.reduce((sum, a) => sum + a.total, 0);
        if (currentMilitaryPop + quantity > anthill.militaryPopMax) {
            throw new BadRequestException(`Capacidad militar insuficiente en el hormiguero (${currentMilitaryPop + quantity}/${anthill.militaryPopMax})`);
        }

        // Iniciar transacción
        await this.prisma.$transaction(async (tx) => {
            // 1. Deducir recursos
            for (const [resType, amount] of Object.entries(totalCost)) {
                if (resType !== 'time' && resType !== 'ANTS' && (amount as number) > 0) {
                    const resource = await tx.resource.findFirst({ where: { type: resType as ResourceType } });
                    if (resource) {
                        await tx.resourceAnthill.update({
                            where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: resource.id } },
                            data: { stock: { decrement: amount as number } }
                        });
                    }
                }
            }

            // 2. Consumir hormigas normales
            if (totalCost.ANTS > 0) {
                await tx.anthill.update({
                    where: { id: anthill.id },
                    data: { ants: { decrement: totalCost.ANTS } }
                });
            }
        });

        // 3. Añadir a la cola de Bull
        await this.recruitmentQueue.add(
            'recruit_units',
            { anthillId: anthill.id, antId: ant.id, quantity },
            { delay: totalCost.time * 1000 }
        );

        return {
            message: 'Reclutamiento iniciado',
            finishingAt: new Date(Date.now() + totalCost.time * 1000)
        };
    }

    private checkRequirements(requirements: any[], anthill: any) {
        if (!requirements || !Array.isArray(requirements)) return true;

        for (const req of requirements) {
            if (req.requiredType === ItemType.CONSTRUCTION) {
                const hasIt = (anthill.constructions ?? []).some(c =>
                    c.constructionId === req.requiredId &&
                    c.level >= req.requiredLevel &&
                    c.status === ConstructionStatus.COMPLETED
                );
                if (!hasIt) return false;
            } else if (req.requiredType === ItemType.INVESTIGATION) {
                const hasIt = (anthill.investigations ?? []).some(i =>
                    i.investigationId === req.requiredId &&
                    i.level >= req.requiredLevel &&
                    i.status === InvestigationStatus.COMPLETED
                );
                if (!hasIt) return false;
            }
        }
        return true;
    }

    private checkResources(cost: any, anthill: any) {
        for (const [resType, amount] of Object.entries(cost)) {
            if (resType === 'time' || resType === 'ANTS') continue;
            const userRes = anthill.resources?.find(r => r.resource.type === resType);
            if (!userRes || userRes.stock < (amount as number)) return false;
        }
        if (cost.ANTS > anthill.ants) return false;
        return true;
    }
}
