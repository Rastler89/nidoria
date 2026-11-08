import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ANTHILL_CONFIG } from "../config/anthill.config";
import { GameEngineService } from "../engine/engine.service";
import { ItemEffects } from "../engine/types";
import { capResourceStock, resolveResourceCapacity } from "./resource-capacity";

@Injectable()
export class ResourcesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly engineService: GameEngineService
    ) { }

    /**
     * Obtiene todos los recursos y estado del hormiguero.
     * Ahora utiliza el GameEngineService para evitar duplicidad.
     */
    async getAllResources(userId: string) {
        const state = await this.engineService.getFullState(parseInt(userId));
        if (!state) {
            throw new Error('Hormiguero no encontrado para el usuario.');
        }
        return state;
    }

    /**
     * Actualiza los límites de población y capacidad basados en edificios e investigaciones.
     * Implementa lógica robusta y tipada.
     */
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

        let popMax = ANTHILL_CONFIG.LIMITS.BASE_POPULATION;
        let militaryPopMax = ANTHILL_CONFIG.LIMITS.BASE_MILITARY_POPULATION;
        let capacities = {
            FOOD: ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY,
            WOOD: ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY,
            LEAD: ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY
        };

        const applyEffects = (item: { effects: any, multiplier: number | null }, level: number) => {
            const effects = item.effects as ItemEffects;
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

        await this.prisma.anthill.update({
            where: { id: anthillId },
            data: {
                popMax: popMax,
                militaryPopMax: militaryPopMax,
                capacities: capacities
            }
        });

        // Si la capacidad baja (o los datos venían por encima del límite),
        // recortamos el stock para que nunca supere la capacidad actual.
        const resourceRows = await this.prisma.resourceAnthill.findMany({
            where: { anthillId },
            include: { resource: true }
        });

        const clampUpdates = resourceRows
            .map((row) => {
                const capacity = resolveResourceCapacity(capacities, row.resource.type);
                const stock = capResourceStock(row.stock, capacity);
                if (stock === row.stock) return null;

                return this.prisma.resourceAnthill.update({
                    where: {
                        anthillId_resourceId: { anthillId, resourceId: row.resourceId }
                    },
                    data: { stock }
                });
            })
            .filter((update): update is NonNullable<typeof update> => update !== null);

        if (clampUpdates.length > 0) {
            await this.prisma.$transaction(clampUpdates);
        }
    }
}
