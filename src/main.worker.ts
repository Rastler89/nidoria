// main.worker.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // No montamos HTTP, solo el contexto de Nest
  // Se crea el contexto de Nest (sin HTTP) para mantener vivo el proceso que
  // consume las colas BullMQ. No se asigna porque solo importa su efecto.
  await NestFactory.createApplicationContext(AppModule, {
    abortOnError: false
  });
  console.log('Worker Bull inicializado y esperando trabajos...');
}

bootstrap();
