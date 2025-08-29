import { Global, Module } from '@nestjs/common';
import { ColoniesService } from './colonies.services';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: '127.0.0.1', 
        port: 6379,
      },
    }),
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