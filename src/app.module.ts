import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bull';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ConsumerModule } from './consumers/consumer.module';
import { ResourcesModule } from './resources/resources.module';
import { ColoniesModule } from './colonies/colonies.module';
import { ConstructionModule } from './construction/construction.module';
import { ExpeditionModule } from './expedition/expedition.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AntConsumptionService } from './ant-consumption/ant-consumption.service';
import { AiManagerModule } from './ai-manager/ai-manager.module';
import { AdminModule } from './admin/admin.module';

const isCronProcess = process.env.ENABLE_CRON === 'true';

@Module({
  imports: [
    ...(isCronProcess ? [ScheduleModule.forRoot()] : []),
    AuthModule,
    ResourcesModule,
    ColoniesModule,
    UsersModule,
    ExpeditionModule,
    ConstructionModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost', // use the service name from docker-compose if its different
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      { name: 'cria' },
      { name: 'construccion' },
      { name: 'investigacion' },
      { name: 'ataques' },
      { name: 'exploraciones' },
      { name: 'consumo' },
    ),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter, // Or FastifyAdapter from `@bull-board/fastify`
    }),
    BullBoardModule.forFeature(
      { name: 'cria', adapter: BullAdapter },
      { name: 'construccion', adapter: BullAdapter },
      { name: 'investigacion', adapter: BullAdapter },
      { name: 'ataques', adapter: BullAdapter },
      { name: 'exploraciones', adapter: BullAdapter },
      { name: 'consumo', adapter: BullAdapter },
    ),
    ConsumerModule,
    AiManagerModule,
    AdminModule
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService, AntConsumptionService],
  exports: [AppService, ConfigService],
})
export class AppModule { }
