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

    const expedition = await this.prisma.exploration.findFirst({
      where: { anthill: Number(anthill.id), type: type },
    });

    if (!expedition) {
      //TODO: Crear expedicion
      this.prisma.exploration.create({
        anthill: Number(anthill.id),
        ants: amount
      });
    } else {
      this.prisma.exploration.update({
        where: {}
      })
    }
  }
}