import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ANTHILL_CONFIG } from "../config/anthill.config";

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

    async updateColonyLimits(anthillId: number) {
        const anthill = await this.prisma.anthill.findUnique({
            where: { id: anthillId },
            include: {
                constructions: {
                    where: { status: 'COMPLETED' },
                    include: { construction: true }
                },
                investigations: {
                    where: { status: 'COMPLETED' },
                    include: { investigation: true }
                }
            }
        });

        if (!anthill) return;

        let popMax = 0;
        let militaryPopMax = 0;
        let capacities = {
            FOOD: 0,
            WOOD: 0,
            LEAD: 0
        };

        const applyEffects = (item: any, level: number) => {
            const effects = item.effects as any;
            if (!effects) return;

            const mult = Math.pow(item.multiplier || 1, level - 1);

            if (effects.popMax) popMax += Math.floor(effects.popMax * mult);
            if (effects.militaryPopMax) militaryPopMax += Math.floor(effects.militaryPopMax * mult);
            if (effects.storage) {
                const boost = Math.floor(effects.storage * mult);
                capacities.FOOD += boost;
                capacities.WOOD += boost;
                capacities.LEAD += boost;
            }
            if (effects.storageFood) capacities.FOOD += Math.floor(effects.storageFood * mult);
            if (effects.storageWood) capacities.WOOD += Math.floor(effects.storageWood * mult);
            if (effects.leafStorage) capacities.LEAD += Math.floor(effects.leafStorage * mult);
        };

        anthill.constructions.forEach(c => applyEffects(c.construction, c.level));
        anthill.investigations.forEach(i => applyEffects(i.investigation, i.level));

        // Por si acaso no hay nada construido aún (aunque el createColony crea la cámara inicial)
        // Aplicar valores base de la configuración si no hay mejoras que los modifiquen
        if (popMax === 0) popMax = ANTHILL_CONFIG.LIMITS.BASE_POPULATION;
        if (militaryPopMax === 0) militaryPopMax = ANTHILL_CONFIG.LIMITS.BASE_MILITARY_POPULATION;
        
        if (capacities.FOOD === 0) {
            capacities = { 
                FOOD: ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY, 
                WOOD: ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY, 
                LEAD: ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY 
            };
        }

        await this.prisma.anthill.update({
            where: { id: anthillId },
            data: {
                popMax: popMax,
                militaryPopMax: militaryPopMax,
                capacities: capacities
            }
        });
    }
}