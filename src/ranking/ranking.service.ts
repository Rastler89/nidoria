import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getRankings(userId: number) {
    // 1. Obtener el hormiguero del usuario para saber sus puntos
    const userAnthill = await this.prisma.anthill.findFirst({
      where: { ownerId: userId },
      select: { 
        id: true, 
        powerTotal: true, 
        powerConstruction: true, 
        powerInvestigation: true, 
        powerMilitary: true 
      }
    });

    if (!userAnthill) throw new NotFoundException('Hormiguero no encontrado');

    // 2. Ejecutar las consultas de Top 10 en paralelo para máximo rendimiento
    const [general, construction, investigation, military] = await Promise.all([
      this.getTop10('powerTotal'),
      this.getTop10('powerConstruction'),
      this.getTop10('powerInvestigation'),
      this.getTop10('powerMilitary'),
    ]);

    // 3. Calcular la posición del usuario en cada categoría
    // Usamos count() para ser eficientes (contamos cuántos tienen más puntos que el usuario + 1)
    const [rankGeneral, rankConst, rankInvest, rankMilit] = await Promise.all([
      this.prisma.anthill.count({ where: { powerTotal: { gt: userAnthill.powerTotal } } }),
      this.prisma.anthill.count({ where: { powerConstruction: { gt: userAnthill.powerConstruction } } }),
      this.prisma.anthill.count({ where: { powerInvestigation: { gt: userAnthill.powerInvestigation } } }),
      this.prisma.anthill.count({ where: { powerMilitary: { gt: userAnthill.powerMilitary } } }),
    ]);

    return {
      general: {
        top10: general,
        user: { rank: rankGeneral + 1, points: userAnthill.powerTotal }
      },
      construction: {
        top10: construction,
        user: { rank: rankConst + 1, points: userAnthill.powerConstruction }
      },
      investigation: {
        top10: investigation,
        user: { rank: rankInvest + 1, points: userAnthill.powerInvestigation }
      },
      military: {
        top10: military,
        user: { rank: rankMilit + 1, points: userAnthill.powerMilitary }
      }
    };
  }

  private async getTop10(field: string) {
    return this.prisma.anthill.findMany({
      take: 10,
      orderBy: { [field]: 'desc' },
      select: {
        powerTotal: field === 'powerTotal',
        powerConstruction: field === 'powerConstruction',
        powerInvestigation: field === 'powerInvestigation',
        powerMilitary: field === 'powerMilitary',
        [field]: true,
        owner: {
          select: {
            id: true,
            username: true,
            titles: {
              take: 1, // Tomamos el título más reciente o principal
              orderBy: { unlockedAt: 'desc' },
              include: { title: true }
            }
          }
        }
      }
    });
  }
}
