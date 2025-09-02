import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesModule } from 'src/colonies/colonies.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cria',
    }),
    ColoniesModule,
  ],
  providers: [QueenDataConsumer],
  exports: [
    BullModule.registerQueue({
      name: 'cria',
    }), 
  ],
})
export class ConsumerModule {}