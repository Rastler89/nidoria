import { Module } from '@nestjs/common';
import { PreregistrationService } from './preregistration.service';
import { PreregistrationController } from './preregistration.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [PrismaModule, TelegramModule],
  controllers: [PreregistrationController],
  providers: [PreregistrationService],
})
export class PreregistrationModule {}
