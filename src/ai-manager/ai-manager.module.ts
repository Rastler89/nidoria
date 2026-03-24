import { Module } from '@nestjs/common';
import { AiManagerService } from './ai-manager.service';
import { AiManagerController } from './ai-manager.controller';
import { AiManagerGateway } from './ai-manager.gateway';

@Module({
  controllers: [AiManagerController],
  providers: [AiManagerService, AiManagerGateway],
})
export class AiManagerModule {}
