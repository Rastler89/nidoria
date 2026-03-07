import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueenDataConsumer } from './queen-data.consumer';
import { ColoniesModule } from '../colonies/colonies.module';
import { AntConsumptionProcessor } from './ant-consumption.processor';
import { ExplorationConsumer } from './exploration.consumer';
import { ConstructionConsumer } from './construction.consumer';
import { ExpeditionService } from '../expedition/expedition.services';
import { ConstructionService } from '../construction/construction.service';
import { InvestigationConsumer } from './investigation.consumer';
import { InvestigationService } from '../investigation/investigation.service';
import { AnthillGateway } from '../gateway/stats.controller';
import { JwtService } from '@nestjs/jwt';

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
  ],
  providers: [
    QueenDataConsumer,
    AntConsumptionProcessor,
    ExplorationConsumer,
    ConstructionConsumer,
    InvestigationConsumer,
    //servicios
    ExpeditionService,
    ConstructionService,
    InvestigationService,
    AnthillGateway,
    JwtService,
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