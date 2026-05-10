import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesModule } from '../colonies/colonies.module';
import { AntConsumptionProcessor } from './ant-consumption.processor';
import { ExplorationConsumer } from './exploration.consumer';
import { ConstructionConsumer } from './construction.consumer';
import { InvestigationConsumer } from './investigation.consumer';
import { AnthillGateway } from '../gateway/anthill.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConstructionModule } from '../construction/construction.module';
import { InvestigationModule } from '../investigation/investigation.module';
import { ExpeditionModule } from '../expedition/expedition.module';
import { ArmyProcessor } from './army.processor';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'cria' }),
    BullModule.registerQueue({ name: 'exploraciones' }),
    BullModule.registerQueue({ name: 'construccion' }),
    BullModule.registerQueue({ name: 'investigation' }),
    BullModule.registerQueue({ name: 'reclutamiento' }),
    ColoniesModule,
    ConstructionModule,
    InvestigationModule,
    ExpeditionModule,
    GatewayModule,
  ],
  providers: [
    QueenDataConsumer,
    AntConsumptionProcessor,
    ExplorationConsumer,
    ConstructionConsumer,
    InvestigationConsumer,
    ArmyProcessor,
  ],
  exports: [
    BullModule.registerQueue({ name: 'cria' }),
    BullModule.registerQueue({ name: 'exploraciones' }),
    BullModule.registerQueue({ name: 'construccion' }),
    BullModule.registerQueue({ name: 'investigation' }),
    BullModule.registerQueue({ name: 'reclutamiento' }),
  ],
})
export class ConsumerModule { }
