import { Module } from '@nestjs/common';
import { ColoniesService } from './colonies.service';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [
    ResourcesModule,
    BullModule.registerQueue({
      name: 'cria',
    }),
    BullBoardModule.forFeature({
      name: 'cria',
      adapter: BullAdapter,
    }),
  ],
  providers: [ColoniesService],
  exports: [ColoniesService],
})
export class ColoniesModule {}
