import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueenDataConsumer } from './queen-data.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cria',
    }),
  ],
  providers: [QueenDataConsumer],
  exports: [
    BullModule.registerQueue({
      name: 'cria',
    }), 
  ],
})
export class ConsumerModule {}