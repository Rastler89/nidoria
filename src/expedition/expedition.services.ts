import { Injectable } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpeditionService {
  constructor (
    private readonly prisma: PrismaService
  ) {}

  async addExpedition (userId, type, amount) {
    console.log(userId, type);
    console.log(amount);

    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: Number(userId) },
    });

    const resource = await this.prisma.resource.findFirst({
      where: { type: type}
    });

    const expedition = await this.prisma.exploration.findFirst({
      where: { anthillId: Number(anthill.id), resourceTypeId: Number(resource.id) },
    });

    if (!expedition) {
      //TODO: Crear expedicion
      /*this.prisma.exploration.create({
        data: {
          anthillId: Number(anthill.id),
          resourceTypeId: Number(resource.id),
          ants: amount,
          duration: duration,
          quantity: quantity,
        }
      });*/
    } else {
      /*this.prisma.exploration.update({
        where: {}
      })*/
    }
  }
}