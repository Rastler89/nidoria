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

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal:true,
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
    ),
    ConsumerModule
  ],
  controllers: [AppController],
  providers: [AppService, ConfigService],
  exports: [AppService, ConfigService],
})
export class AppModule {}
