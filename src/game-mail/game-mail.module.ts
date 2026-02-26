import { Module } from '@nestjs/common';
import { GameMailService } from './game-mail.service';
import { GameMailController } from './game-mail.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GameMailController],
  providers: [GameMailService],
  exports: [GameMailService],
})
export class GameMailModule {}
