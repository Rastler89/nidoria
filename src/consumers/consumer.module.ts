import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesModule } from '../colonies/colonies.module';
import { AntConsumptionProcessor } from './ant-consumption.processor';
import { ExplorationConsumer } from './exploration.consumer';
import { ConstructionConsumer } from './construction.consumer';
import { InvestigationConsumer } from './investigation.consumer';
import { ConstructionModule } from '../construction/construction.module';
import { InvestigationModule } from '../investigation/investigation.module';
import { ExpeditionModule } from '../expedition/expedition.module';
import { ArmyProcessor } from './army.processor';
import { GatewayModule } from '../gateway/gateway.module';
import { PveConsumer } from './pve.consumer';
import { PveModule } from '../pve/pve.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'cria' }),
    BullModule.registerQueue({ name: 'exploraciones' }),
    BullModule.registerQueue({ name: 'construccion' }),
    BullModule.registerQueue({ name: 'investigation' }),
    BullModule.registerQueue({ name: 'reclutamiento' }),
    BullModule.registerQueue({ name: 'pve' }),
    ColoniesModule,
    ConstructionModule,
    InvestigationModule,
    ExpeditionModule,
    GatewayModule,
    PveModule,
  ],
  providers: [
    QueenDataConsumer,
    AntConsumptionProcessor,
    ExplorationConsumer,
    ConstructionConsumer,
    InvestigationConsumer,
    ArmyProcessor,
    PveConsumer,
  ],
  exports: [
    BullModule.registerQueue({ name: 'cria' }),
    BullModule.registerQueue({ name: 'exploraciones' }),
    BullModule.registerQueue({ name: 'construccion' }),
    BullModule.registerQueue({ name: 'investigation' }),
    BullModule.registerQueue({ name: 'reclutamiento' }),
    BullModule.registerQueue({ name: 'pve' }),
  ],
})
export class ConsumerModule { }
