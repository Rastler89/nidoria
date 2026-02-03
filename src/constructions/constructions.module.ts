import { Module } from '@nestjs/common';
import { ConstructionsService } from './constructions.service';
import { ConstructionsController } from './constructions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'construccion',
    }),
  ],
  controllers: [ConstructionsController],
  providers: [ConstructionsService],
  exports: [ConstructionsService],
})
export class ConstructionsModule {}
