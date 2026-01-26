import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: 'cria' },
      { name: 'construccion' },
      { name: 'investigacion' },
      { name: 'ataques' },
      { name: 'exploraciones' },
      { name: 'consumo' },
    ),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
