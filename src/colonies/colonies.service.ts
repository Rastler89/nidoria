import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bull";
import { PrismaService } from "../prisma/prisma.service";
import { ResourceType } from "@prisma/client";
import { ANTHILL_CONFIG } from "../config/anthill.config";
import { ResourcesService } from "../resources/resources.service";

@Injectable()
export class ColoniesService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('cria') private queue: Queue,
        private readonly resourcesService: ResourcesService
    ) { }

    private readonly COLONY_MIN_DISTANCE = ANTHILL_CONFIG.WORLD.MIN_DISTANCE_BETWEEN_COLONIES;

    async createColonyForUser(userId: number) {
        const world = await this.findOrCreateAvailableWorld();
        let posX, posY, collision;

        do {
            posX = Math.floor(Math.random() * ANTHILL_CONFIG.WORLD.MAP_SIZE);
            posY = Math.floor(Math.random() * ANTHILL_CONFIG.WORLD.MAP_SIZE);

            // Comprobar si hay algún hormiguero en el mismo mundo dentro del radio de seguridad S
            collision = await this.prisma.anthill.findFirst({
                where: {
                    worldId: world.id,
                    positionX: { gte: posX - this.COLONY_MIN_DISTANCE, lte: posX + this.COLONY_MIN_DISTANCE },
                    positionY: { gte: posY - this.COLONY_MIN_DISTANCE, lte: posY + this.COLONY_MIN_DISTANCE },
                }
            });
        } while (collision);

        let anthill = await this.prisma.anthill.create({
            data: {
                owner: {
                    connect: {
                        id: userId,
                    },
                },
                world: {
                    connect: {
                        id: world.id
                    }
                },
                positionX: posX,
                positionY: posY,
                eggs: 0,
                larva: 0,
                ants: 0,
                antsBusy: 0,

                constructions: {
                    create: {
                        level: 1,
                        status: 'COMPLETED',
                        construction: {
                            connect: { id: 1 }
                        }
                    }
                },
            },
            include: {
                constructions: true
            }
        });

        // Incrementar el contador de jugadores en el mundo
        await this.prisma.world.update({
            where: { id: world.id },
            data: { currentPlayers: { increment: 1 } }
        });

        const foodResource = await this.prisma.resource.findFirst({ where: { type: ResourceType.FOOD } });
        const woodResource = await this.prisma.resource.findFirst({ where: { type: ResourceType.WOOD } });
        const leafResource = await this.prisma.resource.findFirst({ where: { type: ResourceType.LEAD } });

        if (!foodResource || !woodResource || !leafResource) {
            throw new Error('Recursos iniciales no encontrados en la base de datos.');
        }

        // 4. Asignar los recursos iniciales al hormiguero
        await this.prisma.resourceAnthill.createMany({
            data: [
                {
                    anthillId: anthill.id,
                    resourceId: foodResource.id,
                    stock: ANTHILL_CONFIG.INITIAL_RESOURCES.FOOD,
                },
                {
                    anthillId: anthill.id,
                    resourceId: woodResource.id,
                    stock: ANTHILL_CONFIG.INITIAL_RESOURCES.WOOD,
                },
                {
                    anthillId: anthill.id,
                    resourceId: leafResource.id,
                    stock: ANTHILL_CONFIG.INITIAL_RESOURCES.LEAD,
                },
            ],
        });

        // 5. Actualizar límites basados en las construcciones iniciales
        await this.resourcesService.updateColonyLimits(anthill.id);

        return;
    }

    async initQueen(id) {
        console.log('entrando en la cola');
        return this.queue.add(
            'new_egg',
            { custom_id: Math.floor(Math.random() * 10000000), userId: id },
            { priority: 1 },
        );
    }

    async addEggToColony(userId: string): Promise<boolean> {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: Number(userId) },
        });

        if (!anthill) {
            Logger.log('Hormiguero no encontrado para el usuario.');
            return false;
        }

        const currentTotal = anthill.eggs + anthill.larva + anthill.ants;
        if (currentTotal >= anthill.popMax) {
            Logger.log('Límite de población alcanzado.');
            return false;
        }

        const resource = await this.prisma.resource.findFirst({ where: { type: ResourceType.FOOD } });

        const foodResource = await this.prisma.resourceAnthill.findFirst(
            { where: { resourceId: resource.id, anthillId: anthill.id } });

        const cost = ANTHILL_CONFIG.BIOLOGY.EGG_COST_FOOD;
        if (!foodResource || foodResource.stock < cost) {
            Logger.log('No hay suficiente comida para poner un huevo.');
            return false;
        } else {

            await this.prisma.resourceAnthill.update({
                where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: resource.id } },
                data: { stock: { decrement: cost } },
            });

            await this.prisma.anthill.update({
                where: { id: anthill.id },
                data: { eggs: { increment: 1 } },
            });
        }

        return true;
    }

    //Todo margar el tiempo en función de mejoras, habilidades, etc.
    async getNewEggTimeInMinutes(userId: string) {
        /*const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: Number(userId) },
        });
        if (!anthill) {
            throw new Error('Hormiguero no encontrado para el usuario.');
        }*/
        const baseTime = ANTHILL_CONFIG.BIOLOGY.EGG_TIME_BASE;

        return baseTime;

    }

    async convertEggToLarva(userId: string): Promise<boolean> {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: Number(userId) },
        });

        if (!anthill) {
            Logger.log('Hormiguero no encontrado para el usuario.');
            return false;
        }

        if (anthill.eggs > 0) {
            await this.prisma.anthill.update({
                where: { id: anthill.id },
                data: {
                    eggs: { decrement: 1 },
                    larva: { increment: 1 }
                }
            });

            return true;
        } else {
            Logger.log('No hay huevos disponibles para convertir en larvas.');
            return false;
        }
    }

    async convertLarvaToAnt(userId: string) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: Number(userId) },
        });

        if (!anthill) {
            Logger.log('Hormiguero no encontrado para el usuario.');
            return;
        }

        if (anthill.larva > 0) {
            await this.prisma.anthill.update({
                where: { id: anthill.id },
                data: {
                    larva: { decrement: 1 },
                    ants: { increment: 1 }
                }
            });
        } else {
            Logger.log('No hay larvas disponibles para convertir en hormigas.');
        }
        return;

    }

    async getColonyResources(userId: string) {
        const anthill = await this.prisma.anthill.findFirst({
            where: { ownerId: Number(userId) },
            include: {
                constructions: {
                    include: { construction: true }
                },
                investigations: {
                    include: { investigation: true }
                },
                antsTotal: {
                    include: { ant: true }
                }
            }
        });

        if (!anthill) {
            Logger.log('Hormiguero no encontrado para el usuario.');
            return [];
        }

        const resources = await this.prisma.resourceAnthill.findMany({
            where: { anthillId: anthill.id },
            include: { resource: true },
        });

        anthill['resources'] = resources.map(r => ({
            type: r.resource.type,
            stock: r.stock
        }));

        return anthill;
    }

    private async findOrCreateAvailableWorld() {
        let world = await this.prisma.world.findFirst({
            where: {
                currentPlayers: { lt: ANTHILL_CONFIG.WORLD.MAX_PLAYERS_PER_WORLD }
            },
            orderBy: { id: 'asc' }
        });

        if (!world) {
            const count = await this.prisma.world.count();
            world = await this.prisma.world.create({
                data: {
                    name: `Mundo ${count + 1}`,
                    maxPlayers: ANTHILL_CONFIG.WORLD.MAX_PLAYERS_PER_WORLD,
                    currentPlayers: 0
                }
            });
        }

        return world;
    }
}
