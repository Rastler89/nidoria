import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
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
}