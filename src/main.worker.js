import { NestFactory } from '@nestjs/core';
import { QueueModule } from './queue/queue.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(QueueModule);
}
bootstrap();