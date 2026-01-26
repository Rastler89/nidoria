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

  // Constructions
  async getConstructions() {
    return this.prisma.construction.findMany({ orderBy: { id: 'asc' } });
  }

  async createConstruction(data: any) {
    return this.prisma.construction.create({ data });
  }

  async updateConstruction(id: number, data: any) {
    return this.prisma.construction.update({ where: { id }, data });
  }

  async deleteConstruction(id: number) {
    return this.prisma.construction.delete({ where: { id } });
  }

  // Investigations
  async getInvestigations() {
    return this.prisma.investigation.findMany({ orderBy: { id: 'asc' } });
  }

  async createInvestigation(data: any) {
    return this.prisma.investigation.create({ data });
  }

  async updateInvestigation(id: number, data: any) {
    return this.prisma.investigation.update({ where: { id }, data });
  }

  async deleteInvestigation(id: number) {
    return this.prisma.investigation.delete({ where: { id } });
  }

  // Ants
  async getAnts() {
    return this.prisma.ant.findMany({ orderBy: { id: 'asc' } });
  }

  async createAnt(data: any) {
    return this.prisma.ant.create({ data });
  }

  async updateAnt(id: number, data: any) {
    return this.prisma.ant.update({ where: { id }, data });
  }

  async deleteAnt(id: number) {
    return this.prisma.ant.delete({ where: { id } });
  }

  // Resources
  async getResources() {
    return this.prisma.resource.findMany({ orderBy: { id: 'asc' } });
  }

  async createResource(data: any) {
    return this.prisma.resource.create({ data });
  }

  async updateResource(id: number, data: any) {
    return this.prisma.resource.update({ where: { id }, data });
  }

  async deleteResource(id: number) {
    return this.prisma.resource.delete({ where: { id } });
  }

  // Requirements
  async getRequirements() {
    return this.prisma.requirement.findMany({ orderBy: { id: 'asc' } });
  }

  async createRequirement(data: any) {
    return this.prisma.requirement.create({ data });
  }

  async updateRequirement(id: number, data: any) {
    return this.prisma.requirement.update({ where: { id }, data });
  }

  async deleteRequirement(id: number) {
    return this.prisma.requirement.delete({ where: { id } });
  }

  // Anthill Update
  async updateAnthill(id: number, data: any) {
    // Only allow updating certain fields for safety
    const { eggs, larva, ants, antsBusy } = data;
    return this.prisma.anthill.update({
      where: { id },
      data: {
        eggs: eggs !== undefined ? +eggs : undefined,
        larva: larva !== undefined ? +larva : undefined,
        ants: ants !== undefined ? +ants : undefined,
        antsBusy: antsBusy !== undefined ? +antsBusy : undefined,
      }
    });
  }
}
