import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesModule } from '../colonies/colonies.module';
import { AntConsumptionProcessor } from './ant-consumption.processor';
import { ExplorationConsumer } from './exploration.consumer';
import { ConstructionConsumer } from './construction.consumer';
import { InvestigationConsumer } from './investigation.consumer';
import { GatewayModule } from 'src/gateway/gateway.module';
import { ExpeditionModule } from 'src/expedition/expedition.module';
import { ConstructionModule } from 'src/construction/construction.module';
import { InvestigationModule } from 'src/investigation/investigation.module';

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
    BullModule.registerQueue({
      name: 'investigation',
    }),
    ColoniesModule,
    GatewayModule,
    ExpeditionModule,
    ConstructionModule,
    InvestigationModule
  ],
  providers: [
    QueenDataConsumer,
    AntConsumptionProcessor,
    ExplorationConsumer,
    ConstructionConsumer,
    InvestigationConsumer,
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
    BullModule.registerQueue({
      name: 'investigation',
    }),
  ],
})
export class ConsumerModule { }