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
import { REDIS_QUEUE_NAME } from './constants';
import { ProcessDataConsumer } from './consumers/process-data.consumer'

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal:true,
    }),
    BullModule.forRoot({
      redis: {
        host: 'redis_testqueues', // use the service name from docker-compose if its different
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: REDIS_QUEUE_NAME,
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter, // Or FastifyAdapter from `@bull-board/fastify`
    }),
    BullBoardModule.forFeature({
      name: REDIS_QUEUE_NAME,
      adapter: BullAdapter,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService, ProcessDataConsumer],
  exports: [AppService, ConfigService],
})
export class AppModule {}
