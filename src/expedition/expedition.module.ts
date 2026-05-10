import { Module } from "@nestjs/common";
import { ExpeditionService } from './expedition.services';
import { BullModule } from "@nestjs/bull";
import { GatewayModule } from "src/gateway/gateway.module";

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'exploraciones',
    }),
    GatewayModule
  ],
  providers: [ExpeditionService],
  exports: [ExpeditionService],
})

export class ExpeditionModule { }
