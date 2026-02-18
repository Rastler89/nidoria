import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class PreregistrationService {
  private readonly logger = new Logger(PreregistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async create(email: string) {
    const existing = await this.prisma.preregistration.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email already registered for preregistration.');
    }

    const record = await this.prisma.preregistration.create({
      data: { email },
    });

    this.logger.log(`New preregistration: ${email}`);

    // Send Telegram notification
    this.telegramService.sendMessage(`New preregistration: ${email}`)
      .catch(e => this.logger.error(`Failed to send telegram notification for ${email}`, e));

    return record;
  }
}
