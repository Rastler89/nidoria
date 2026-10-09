import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './gateway/redis-io.adapter';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from './config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // --- SEGURIDAD ---
  app.use(helmet());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  // -----------------

  // --- CONFIGURACIÓN DE REDIS PARA WEBSOCKETS ---
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  // ----------------------------------------------

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        config.appUrl,
        'http://localhost:3000', // Desarrollo local
        'http://127.0.0.1:3000',
      ];

      if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por políticas de CORS de Nidoria'));
      }
    },
    methods: 'GET,POST,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 API de Nidoria escuchando en puerto ${port} con soporte Redis WS`);
}
bootstrap();
