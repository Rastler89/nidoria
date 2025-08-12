import { Global, Module } from '@nestjs/common';
import { ColoniesService } from './colonies.services';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'redis_testqueues', // use the service name from docker-compose if its different
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'queens',
    }),
    BullBoardModule.forFeature({
      name: 'queens',
      adapter: BullAdapter,
    }),
  ],
  providers: [ColoniesService],
  exports: [ColoniesService],
})
export class ColoniesModule {}