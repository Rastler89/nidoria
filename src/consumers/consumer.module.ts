import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesModule } from '../colonies/colonies.module';
import { AntConsumptionProcessor } from './ant-consumption.processor';
import { ExplorationConsumer } from './exploration.consumer';
import { ConstructionConsumer } from './construction.consumer';
import { ExpeditionService } from '../expedition/expedition.services';
import { ConstructionService } from '../construction/construction.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cria',
    }),
    BullModule.registerQueue({
      name: 'exploraciones',
    }),
    BullModule.registerQueue({
      name: 'construccion',
    }),
    ColoniesModule,
  ],
  providers: [
    QueenDataConsumer,
    AntConsumptionProcessor,
    ExplorationConsumer,
    ConstructionConsumer,
    //servicios
    ExpeditionService,
    ConstructionService,
  ],
  exports: [
    BullModule.registerQueue({
      name: 'cria',
    }),
    BullModule.registerQueue({
      name: 'exploraciones',
    }),
    BullModule.registerQueue({
      name: 'construccion',
    }),
  ],
})
export class ConsumerModule { }