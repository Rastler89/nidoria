import { Module } from "@nestjs/common";
import { ExpeditionService } from './expedition.services';
import { BullModule } from "@nestjs/bull";
import { GatewayModule } from "src/gateway/gateway.module";

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: '127.0.0.1',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'exploraciones',
    }),
    GatewayModule
  ],
  providers: [ExpeditionService],
  exports: [ExpeditionService],
})

export class ExpeditionModule { }
