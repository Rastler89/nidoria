import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConstructionStatus, ResourceType } from '@prisma/client';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMissionsForUser(userId: number) {
    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: userId },
      include: {
        resources: { include: { resource: true } },
        constructions: true,
      },
    });
    if (!anthill) throw new NotFoundException('Hormiguero no encontrado');

    const missions = await this.prisma.mission.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    const claims = await this.prisma.missionClaim.findMany({
      where: { userId },
      select: { missionId: true, claimedAt: true },
    });
    const claimedMap = new Map(claims.map((c) => [c.missionId, c.claimedAt]));

    const foodStock = anthill.resources.find((r) => r.resource.type === ResourceType.FOOD)?.stock ?? 0;
    const woodStock = anthill.resources.find((r) => r.resource.type === ResourceType.WOOD)?.stock ?? 0;
    const leadStock = anthill.resources.find((r) => r.resource.type === ResourceType.LEAD)?.stock ?? 0;
    const completedConstructions = anthill.constructions.filter((c) => c.status === ConstructionStatus.COMPLETED).length;

    return missions.map((m) => {
      let current = 0;
      switch (m.conditionType) {
        case 'HAVE_ANTS':
          current = anthill.ants;
          break;
        case 'HAVE_FOOD_STOCK':
          current = foodStock;
          break;
        case 'HAVE_WOOD_STOCK':
          current = woodStock;
          break;
        case 'HAVE_LEAD_STOCK':
          current = leadStock;
          break;
        case 'HAVE_CONSTRUCTIONS_COMPLETED':
          current = completedConstructions;
          break;
        default:
          current = 0;
      }
      const claimedAt = claimedMap.get(m.id) ?? null;
      const completed = current >= m.target;
      return {
        id: m.id,
        key: m.key,
        title: m.title,
        description: m.description,
        conditionType: m.conditionType,
        target: m.target,
        current,
        completed,
        claimed: !!claimedAt,
        claimedAt,
        rewardFood: m.rewardFood,
        rewardWood: m.rewardWood,
        rewardLead: m.rewardLead,
      };
    });
  }

  async claimMission(userId: number, missionId: number) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission || !mission.active) throw new NotFoundException('Mision no encontrada');

    const existing = await this.prisma.missionClaim.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (existing) throw new BadRequestException('Recompensa ya reclamada');

    // Recompute progress
    const list = await this.getMissionsForUser(userId);
    const entry = list.find((m) => m.id === missionId);
    if (!entry || !entry.completed) throw new BadRequestException('Mision no completada');

    const anthill = await this.prisma.anthill.findFirst({ where: { ownerId: userId } });
    if (!anthill) throw new NotFoundException('Hormiguero no encontrado');

    // Give rewards
    await this.prisma.$transaction(async (tx) => {
      await tx.missionClaim.create({ data: { userId, missionId } });
      if (mission.rewardFood > 0) {
        const res = await tx.resource.findFirst({ where: { type: ResourceType.FOOD } });
        if (res) {
          await tx.resourceAnthill.upsert({
            where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: res.id } },
            create: { anthillId: anthill.id, resourceId: res.id, stock: mission.rewardFood },
            update: { stock: { increment: mission.rewardFood } },
          });
        }
      }
      if (mission.rewardWood > 0) {
        const res = await tx.resource.findFirst({ where: { type: ResourceType.WOOD } });
        if (res) {
          await tx.resourceAnthill.upsert({
            where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: res.id } },
            create: { anthillId: anthill.id, resourceId: res.id, stock: mission.rewardWood },
            update: { stock: { increment: mission.rewardWood } },
          });
        }
      }
      if (mission.rewardLead > 0) {
        const res = await tx.resource.findFirst({ where: { type: ResourceType.LEAD } });
        if (res) {
          await tx.resourceAnthill.upsert({
            where: { anthillId_resourceId: { anthillId: anthill.id, resourceId: res.id } },
            create: { anthillId: anthill.id, resourceId: res.id, stock: mission.rewardLead },
            update: { stock: { increment: mission.rewardLead } },
          });
        }
      }
    });

    return { message: 'Recompensa reclamada' };
  }
}
