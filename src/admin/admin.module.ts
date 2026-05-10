import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { HelpModule } from '../help/help.module';

@Module({
  imports: [
    PrismaModule,
    HelpModule,
    BullModule.registerQueue(
      { name: 'cria' },
      { name: 'construccion' },
      { name: 'investigation' },
      { name: 'ataques' },
      { name: 'exploraciones' },
      { name: 'consumo' },
    ),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
