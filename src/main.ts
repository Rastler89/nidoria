import { NestFactory } from '@nestjs/core';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './gateway/redis-io.adapter'; // Importa el adaptador

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const bullBoardAdapter = new ExpressAdapter();
  bullBoardAdapter.setBasePath('/queues');
  createBullBoard({
    queues: ['cria', 'construccion', 'investigation', 'ataques', 'exploraciones', 'consumo', 'reclutamiento']
      .map((name) => new BullAdapter(app.get(getQueueToken(name)))),
    serverAdapter: bullBoardAdapter,
  });
  app.use('/queues', bullBoardAdapter.getRouter());

  // --- CONFIGURACIÓN DE REDIS PARA WEBSOCKETS ---
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  // ----------------------------------------------

  // Orígenes permitidos además de localhost. En producción se define
  // CORS_ORIGIN con el dominio del web (admite varios separados por comas):
  // CORS_ORIGIN=https://nidoria.org,https://www.nidoria.org
  const extraOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const isAllowedOrigin = (origin: string) => {
    const normalized = origin.replace(/\/+$/, '');
    return (
      normalized.includes('localhost') ||
      normalized.includes('127.0.0.1') ||
      extraOrigins.includes(normalized)
    );
  };

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin === 'null' || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por políticas de CORS de Nidoria'));
      }
    },
    methods: 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
  console.log('🚀 API de Nidoria escuchando en puerto 4000 con soporte Redis WS');
}
bootstrap();
