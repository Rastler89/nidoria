import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { NidoriaConfigModule } from './config/config.module';
import { BullModule } from '@nestjs/bull';
import { ConsumerModule } from './consumers/consumer.module';
import { ResourcesModule } from './resources/resources.module';
import { ColoniesModule } from './colonies/colonies.module';
import { ConstructionModule } from './construction/construction.module';
import { ExpeditionModule } from './expedition/expedition.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AntConsumptionService } from './ant-consumption/ant-consumption.service';
import { AiManagerModule } from './ai-manager/ai-manager.module';
import { AdminModule } from './admin/admin.module';
import { InvestigationModule } from './investigation/investigation.module';
import { HelpModule } from './help/help.module';
import { ArmyModule } from './army/army.module';
import { RankingModule } from './ranking/ranking.module';
import { EngineModule } from './engine/engine.module';
import { BannerModule } from './banner/banner.module';
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
    InvestigationModule,
    ArmyModule,
    RankingModule,
    HelpModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NidoriaConfigModule,
    BullModule.forRootAsync({
      imports: [NidoriaConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.redisHost,
          port: config.redisPort,
          username: config.redisUser,
          password: config.redisPassword,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'cria' },
      { name: 'construccion' },
      { name: 'investigation' }, // Unificado a inglés
      { name: 'ataques' },
      { name: 'exploraciones' },
      { name: 'consumo' },
      { name: 'reclutamiento' },
    ),
    ConsumerModule,
    AiManagerModule,
    AdminModule,
    EngineModule,
    BannerModule
  ],
  controllers: [AppController],
  providers: [AppService, AntConsumptionService],
  exports: [AppService],
})
export class AppModule { }
