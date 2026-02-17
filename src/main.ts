import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /*app.enableCors({
    origin: 'http://localhost:3000', // tu Next.js
    credentials: true,
  });*/

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir: 1. Archivos locales (null), 2. Localhost, 3. Sin origen (Server-to-server)
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
}
bootstrap();
