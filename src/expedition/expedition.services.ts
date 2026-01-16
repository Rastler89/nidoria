import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpeditionService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('exploraciones') private queue: Queue
  ) { }

  private readonly MIN_TIME = 3 * 60;
  private readonly MAX_TIME = 7 * 60;

  private readonly BASE_MIN_LOAD = 1;
  private readonly BASE_MAX_LOAD = 10;

  async addExpedition(userId, type, amount) {

    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: Number(userId) },
    });

    const resource = await this.prisma.resource.findFirst({
      where: { type: type }
    });

    const expedition = await this.prisma.exploration.findFirst({
      where: { anthillId: Number(anthill.id), resourceTypeId: Number(resource.id) },
    });

    if (!expedition) {
      this.initExpedition(userId, type, amount);
    } else {
      this.prisma.exploration.update({
        where: {
          anthillId_resourceTypeId: {
            anthillId: Number(anthill.id),
            resourceTypeId: Number(resource.id)
          }
        },
        data: {
          ants: Number(expedition.ants) + amount,
        }
      })
    }
  }

  async finishExpedition(userId, type) {
    //TODO: Finalizar expedicion
    const exploration = await this.prisma.exploration.findFirst({
      where: { anthillId: Number(userId), resourceTypeId: Number(type) },
    });

    var quantity = exploration.quantity;
    var ants = exploration.ants;

    var total = quantity * ants;
    if (exploration) {
      this.prisma.exploration.delete({
        where: {
          anthillId_resourceTypeId: {
            anthillId: Number(userId),
            resourceTypeId: Number(type)
          }
        }
      })

      this.prisma.resourceAnthill.update({
        where: {
          anthillId_resourceId: {
            anthillId: Number(userId),
            resourceId: Number(type)
          }
        },
        data: {
          stock: Number(exploration.quantity) + Number(total),
        }
      })

      this.initExpedition(userId, type, ants);
    }
  }

  async initExpedition(userId, type, amount) {
    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: Number(userId) },
    });

    const resource = await this.prisma.resource.findFirst({
      where: { type: type }
    });

    //TODO: Crear expedicion
    var duration = Math.floor(Math.random() * (this.MAX_TIME - this.MIN_TIME + 1)) + this.MIN_TIME;
    var quantity = Math.random() * (this.BASE_MAX_LOAD - this.BASE_MIN_LOAD) + this.BASE_MIN_LOAD;
    const exploration = await this.prisma.exploration.create({
      data: {
        anthillId: Number(anthill.id),
        resourceTypeId: Number(resource.id),
        ants: amount,
        duration: duration,
        quantity: quantity,
      }
    });
    //Cridar redis...
    return this.queue.add(
      'exploration',
      { custom_id: Math.floor(Math.random() * 1000000), anthillId: Number(anthill.id), resourceTypeId: Number(resource.id), ants: amount, duration: duration },
      {
        priority: 1,
        delay: duration * 1000,
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  }

}