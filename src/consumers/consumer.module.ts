import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesModule } from '../colonies/colonies.module';
import { AntConsumptionProcessor } from './ant-consumption.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cria',
    }),
    ColoniesModule,
  ],
  providers: [
    QueenDataConsumer,
    AntConsumptionProcessor
  ],
  exports: [
    BullModule.registerQueue({
      name: 'cria',
    }), 
  ],
})
export class ConsumerModule {}