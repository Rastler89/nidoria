import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { PrismaService } from '../prisma/prisma.service';
import { AnthillGateway } from "../gateway/anthill.gateway";
import { capResourceStock, resolveResourceCapacity } from '../resources/resource-capacity';

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
    const requested = Number(amount);

    if (!type || !Number.isFinite(requested) || requested <= 0 || !Number.isInteger(requested)) {
      throw new BadRequestException('Parámetros de expedición inválidos. Se requiere tipo y cantidad positiva entera.');
    }

    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: Number(userId) },
    });

    if (!anthill) {
      throw new NotFoundException('No se encontró el hormiguero para este usuario.');
    }

    const availableAnts = Math.max(
      0,
      Number(anthill.ants ?? 0) - Number(anthill.antsBusy ?? 0),
    );

    if (requested > availableAnts) {
      throw new BadRequestException(
        `No hay suficientes hormigas disponibles. Libres: ${availableAnts}, solicitadas: ${requested}.`,
      );
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
      return await this.initExpedition(anthill, resource, requested);
    } else {
      const updated = await this.prisma.exploration.update({
        where: {
          anthillId_resourceTypeId: {
            anthillId: Number(anthill.id),
            resourceTypeId: Number(resource.id)
          }
        },
        data: {
          ants: Number(expedition.ants) + requested,
        }
      });

      await this.prisma.anthill.update({
        where: { id: anthill.id },
        data: { antsBusy: { increment: requested } }
      });

      return {
        duration: updated.duration,
        message: 'Expedición actualizada con más hormigas'
      };
    }
  }

  async finishExpedition(anthillId, type) {
    //TODO: Finalizar expedicion
    const exploration = await this.prisma.exploration.findFirst({
      where: { anthillId: Number(anthillId), resourceTypeId: Number(type) },
    });

    if (!exploration) return;

    var quantity = exploration.quantity;
    var ants = exploration.ants;

    var total = quantity * ants;

    await this.prisma.$transaction([
      this.prisma.exploration.delete({
        where: {
          anthillId_resourceTypeId: {
            anthillId: Number(anthillId),
            resourceTypeId: Number(type)
          }
        }
      }),
      this.prisma.anthill.update({
        where: { id: exploration.anthillId },
        data: { antsBusy: { decrement: exploration.ants } },
        include: { resources: true } // Need current stock or just update with increment?
      }),
    ]);

    // Consultar el hormiguero para obtener las capacidades
    const anthill = await this.prisma.anthill.findUnique({
      where: { id: exploration.anthillId }
    });

    if (!anthill) return;

    const capacities = anthill.capacities as any || {};
    const resource = await this.prisma.resource.findUnique({ where: { id: Number(type) } });

    if (!resource) return;

    const resType = resource.type || 'FOOD';
    const capacity = resolveResourceCapacity(capacities, resType);

    const resourceAnthill = await this.prisma.resourceAnthill.findUnique({
      where: { anthillId_resourceId: { anthillId: Number(anthillId), resourceId: Number(type) } }
    });

    const currentStock = resourceAnthill?.stock || 0;
    // El stock nunca puede superar la capacidad del hormiguero, aunque ya
    // viniera por encima del límite por datos antiguos o ajustes manuales.
    const newStock = capResourceStock(currentStock + total, capacity);

    await this.prisma.resourceAnthill.update({
      where: {
        anthillId_resourceId: {
          anthillId: Number(anthillId),
          resourceId: Number(type)
        }
      },
      data: {
        stock: newStock,
      }
    });

    // Relanzar la expedición con el hormiguero correcto. Antes se pasaba el
    // anthillId como si fuera el userId y el job fallaba al no encontrarlo.
    await this.initExpedition(anthill, resource, ants);

    await this.anthillGateway.sendUpdate(anthillId.toString());
  }

  async initExpedition(anthill, resource, amount) {
    var duration = Math.floor(Math.random() * (this.MAX_TIME - this.MIN_TIME + 1)) + this.MIN_TIME;
    var quantity = Math.floor(Math.random() * (this.BASE_MAX_LOAD - this.BASE_MIN_LOAD) + this.BASE_MIN_LOAD);

    await this.prisma.exploration.create({
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
