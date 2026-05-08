import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HelpService {
    constructor(private prisma: PrismaService) { }

    async getTechData() {
        // 1. Traemos todos los datos base y sus requerimientos
        const [constructions, investigations, ants, requirements] = await Promise.all([
            this.prisma.construction.findMany(),
            this.prisma.investigation.findMany(),
            this.prisma.ant.findMany(),
            this.prisma.requirement.findMany(),
        ]);

        // 2. Función auxiliar para encontrar requisitos de un item
        const getRequirements = (id: number, type: 'CONSTRUCTION' | 'INVESTIGATION' | 'ANT') => {
            const filtered = requirements.filter(
                (r) => r.targetId === id && r.targetType === type,
            );

            return {
                // Mapeamos los códigos o nombres de los padres
                parent: filtered.map(r => this.resolveCodeById(r.requiredId, r.requiredType, constructions, investigations, ants)),
                levelReq: filtered.map(r => r.requiredLevel),
            };
        };

        // 3. Mapeo a tu formato final
        const techData = [
            ...constructions.map((c) => ({
                id: c.code,
                name: c.name,
                type: 'Edificio',
                cost: { comida: c.base_food, madera: c.base_wood, plomo: c.base_lead, hormigas: c.base_ants },
                time: c.base_time,
                ...getRequirements(c.id, 'CONSTRUCTION'),
                benefits: c.effects,
            })),
            ...investigations.map((i) => ({
                id: i.code,
                name: i.name,
                type: 'Investigación',
                cost: { comida: i.base_food, madera: i.base_wood, plomo: i.base_lead, hormigas: i.base_ants },
                time: i.base_time,
                ...getRequirements(i.id, 'INVESTIGATION'),
                benefits: i.effects,
            })),
            ...ants.map((a) => ({
                id: a.code,
                name: a.name,
                type: 'Unidad',
                cost: { comida: a.base_food, madera: a.base_wood, plomo: a.base_lead, hormigas: a.base_ants },
                time: a.base_time,
                ...getRequirements(a.id, 'ANT'),
            })),
        ];

        return techData;
    }

    // Helper para convertir IDs de requisitos en "códigos" (ej: "creina")
    private resolveCodeById(id: number, type: string, constructions: any[], investigations: any[], ants: any[]) {
        if (type === 'CONSTRUCTION') return constructions.find(c => c.id === id)?.code;
        if (type === 'INVESTIGATION') return investigations.find(i => i.id === id)?.code;
        if (type === 'ANT') return ants.find(a => a.id === id)?.code;
        return null;
    }
}
