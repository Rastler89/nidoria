import { Module } from "@nestjs/common";
import { ExpeditionService } from './expedition.services';
import { BullModule } from "@nestjs/bull";

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
    })
  ],
  providers: [ExpeditionService],
  exports: [ExpeditionService],
})

export class ExpeditionModule { }