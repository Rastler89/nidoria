import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('cria') private criaQueue: Queue,
    @InjectQueue('construccion') private construccionQueue: Queue,
    @InjectQueue('investigacion') private investigacionQueue: Queue,
    @InjectQueue('ataques') private ataquesQueue: Queue,
    @InjectQueue('exploraciones') private exploracionesQueue: Queue,
    @InjectQueue('consumo') private consumoQueue: Queue,
  ) {}

  async getUsers() {
    return this.prisma.user.findMany({
      include: {
        anthills: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async updateUserRole(id: number, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // We might need to manually delete related records if cascade is not fully configured
    // Delete resources_anthill, ants_anthill, etc. related to the user's anthills
    const anthills = await this.prisma.anthill.findMany({ where: { ownerId: id } });
    const anthillIds = anthills.map(a => a.id);

    await this.prisma.resourceAnthill.deleteMany({ where: { anthillId: { in: anthillIds } } });
    await this.prisma.antsAnthill.deleteMany({ where: { anthillId: { in: anthillIds } } });
    await this.prisma.constructionAnthill.deleteMany({ where: { anthillId: { in: anthillIds } } });
    await this.prisma.investigationAnthill.deleteMany({ where: { anthillId: { in: anthillIds } } });
    await this.prisma.exploration.deleteMany({ where: { anthillId: { in: anthillIds } } });
    await this.prisma.anthill.deleteMany({ where: { ownerId: id } });

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getAnthills() {
    return this.prisma.anthill.findMany({
      include: {
        owner: true,
        resources: {
          include: { resource: true },
        },
        antsTotal: {
          include: { ant: true },
        },
      },
    });
  }

  async getQueueStats() {
    return {
      cria: await this.criaQueue.getJobCounts(),
      construccion: await this.construccionQueue.getJobCounts(),
      investigacion: await this.investigacionQueue.getJobCounts(),
      ataques: await this.ataquesQueue.getJobCounts(),
      exploraciones: await this.exploracionesQueue.getJobCounts(),
      consumo: await this.consumoQueue.getJobCounts(),
    };
  }

  async getSummary() {
    const userCount = await this.prisma.user.count();
    const anthillCount = await this.prisma.anthill.count();
    const verifiedUsers = await this.prisma.user.count({ where: { verified: { not: null } } });

    return {
      userCount,
      anthillCount,
      verifiedUsers,
    };
  }
}
