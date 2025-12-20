import { Module } from "@nestjs/common";
import { ExpeditionService } from './expedition.services';

@Module({
  imports: [],
  providers: [ ExpeditionService ],
  exports: [ ExpeditionService ],
})

export class ExpeditionModule {}