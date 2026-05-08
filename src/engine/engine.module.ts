import { Module } from '@nestjs/common';
import { GameEngineService } from './engine.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GameEngineService],
  exports: [GameEngineService],
})
export class EngineModule {}
