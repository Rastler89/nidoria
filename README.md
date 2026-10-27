# 🐜 Nidoria — API

Servidor de juego multijugador de estrategia ambientado en un mundo de hormigas. Construido con **NestJS**, **Prisma** (PostgreSQL) y **Redis** (colas BullMQ + WebSockets Socket.IO).

Forma parte de un proyecto con dos repos:

- **`nidoria`** (este repo) — la API / servidor de juego.
- **[`nidoria_web`](https://github.com/Rastler89/nidoria_web)** — el cliente web (Next.js).

---

## 🧰 Stack

- [NestJS](https://nestjs.com/) — framework backend (Node.js)
- [Prisma](https://www.prisma.io/) — ORM sobre **PostgreSQL**
- [Redis](https://redis.io/) — colas (BullMQ) y adapter de WebSockets
- [Socket.IO](https://socket.io/) — tiempo real (estado del hormiguero vía deltas)
- JWT + Passport — autenticación

> Nota: el README original mencionaba MySQL; el proyecto usa **PostgreSQL** (ver `prisma/schema.prisma`).

---

## 🚀 Arranque rápido

Requisitos: Node 20+, Docker (para Postgres y Redis).

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env    # y completar valores

# 3. Levantar infraestructura (Postgres + Redis)
docker compose up -d database redis

# 4. Prisma: cliente + migraciones + seed
npx prisma generate
npx prisma migrate dev
npm run seed

# 5. Servidor (watch, con cron habilitada)
npm run start:dev

# 6. Worker de colas (proceso separado, sin HTTP)
npm run start:worker
```

La API escucha en `http://localhost:4000`. El panel Bull Board queda en `http://localhost:4000/queues`.

> **Importante:** el juego tiene **dos procesos**: la API (`main.ts`) y el worker (`main.worker.ts`) que consume las colas BullMQ. Para jugar/completar hay que tener ambos levantados.

---

## 🧪 Tests

Ver [TESTING.md](./TESTING.md) para la guía completa.

```bash
npm test              # unitarios (Jest)
npm run test:cov      # con cobertura
npm run test:e2e      # end-to-end (requiere DB de tests corriendo)
npm run test:ai-player# bots que simulan jugadores (stress/flujo)
```

Para e2e: levantar la DB de tests (`docker compose up -d test-database`) y tener `DATABASETEST_URL` apuntando al puerto 5433.

---

## 🏗️ Arquitectura

- **`src/engine/`** — `GameEngineService`: única fuente de verdad del estado del hormiguero. Compon el estado y calcula **deltas** para no reenviar el estado completo. Lo consumen REST y el gateway WebSocket. Ver `src/engine/README.md`.
- **`src/gateway/anthill.gateway.ts`** — Socket.IO: autentica por JWT en el handshake, une al cliente a la sala `anthill_{userId}`, emite `anthill_update` (deltas) y `auth_error`.
- **`src/consumers/`** — procesadores BullMQ (construcción, investigación, exploraciones, consumo, ejército, reina).
- **Colas:** `cria`, `construccion`, `investigation`, `ataques`, `exploraciones`, `consumo`, `reclutamiento` (visibles en `/queues`).
- Módulos de dominio: `auth`, `users`, `colonies`, `resources`, `construction`, `investigation`, `expedition`, `army`, `ranking`, `admin`, `ai-manager`, `help`, `config`.

### Variables de entorno

Ver [.env.example](./.env.example). Las más relevantes: `DATABASE_URL`, `REDIS_HOST/PORT`, `DATABASETEST_URL`, `PORT`, `JWT_SECRET` (obligatorio en producción).

---

## 🤖 AI Player

Simuladores de jugadores (bots) para detectar regresiones y errores 500. Ver [AI_PLAYER.md](./AI_PLAYER.md).

---

## 📦 Deploy

Hay `Dockerfile` y `docker-compose.yml` listos para levantar API + Postgres + Redis. Ver la checklist de beta en la raíz del proyecto para los pasos de producción.
