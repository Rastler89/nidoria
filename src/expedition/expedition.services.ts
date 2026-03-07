import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { PrismaService } from '../prisma/prisma.service';
import { AnthillGateway } from "src/gateway/stats.controller";

@Injectable()
export class ExpeditionService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('exploraciones') private queue: Queue,
    private readonly anthillGateway: AnthillGateway
  ) { }

  private readonly MIN_TIME = 3 * 60;
  private readonly MAX_TIME = 7 * 60;

  private readonly BASE_MIN_LOAD = 1;
  private readonly BASE_MAX_LOAD = 10;

  async addExpedition(userId, type, amount) {
    if (!type || !amount || amount <= 0) {
      console.log(type, amount);
      throw new BadRequestException('Parámetros de expedición inválidos. Se requiere tipo y cantidad positiva.');
    }

    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: Number(userId) },
    });

    if (!anthill) {
      throw new NotFoundException('No se encontró el hormiguero para este usuario.');
    }

    const resource = await this.prisma.resource.findFirst({
      where: { type: type }
    });

    if (!resource) {
      throw new BadRequestException(`El tipo de recurso "${type}" no es válido.`);
    }

    const expedition = await this.prisma.exploration.findFirst({
      where: { anthillId: Number(anthill.id), resourceTypeId: Number(resource.id) },
    });

    if (!expedition) {
      return await this.initExpedition(userId, type, amount);
    } else {
      const updated = await this.prisma.exploration.update({
        where: {
          anthillId_resourceTypeId: {
            anthillId: Number(anthill.id),
            resourceTypeId: Number(resource.id)
          }
        },
        data: {
          ants: Number(expedition.ants) + amount,
        }
      });

      await this.prisma.anthill.update({
        where: { id: anthill.id },
        data: { antsBusy: { increment: amount } }
      });

      return {
        duration: updated.duration,
        message: 'Expedición actualizada con más hormigas'
      };
    }
  }

  async finishExpedition(userId, type) {
    //TODO: Finalizar expedicion
    const exploration = await this.prisma.exploration.findFirst({
      where: { anthillId: Number(userId), resourceTypeId: Number(type) },
    });

    if (!exploration) {
      console.log(`No se encontró expedición para user ${userId} y recurso ${type}`);
      return;
    }

    var quantity = exploration.quantity;
    var ants = exploration.ants;

    var total = Math.floor(exploration.quantity * exploration.ants);

    await this.prisma.$transaction([
      this.prisma.exploration.delete({
        where: {
          anthillId_resourceTypeId: {
            anthillId: Number(userId),
            resourceTypeId: Number(type)
          }
        }
      }),
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
    ])

    await this.initExpedition(userId, type, ants);

    await this.anthillGateway.sendUpdate(userId);

  }

  async initExpedition(userId, type, amount) {

    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: Number(userId) },
    });

    if (!anthill) {
      throw new NotFoundException('Hormiguero no encontrado al iniciar expedición.');
    }

    let resource;

    if (Number.isInteger(type)) {
      resource = await this.prisma.resource.findUnique({
        where: { id: type }
      })
    } else {
      resource = await this.prisma.resource.findFirst({
        where: { type: type }
      });
    }

    if (!resource) {
      throw new BadRequestException('Tipo de recurso inválido al iniciar expedición.');
    }

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

    await this.prisma.anthill.update({
      where: { id: anthill.id },
      data: { antsBusy: { increment: amount } }
    });
    //Cridar redis...
    await this.queue.add(
      'exploration',
      { custom_id: Math.floor(Math.random() * 1000000), anthillId: Number(anthill.id), resourceTypeId: Number(resource.id), ants: amount, duration: duration },
      {
        priority: 1,
        delay: duration * 1000,
        removeOnComplete: true,
        removeOnFail: true,
      }
    );

    return {
      duration: duration,
      quantity: quantity,
      message: 'Expedición iniciada'
    };
  }

}