// main.worker.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // No montamos HTTP, solo el contexto de Nest
  const appContext = await NestFactory.createApplicationContext(AppModule);
  console.log('Worker Bull inicializado y esperando trabajos...');
}

bootstrap();