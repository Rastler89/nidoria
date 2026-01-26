import { Injectable } from '@nestjs/common';
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

  // Database Management
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
        lastLogin: true,
      },
    });
  }

  async updateUser(id: number, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: number) {
    // Delete related data first if necessary, but Prisma might handle it if cascade is set.
    // In our schema, Anthill references User.
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getAllAnthills() {
    return this.prisma.anthill.findMany({
      include: {
        owner: {
          select: { username: true },
        },
        resources: {
          include: { resource: true },
        },
        antsTotal: {
          include: { ant: true },
        },
      },
    });
  }

  async updateAnthill(id: number, data: any) {
    const { resources, antsDetails, ...rest } = data;

    if (resources && Array.isArray(resources)) {
      for (const res of resources) {
        await this.prisma.resourceAnthill.update({
          where: {
            anthillId_resourceId: {
              anthillId: id,
              resourceId: res.resourceId,
            },
          },
          data: { stock: res.stock },
        });
      }
    }

    if (antsDetails && Array.isArray(antsDetails)) {
      for (const ant of antsDetails) {
        await this.prisma.antsAnthill.update({
          where: {
            antId_anthillId: {
              anthillId: id,
              antId: ant.antId,
            },
          },
          data: { total: ant.total, busy: ant.busy },
        });
      }
    }

    return this.prisma.anthill.update({
      where: { id },
      data: rest,
    });
  }

  // Redis Management
  private getQueue(name: string): Queue {
    const queues = {
      cria: this.criaQueue,
      construccion: this.construccionQueue,
      investigacion: this.investigacionQueue,
      ataques: this.ataquesQueue,
      exploraciones: this.exploracionesQueue,
      consumo: this.consumoQueue,
    };
    return queues[name];
  }

  async getQueuesStats() {
    const queueNames = ['cria', 'construccion', 'investigacion', 'ataques', 'exploraciones', 'consumo'];
    const stats = {};
    for (const name of queueNames) {
      const queue = this.getQueue(name);
      stats[name] = await queue.getJobCounts();
    }
    return stats;
  }

  async cleanQueue(name: string) {
    const queue = this.getQueue(name);
    if (!queue) throw new Error('Queue not found');
    await queue.clean(0, 'completed');
    await queue.clean(0, 'failed');
    await queue.clean(0, 'delayed');
    await queue.empty();
    return { message: `Queue ${name} cleaned` };
  }

  async retryFailedJobs(name: string) {
    const queue = this.getQueue(name);
    if (!queue) throw new Error('Queue not found');
    const failed = await queue.getFailed();
    for (const job of failed) {
      await job.retry();
    }
    return { message: `Retried ${failed.length} jobs in ${name}` };
  }
}
