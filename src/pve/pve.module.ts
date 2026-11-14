import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PveController } from './pve.controller';
import { PveService } from './pve.service';
import { PveScheduler } from './pve.scheduler';
import { GatewayModule } from '../gateway/gateway.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'pve' }),
    GatewayModule,
    ReportsModule,
  ],
  controllers: [PveController],
  providers: [PveService, PveScheduler],
  exports: [PveService],
})
export class PveModule {}
