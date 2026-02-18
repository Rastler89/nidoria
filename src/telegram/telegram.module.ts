import { Module, Global } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '../config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [TelegramService, ConfigService],
  exports: [TelegramService],
})
export class TelegramModule {}
