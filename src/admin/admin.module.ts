import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AntmasterService } from './antmaster.service';
import { AntmasterController } from './antmaster.controller';
import { PrismaModule } from '../prisma/prisma.module';
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
  controllers: [AdminController, AntmasterController],
  providers: [AdminService, AntmasterService],
})
export class AdminModule {}
