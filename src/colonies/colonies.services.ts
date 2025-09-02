import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bull";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ColoniesService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue('cria') private queue: Queue
    ) {}

    async createColonyForUser(userId: number) {
        let anthill = await this.prisma.anthill.create({
            data: {
                owner: {
                connect: {
                    id: userId, 
                },
                },
                // Valores iniciales para el hormiguero (puedes ajustarlos)
                positionX: 0,
                positionY: 0,
                eggs: 0,
                larva: 0,
                ants: 0,
                antsBusy: 0,
            },
        });

        const foodResource = await this.prisma.resource.findFirst({ where: { type: 'F' } });
        const woodResource = await this.prisma.resource.findFirst({ where: { type: 'W' } });
        const leafResource = await this.prisma.resource.findFirst({ where: { type: 'L' } });

        if (!foodResource || !woodResource || !leafResource) {
            throw new Error('Recursos iniciales no encontrados en la base de datos.');
        }

        // 4. Asignar los recursos iniciales al hormiguero
        await this.prisma.resourceAnthill.createMany({
            data: [
            {
                anthillId: anthill.id,
                resourceId: foodResource.id,
                stock: 100, // Cantidad inicial de comida
            },
            {
                anthillId: anthill.id,
                resourceId: woodResource.id,
                stock: 50, // Cantidad inicial de madera
            },
            {
                anthillId: anthill.id,
                resourceId: leafResource.id,
                stock: 50, // Cantidad inicial de hojas
            },
            ],
        });

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

        const resource = await this.prisma.resource.findFirst({ where: { type: 'F' } });

        const foodResource = await this.prisma.resourceAnthill.findFirst(
            { where: { resourceId: resource.id, anthillId: anthill.id } });

        if (!foodResource || foodResource.stock < 40) {
            Logger.log('No hay suficiente comida para poner un huevo.');
            return false;
        } else {

            await this.prisma.resourceAnthill.update({
                where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: resource.id } },
                data: { stock: { decrement: 40 } },
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
        const baseTime = 1; 

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
        });

        if (!anthill) {
            Logger.log('Hormiguero no encontrado para el usuario.');
            return [];
        }

        console.log(anthill);

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
}