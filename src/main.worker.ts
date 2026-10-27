// main.worker.ts
import { NestFactory } from '@nestjs/core';
import { Server } from 'socket.io';
import { AppModule } from './app.module';
import { AnthillGateway } from './gateway/anthill.gateway';
import { createRedisAdapter } from './gateway/redis-io.adapter';

async function bootstrap() {
  // No montamos HTTP, solo el contexto de Nest
  // Se crea el contexto de Nest (sin HTTP) para mantener vivo el proceso que
  // consume las colas BullMQ. No se asigna porque solo importa su efecto.
  const app = await NestFactory.createApplicationContext(AppModule, {
    abortOnError: false
  });

  // El worker procesa jobs que cambian el estado del hormiguero, pero no atiende
  // conexiones. Le damos un servidor Socket.IO sin puerto con el adaptador Redis
  // para que sus emisiones lleguen a los clientes conectados a la API.
  try {
    const gateway = app.get(AnthillGateway);
    const ioServer = new Server();
    ioServer.adapter(await createRedisAdapter());
    gateway.server = ioServer;
    console.log('Realtime del worker enlazado por Redis');
  } catch (error) {
    console.warn(`Sin realtime en el worker: ${error.message}`);
  }

  console.log('Worker Bull inicializado y esperando trabajos...');
}

bootstrap();
