import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameMailService {
  constructor(private prisma: PrismaService) {}

  async sendMail(senderId: number | null, receiverId: number, subject: string, content: string) {
    return this.prisma.gameMail.create({
      data: {
        senderId,
        receiverId,
        subject,
        content
      }
    });
  }

  async sendGlobalMail(subject: string, content: string) {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    const operations = users.map(user =>
      this.prisma.gameMail.create({
        data: {
          senderId: null, // System
          receiverId: user.id,
          subject,
          content
        }
      })
    );
    // In a real scenario with thousands of users, batching or using createMany is better.
    // However, Prisma createMany doesn't support all relations/setups easily or returns limited info.
    // For this scale, createMany is best.
    return this.prisma.gameMail.createMany({
        data: users.map(u => ({
            senderId: null,
            receiverId: u.id,
            subject,
            content
        }))
    });
  }

  async getInbox(userId: number) {
    return this.prisma.gameMail.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { username: true } } }
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.gameMail.count({
      where: { receiverId: userId, isRead: false }
    });
  }

  async markAsRead(userId: number, mailId: number) {
    const mail = await this.prisma.gameMail.findFirst({
        where: { id: mailId, receiverId: userId }
    });
    if(!mail) throw new NotFoundException('Correo no encontrado');

    return this.prisma.gameMail.update({
      where: { id: mailId },
      data: { isRead: true }
    });
  }

  async deleteMail(userId: number, mailId: number) {
    const mail = await this.prisma.gameMail.findFirst({
        where: { id: mailId, receiverId: userId }
    });
    if(!mail) throw new NotFoundException('Correo no encontrado');

    return this.prisma.gameMail.delete({
      where: { id: mailId }
    });
  }
}
