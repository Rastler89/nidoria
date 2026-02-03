import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesModule } from '../colonies/colonies.module';
import { AntConsumptionProcessor } from './ant-consumption.processor';
import { ConstructionProcessor } from './construction.processor';
import { ConstructionsModule } from '../constructions/constructions.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cria',
    }),
    BullModule.registerQueue({
      name: 'construccion',
    }),
    ColoniesModule,
    ConstructionsModule,
  ],
  providers: [
    QueenDataConsumer,
    AntConsumptionProcessor,
    ConstructionProcessor,
  ],
  exports: [
    BullModule.registerQueue({
      name: 'cria',
    }), 
  ],
})
export class ConsumerModule {}