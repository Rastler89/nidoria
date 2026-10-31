# Nidoria API — Guía del repo

Servidor de juego multijugador (hormigas) en **NestJS 12**, base **PostgreSQL** vía **Prisma 6**, **Redis** para colas (BullMQ) y WebSockets (Socket.IO).

## Comandos

```bash
npm install
npx prisma generate          # después de tocar prisma/schema.prisma
npm run db:migrate -- --name <nombre>   # crea y aplica una migración en desarrollo
npm run db:deploy            # aplica migraciones pendientes (también lo hace la API al arrancar)
npm run db:status            # estado de las migraciones
npm run seed                 # semilla (prisma/seed.ts)
npm run start:dev            # API en watch (incluye cron: ENABLE_CRON=true)
npm run start:worker         # proceso worker de colas (sin HTTP, sin cron, sin migraciones)

npm run lint                 # eslint --fix
npm run format               # prettier
npm test                     # unit tests (jest, requiere --experimental-vm-modules, ya incluido en el script)
npm run test:e2e             # e2e: aplica migraciones a DATABASETEST_URL y corre test/jest-e2e.json
```

- La API escucha en `PORT ?? 4000`. CORS solo acepta localhost/127.0.0.1.
- Requiere PostgreSQL y Redis activos (ver `.env`: `DATABASE_URL`, `REDIS_HOST/PORT/USER/PASSWORD`). Ojo: el README dice MySQL pero el schema de Prisma es `postgresql`.

## Arquitectura

- `src/app.module.ts` — módulos: auth, users, resources, colonies, construction, investigation, expedition, army, ranking, help, admin, ai-manager, engine, consumers, config.
- `src/engine/` — **GameEngineService**: centraliza la composición del estado del hormiguero (`GameState`) y el cálculo de deltas. Es la única fuente de verdad del estado; REST y WebSocket la consumen. Ver `src/engine/README.md`.
- `src/gateway/anthill.gateway.ts` — Socket.IO: autentica por JWT en el handshake, une al cliente a la sala `anthill_{userId}`, emite `anthill_update` (deltas) y `auth_error`. Usa `RedisIoAdapter` (Redis pub/sub) para escalar.
- `src/consumers/` — procesadores BullMQ (construcción, investigación, exploraciones, consumo, ejército, reina) y `src/ant-consumption/`.
- **Colas** (`cria`, `construccion`, `investigation`, `ataques`, `exploraciones`, `consumo`, `reclutamiento`): se registran en `app.module.ts` y se ven en Bull Board bajo `/queues`.
- **Dos procesos**: la API (`main.ts`, habilita cron con `ENABLE_CRON=true`) y el worker (`main.worker.ts`, solo contexto Nest para consumir colas). Mucha lógica temporal corre en el worker — tenerlo en cuenta al agregar jobs.
- `src/prisma/` — capa de acceso a datos; `prisma/` en la raíz tiene schema y seeds.

## Convenciones

- Síguer la estructura de módulo Nest: `*.controller.ts`, `*.service.ts`, `*.module.ts`, DTOs para validación.
- Toda consulta/lectura del estado del hormiguero va por `GameEngineService`, no consultar Prisma directamente desde controllers/gateways para armar estado.
- Después de modificar código, mantener los tests al día (`*.spec.ts` junto al archivo); los e2e usan la DB de tests.
- El directorio `.agent/rules/graphify.md` describe el grafo de conocimiento `graphify-out/` (**ya generado** el 2026-10-15: ~924 nodos, ~44 comunidades). `graphify-out/` está en `.gitignore` — cada máquina lo regenera con `python -m graphify . --code-only` y luego `python -m graphify cluster-only .` (sin API key; Python 3.12 instalado en `~\AppData\Local\Programs\Python\Python312`). Tras cambios de código, refrescar con `python -m graphify update .` (sin flag `--code-only`, que es solo del build inicial).
