import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './gateway/redis-io.adapter'; // Importa el adaptador

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CONFIGURACIÓN DE REDIS PARA WEBSOCKETS ---
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  // ----------------------------------------------

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin === 'null' || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por políticas de CORS de Nidoria'));
      }
    },
    methods: 'GET,POST,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
  console.log('🚀 API de Nidoria escuchando en puerto 4000 con soporte Redis WS');
}
bootstrap();
