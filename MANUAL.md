# Nidoria API — Manual de Referencia

> Servidor de juego de estrategia multijugador ambientado en un mundo de hormigas.
> **Stack:** NestJS 11 + Prisma 6 + PostgreSQL + Redis + BullMQ + Socket.IO

---

## Índice

1. [Arquitectura](#1-arquitectura)
2. [Modelo de Datos](#2-modelo-de-datos)
3. [API Endpoints](#3-api-endpoints)
4. [Autenticación](#4-autenticación)
5. [Sistema de Colas](#5-sistema-de-colas)
6. [WebSocket](#6-websocket)
7. [Motor de Juego](#7-motor-de-juego)
8. [Configuración](#8-configuración)
9. [Seed & Árbol de Tecnologías](#9-seed--árbol-de-tecnologías)
10. [AI Player](#10-ai-player)
11. [Panel de Administración](#11-panel-de-administración)
12. [Despliegue](#12-despliegue)
13. [Testing](#13-testing)

---

## 1. Arquitectura

### Estructura de Directorios

```
src/
├── main.ts                    # Entry point HTTP + WebSocket
├── main.worker.ts             # Entry point worker (solo colas)
├── app.module.ts              # Módulo raíz
├── app.controller.ts          # Controlador principal (todos los endpoints)
├── app.service.ts             # Servicio raíz
├── config.service.ts          # Variables de entorno tipadas
│
├── auth/                      # Autenticación JWT + Passport
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── constants.ts
│   ├── jwt.strategy.ts
│   └── local.strategy.ts
│
├── users/                     # Gestión de usuarios
│   ├── users.module.ts
│   └── users.service.ts
│
├── colonies/                  # Lógica de hormigueros
│   ├── colonies.module.ts
│   └── colonies.service.ts
│
├── resources/                 # Recursos y límites
│   ├── resources.module.ts
│   └── resources.service.ts
│
├── construction/              # Construcciones
│   ├── construction.module.ts
│   └── construction.service.ts
│
├── investigation/             # Investigaciones
│   ├── investigation.module.ts
│   └── investigation.service.ts
│
├── expedition/                # Expediciones (misiones)
│   ├── expedition.module.ts
│   └── expedition.services.ts
│
├── army/                      # Ejército y reclutamiento
│   ├── army.module.ts
│   ├── army.controller.ts
│   └── army.service.ts
│
├── ranking/                   # Sistema de ranking
│   ├── ranking.module.ts
│   ├── ranking.controller.ts
│   └── ranking.service.ts
│
├── engine/                    # Motor de juego central
│   ├── engine.module.ts
│   ├── engine.service.ts
│   └── types.ts
│
├── consumers/                 # Procesadores de colas Bull
│   ├── consumer.module.ts
│   ├── queen-data.consumer.ts       # Cola 'cria' (ciclo huevo→larva→hormiga)
│   ├── construction.consumer.ts     # Cola 'construccion'
│   ├── investigation.consumer.ts    # Cola 'investigation'
│   ├── exploration.consumer.ts      # Cola 'exploraciones'
│   ├── army.processor.ts            # Cola 'reclutamiento'
│   └── ant-consumption.processor.ts # Cola 'consumo'
│
├── ant-consumption/           # Cron de consumo de recursos
│   ├── ant-consumption.module.ts
│   └── ant-consumption.service.ts
│
├── gateway/                   # WebSocket (Socket.IO + Redis)
│   ├── gateway.module.ts
│   ├── anthill.gateway.ts
│   └── redis-io.adapter.ts
│
├── guards/                    # Guards de seguridad
│   ├── jwt-auth.guard.ts
│   ├── local-auth.guard.ts
│   ├── roles.guard.ts
│   ├── roles.decorator.ts
│   └── basic-auth.guard.ts
│
├── admin/                     # Panel de administración
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   └── dashboard.html
│
├── ai-manager/                # AI Player (bots de prueba)
│   ├── ai-manager.module.ts
│   ├── ai-manager.controller.ts
│   ├── ai-manager.service.ts
│   ├── ai-manager.gateway.ts
│   ├── entities/ai-player.entity.ts
│   └── utils/suggestion-engine.ts
│
├── help/                      # Árbol de tecnología (endpoint /three)
│   ├── help.module.ts
│   └── help.service.ts
│
├── mail/                      # Correo electrónico
│   ├── mailer.service.ts
│   └── templates/verification.html
│
├── prisma/                    # ORM
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
└── config/                    # Configuración global
    ├── config.module.ts
    └── anthill.config.ts
```

### Flujo de Datos

```
Cliente Web ←→ API (NestJS HTTP) ←→ Prisma ←→ PostgreSQL
              ↕                    ↕
         WebSocket (Socket.IO)   Redis (colas BullMQ + adaptador WS)
              ↕
         Redis Adapter (pub/sub multi-instancia)
```

### Procesos

| Proceso | Comando | Puerto | Descripción |
|---------|---------|--------|-------------|
| **API** | `npm run start:dev` | 4000 | Servidor HTTP + WebSocket + Cron |
| **Worker** | `npm run start:worker` | — | Solo procesa colas Bull (sin HTTP, sin cron) |

---

## 2. Modelo de Datos

### Diagrama de Entidades

```
User ──┬── Anthill (1:N)
       └── UserTitle (N:M) ── Title

Anthill ──┬── ResourceAnthill (1:N) ── Resource
          ├── AntsAnthill (1:N) ── Ant
          ├── ConstructionAnthill (1:N) ── Construction
          ├── InvestigationAnthill (1:N) ── Investigation
          ├── Exploration (1:N) ── Resource
          ├── Deployment (aggressor/defensor) (1:N)
          └── World (N:1)

Deployment ── AntsDeploy (N:M) ── Ant

Requirement (polimórfico: targetId + targetType → CONSTRUCTION | INVESTIGATION | ANT)
```

### User

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int (PK) | Autoincremental |
| username | String | Nombre de usuario |
| email | String (único) | Correo electrónico |
| password | String | Hash bcrypt |
| token | String? | Token de verificación |
| refresh_token | String? | Refresh token JWT |
| verified | DateTime? | Fecha de verificación |
| role | String (def: "user") | Rol: "user" \| "admin" |
| lastLogin | DateTime? | Último inicio de sesión |

### Anthill (Hormiguero)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int (PK) | Autoincremental |
| ownerId | Int (FK→User) | Propietario |
| positionX, positionY | Int | Coordenadas en el mundo |
| eggs, larva, ants, antsBusy | Int | Población |
| capacities | Json | `{FOOD, LEAD, WOOD}` capacidad por recurso |
| popMax | Int (def: 50) | Población máxima |
| militaryPopMax | Int (def: 0) | Población militar máxima |
| powerConstruction | Int | Puntos de ranking (construcción) |
| powerInvestigation | Int | Puntos de ranking (investigación) |
| powerMilitary | Int | Puntos de ranking (militar) |
| powerTotal | Int | Puntos totales de ranking |
| worldId | Int? (FK→World) | Mundo al que pertenece |

### Construction

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int (PK) | Autoincremental |
| name, code | String (único) | Nombre y código identificador |
| effects | Json? | Efectos (popMax, storage, etc.) |
| points | Int | Puntos de ranking por nivel |
| base_food/wood/lead/ants/time | Int | Costes base |
| multiplier | Float | Multiplicador por nivel |
| maxInstances | Int (def: 1) | Instancias máximas por hormiguero |
| maxLevel | Int (def: 1) | Niveles máximos |

### Investigation

Misma estructura que Construction (base_food/wood/lead/ants/time, multiplier, maxLevel, effects, points).

### Ant

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int (PK) | Autoincremental |
| name, code | String (único) | Nombre y código |
| type | AntType | `ARTILLERY \| LIGHT \| WEIGHT \| SPECIAL` |
| attack, defense | Int | Estadísticas de combate |
| speed_attack, speed_defense | Int | Velocidad |
| heal | Int | Curación |
| capacity | Int | Capacidad de carga |
| points | Int | Puntos de ranking por unidad |
| base_food/wood/lead/ants/time | Int | Costes base |

### Resource

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int (PK) | Autoincremental |
| name | String (único) | "Comida", "Madera", "Hojas" |
| type | ResourceType | `FOOD \| WOOD \| LEAD` |

### Requirement (Requisitos polimórficos)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| targetId | Int | ID del item que requiere |
| targetType | ItemType | `CONSTRUCTION \| INVESTIGATION \| ANT` |
| targetLevel | Int | Nivel requerido del target |
| requiredType | ItemType | Tipo del item requerido |
| requiredId | Int | ID del item requerido |
| requiredLevel | Int | Nivel mínimo requerido |

### World

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int (PK) | Autoincremental |
| name | String (único) | Nombre del mundo |
| maxPlayers | Int (def: 1000) | Jugadores máximos |
| currentPlayers | Int | Jugadores actuales |

### ConstructionAnthill / InvestigationAnthill

Estado por hormiguero: level, finishingAt, status (`BUILDING/COMPLETED` | `INVESTIGATING/COMPLETED`).

### Deployment / AntsDeploy

Sistema de despliegues militares con tipo `ATTACK | DEFENSE | EVENT`, temporizador finish, y resultado en JSON.

---

## 3. API Endpoints

### Salud

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | — | Health check |

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/pre-register` | — | Pre-registro (solo email) |
| POST | `/auth/register` | — | Registro completo con verificación por email |
| POST | `/auth/login` | Local | Login (username/email + password) |
| POST | `/auth/refresh` | — | Refrescar access token |
| POST | `/auth/logout` | Local | Logout |
| GET | `/verifyAccount/:id/:token` | — | Verificar cuenta |

**Request login:**
```json
{ "username": "user", "password": "pass" }
```

**Response login:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": { "id": 1, "username": "...", "email": "...", "role": "user" }
}
```

### Perfil

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/profile` | JWT | Perfil del usuario autenticado |

### Recursos y Estado

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/resources` | JWT | Estado completo del hormiguero (incluye recursos, construcciones, investigaciones, ejército, exploraciones) |

### Expediciones (Misiones)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/mission` | JWT | Iniciar/actualizar expedición |

**Request:**
```json
{ "resource": "FOOD", "amount": 10 }
```

### Construcciones

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/constructions` | JWT | Lista de construcciones disponibles con costes y requisitos |
| POST | `/constructions` | JWT | Iniciar construcción |

**Request POST:**
```json
{ "constructionId": 1, "instance": 2 }
```
(`instance` es opcional; si se omite, es construcción nueva; si se incluye, es mejora)

### Investigaciones

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/investigations` | JWT | Lista de investigaciones disponibles |
| POST | `/investigations` | JWT | Iniciar investigación |

### Unidades (Ejército)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/units` | JWT | Lista de unidades reclutables |
| POST | `/units` | JWT | Iniciar reclutamiento |

**Request:**
```json
{ "antId": 1, "amount": 5 }
```

### Endpoint alternativo de Unidades

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/ants` | JWT | Lista de unidades (via ArmyController) |
| POST | `/ants` | JWT | Reclutar unidades |

### Ranking

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/ranking` | JWT | Ranking en 4 categorías + posición del usuario |

**Response:**
```json
{
  "general": { "top10": [...], "user": { "rank": 5, "points": 1250 } },
  "construction": { "top10": [...], "user": { "rank": 3, "points": 500 } },
  "investigation": { ... },
  "military": { ... }
}
```

### Árbol de Tecnología

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/three` | — | Datos completos del árbol de tecnología |

### Panel de Administración

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/antmaster` | — | Dashboard HTML |
| GET | `/antmaster/api/summary` | JWT + Admin | Resumen del sistema |
| GET | `/antmaster/api/users` | JWT + Admin | Lista de usuarios |
| PATCH | `/antmaster/api/users/:id/role` | JWT + Admin | Cambiar rol |
| DELETE | `/antmaster/api/users/:id` | JWT + Admin | Eliminar usuario |
| GET | `/antmaster/api/anthills` | JWT + Admin | Lista de hormigueros |
| GET | `/antmaster/api/queues-stats` | JWT + Admin | Estadísticas de colas |
| GET/POST/PATCH/DELETE | `/antmaster/api/constructions` | JWT + Admin | CRUD construcciones |
| GET/POST/PATCH/DELETE | `/antmaster/api/investigations` | JWT + Admin | CRUD investigaciones |
| GET/POST/PATCH/DELETE | `/antmaster/api/ants` | JWT + Admin | CRUD hormigas |
| GET/POST/PATCH/DELETE | `/antmaster/api/resources` | JWT + Admin | CRUD recursos |
| GET/POST/PATCH/DELETE | `/antmaster/api/requirements` | JWT + Admin | CRUD requisitos |
| GET/DELETE | `/antmaster/api/deployments` | JWT + Admin | Despliegues militares |
| GET/DELETE | `/antmaster/api/explorations` | JWT + Admin | Exploraciones activas |
| PATCH | `/antmaster/api/anthills/:id` | JWT + Admin | Actualizar hormiguero |
| GET | `/antmaster/api/anthills/:id/full` | JWT + Admin | Detalle completo |
| PATCH | `/antmaster/api/anthills/:id/resources/:rid` | JWT + Admin | Ajustar recursos |
| PATCH | `/antmaster/api/anthills/:id/ants/:aid` | JWT + Admin | Ajustar hormigas |
| PATCH | `/antmaster/api/constructions-anthill/:id` | JWT + Admin | Ajustar construcción |
| PATCH | `/antmaster/api/investigations-anthill/:id` | JWT + Admin | Ajustar investigación |
| GET/POST/DELETE | `/antmaster/api/titles` | JWT + Admin | Gestión de títulos |
| POST | `/antmaster/api/tools/trigger-job` | JWT + Admin | Disparar job manual |
| GET | `/antmaster/api/analysis/health` | JWT + Admin | Salud del juego |
| GET | `/antmaster/api/analysis/tech-tree` | JWT + Admin | Árbol de tecnología |

### AI Player

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/ai/start` | JWT + Admin | Iniciar bot IA |
| POST | `/ai/stop/:username` | JWT + Admin | Parar bot |
| POST | `/ai/delete/:username` | JWT + Admin | Eliminar bot |
| POST | `/ai/force/:username/:action` | JWT + Admin | Forzar acción |
| GET | `/ai/players` | JWT + Admin | Listar bots activos |

### Bull Board

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/queues` | — | Panel de monitoreo de colas Bull |

---

## 4. Autenticación

### Estrategias Passport

1. **LocalStrategy** — Valida username/password contra bcrypt
2. **JwtStrategy** — Extrae token Bearer del header Authorization

### Flujo de Registro

```
POST /auth/register → crea usuario con token → crea hormiguero + mundo → envía email verificación
GET /verifyAccount/:id/:token → verifica → inicia cola 'cria' (Reina empieza a poner huevos)
```

### Guards

| Guard | Uso |
|-------|-----|
| `JwtAuthGuard` | Protege endpoints autenticados |
| `LocalAuthGuard` | Protege login |
| `RolesGuard` | Verifica rol "admin" |
| `BasicAuthGuard` | Basic auth para dashboard AI (legacy) |
| `ThrottlerGuard` | Rate limiting global (100 req/60s) |

### Roles

- `user` (por defecto)
- `admin` (acceso al panel /antmaster y /ai)

---

## 5. Sistema de Colas

### Colas BullMQ

| Cola | Procesos | Descripción |
|------|----------|-------------|
| `cria` | `new_egg` → `egg_to_larva` → `larva_to_ant` | Ciclo biológico (Reina) |
| `construccion` | `new_construction` | Finalizar construcción |
| `investigation` | `new_investigation` | Finalizar investigación |
| `exploraciones` | `exploration` | Finalizar expedición |
| `reclutamiento` | `recruit_units` | Finalizar reclutamiento |
| `consumo` | `calculate-consumption` | Consumo de comida (cron cada 10 min) |
| `ataques` | — | Reservada para futuros ataques |

### Ciclo de la Reina (Cola `cria`)

```
[CRON] Inicio (vía initQueen en verifyAccount)
  └─ new_egg (delay: 1 min)
       ├─ addEggToColony: eggs++
       └─ egg_to_larva (delay: 1.5 min)
            ├─ convertEggToLarva: eggs--, larva++
            └─ larva_to_ant (delay: 2 min)
                 └─ convertLarvaToAnt: larva--, ants++
                      └─ WebSocket: sendUpdate
                           └─ new_egg (delay: 1 min) ← LOOP
```

### Pausa de Colonia

Si no hay comida para un huevo Y el usuario no ha iniciado sesión en 7 días, el ciclo se pausa. Se reanuda automáticamente al reconectar vía WebSocket.

### Consumo de Recursos (Cron)

`*/10 * * * *` → Job `calculate-consumption`:
- Hormigas civiles: 1 comida/unidad
- Hormigas militares: 2 comida/unidad
- Procesa en lotes de 100 hormigueros con transacciones atómicas

---

## 6. WebSocket

### Gateway: AnthillGateway

**Ruta:** Socket.IO (namespace por defecto `/`)

**Conexión:**
```javascript
const socket = io('ws://localhost:4000', {
  auth: { token: 'Bearer <jwt>' }
});
```

**Eventos:**
| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `anthill_update` | Servidor → Cliente | Delta de estado (solo cambios) |
| `auth_error` | Servidor → Cliente | Error de autenticación |

### Deltas

Usa `GameEngineService.calculateDelta()` para comparar estados viejos vs nuevos y solo enviar diferencias. Reduce tráfico drásticamente.

### Redis Adapter

`RedisIoAdapter` usa `@socket.io/redis-adapter` para escalar WebSocket a múltiples instancias.

### Reactivación

Al reconectar, verifica si la Reina está pausada y reencola el ciclo si es necesario.

---

## 7. Motor de Juego

### GameEngineService

**`getFullState(userId)`** — Devuelve el estado completo y normalizado:

```typescript
interface GameState {
  stats: { eggs, larva, ants, antsBusy };
  resources: { type, name, stock }[];
  buildings: { id, type, name, code, level, status, finishingAt }[];
  techs: { id, investigationId, name, level, status, finishingAt }[];
  army: { type, name, total, busy }[];
  explorations: { resourceName, resourceType, workers, quantity, duration, createdAt, finishingAt }[];
}
```

**`calculateDelta(oldState, newState)`** — Compara por bloques (JSON.stringify) y devuelve solo lo que cambió.

### ResourcesService

**`updateColonyLimits(anthillId)`** — Recalcula `popMax`, `militaryPopMax` y `capacities` en base a construcciones e investigaciones completadas. Aplica efectos como:
- `popMax` → incrementa población máxima
- `militaryPopMax` → población militar máxima
- `storage` / `storageFood` / `storageWood` / `leafStorage` → capacidad de almacenamiento

### Configuración Base (anthill.config.ts)

```typescript
LIMITS = {
  BASE_POPULATION: 50,
  BASE_MILITARY_POPULATION: 10,
  BASE_RESOURCE_CAPACITY: 1000
};

INITIAL_RESOURCES = { FOOD: 1000, WOOD: 500, LEAD: 200 };

WORLD = {
  MIN_DISTANCE_BETWEEN_COLONIES: 30,
  MAP_SIZE: 1000,
  MAX_PLAYERS_PER_WORLD: 1000
};

BIOLOGY = {
  EGG_COST_FOOD: 40,
  EGG_TIME_BASE: 1 // minuto
};
```

---

## 8. Configuración

### Variables de Entorno (.env)

| Variable | Defecto | Descripción |
|----------|---------|-------------|
| PORT | 4000 | Puerto del servidor |
| NODE_ENV | production | Entorno |
| DATABASE_URL | — | PostgreSQL connection string |
| REQUIRED_DB_VERSION | — | Versión de migración esperada |
| REDIS_HOST | localhost | Host de Redis |
| REDIS_PORT | 6379 | Puerto de Redis |
| REDIS_USER | — | Usuario Redis |
| REDIS_PASSWORD | — | Contraseña Redis |
| MAIL_HOST | sandbox.smtp.mailtrap.io | SMTP host |
| MAIL_PORT | 2525 | SMTP puerto |
| MAIL_USER | — | SMTP usuario |
| MAIL_PASS | — | SMTP contraseña |
| MAIL_FROM | "Nidoria Online" <no-reply@nidoria.com> | Dirección remitente |
| APP_URL | http://localhost:3000 | URL del frontend |
| ENABLE_CRON | false | Activar ScheduleModule |

### Verificación Automática de DB

En `PrismaService.onModuleInit()`:
1. Verifica que la última migración coincida con `REQUIRED_DB_VERSION`
2. Si no coincide, ejecuta `npx prisma migrate deploy`
3. Si hay migraciones fallidas, intenta resolver con `prisma migrate resolve --rolled-back`
4. Como último recurso, ejecuta `prisma db push --accept-data-loss`
5. Verifica si hay datos semilla; si no, ejecuta el seed automáticamente

---

## 9. Seed & Árbol de Tecnologías

### Ejecución

```bash
npm run seed          # Todos los seeders
npm run seed ants     # Solo hormigas
npm run seed structures  # Solo construcciones
npm run seed investigations  # Solo investigaciones
```

### Recursos Base (resources.seeder)

| Nombre | Tipo |
|--------|------|
| Comida | FOOD |
| Madera | WOOD |
| Hojas | LEAD |

### Construcciones (20 edificios)

| Código | Nombre | Efecto principal |
|--------|--------|-----------------|
| creina | Cámara de la reina | popMax +50, storage +500 |
| despensa | Despensa | storageFood +2000 |
| guarderia | Guardería real | popMax +100 |
| cronicas | Cámara de las crónicas | research boost |
| colector | Colector de hojas | activeLead |
| silo | Silo de madera | storageWood +2000 |
| cuartel | Cuartel Militar | activeUnits |
| laboratorio | Laboratorio | research boost |
| huerto | Huerto Fúngico | convertLead |
| muda | Cámara de muda | armorBonus |
| taller | Taller de carpintería | constructionSpeed |
| tunel | Túnel de viento | movementSpeed |
| genetica_ed | Laboratorio de genética | — |
| plaza | Plaza enjambre | militaryPopMax +500 |
| atalaya | Atalaya de antenas | visionRange |
| prensa | Prensa de hojas | leafStorage +5000 |
| justas | Campo de justas | attackBuff |
| santuario | Santuario real | queenHealth |
| puerta | Puerta de ébano | baseDefense |
| catacumba | Catacumbas residuo | recycleEfficiency |
| conducto | Conducto Ácido | acidTrapDamage |
| invernacion | Cámara de Invernación | upkeepReduction |

### Investigaciones (29 tecnologías)

Desde `metabolismo` (Metabolismo lento) hasta `asedio_final` (Ingeniería de asedio final), pasando por `genetica_inv`, `herencia` (Herencia de la reina), `armadura` (Bio-armadura final), etc.

### Hormigas (40 unidades en 3 tipos)

| Tipo | Ejemplos |
|------|----------|
| **LIGHT** (10) | saqueador, piquete, centinela, enjambre errante, corredor, asaltante, verdugo, fuerza, escamas, infiltrado |
| **WEIGHT** (10) | barro, gladiador, mandíbula, destructor, roca, excavadora, árbol, tormento, torreón, muralla |
| **ARTILLERY** (10) | avispero, bomba, escupidor, cazador, catapulta, francotirador, rociador, alquitrán, toxina, asedio |

### Sistema de Requisitos

Cada construcción, investigación y unidad puede requerir niveles específicos de otros items. Ejemplo:

```
despensa Nv.1 → requiere creina Nv.1
cuartel Nv.1 → requiere creina Nv.3 + reclutamiento Nv.1
santuario Nv.1 → requiere herencia Nv.5
asedio (unidad) Nv.15 → requiere herencia Nv.15
```

---

## 10. AI Player

### Propósito

Simula jugadores automatizados (bots) que interactúan con la API para detección de errores, regresiones y estrés del servidor.

### Personalidades

| Personalidad | Comportamiento |
|-------------|----------------|
| Explorador | Balancea recursos, elige el más escaso |
| Seguridad | Prioriza comida, estable |
| Cauto | Prioriza comida extrema cuando escasea |
| Industrioso | Prioriza madera para construir |

### Sistema de Objetivos

Adaptativo según nivel de comida:
- `SOBREVIVIR` (<100) → solo misiones de comida
- `AUDITAR` (100-800) → comportamiento normal
- `EXPANDIR` (≥800) → prioriza construcción
- `HIBERNAR` → modo reposo

### Aprendizaje

- Cada acción tiene un peso de probabilidad
- Las acciones exitosas aumentan su peso
- Las acciones fallidas lo reducen (`evolveWeights()`)
- Sistema de niveles y XP (cada 100 XP → level up)

### Acciones

Registro, Login, Obtener Recursos, Iniciar Misión, Construir, Investigar, Reclutar, Health Check, Refresh Token, Misión Inválida, Acceso No Autorizado, Login Inválido, Descansar.

---

## 11. Panel de Administración

**URL:** `http://localhost:4000/antmaster`

Protegido por JWT + rol admin. Incluye:
- Resumen del sistema (usuarios, hormigueros, verificados)
- Gestión de usuarios (cambiar rol, eliminar)
- CRUD completo de: construcciones, investigaciones, hormigas, recursos, requisitos
- Gestión de títulos
- Vista detallada de hormigueros con capacidad de modificar recursos, hormigas, construcciones
- Despliegues y exploraciones activas
- Estadísticas de colas Bull
- Trigger manual de jobs
- Health check del juego
- Análisis del árbol de tecnología

**Bull Board:** `http://localhost:4000/queues`

---

## 12. Despliegue

### Docker (Producción)

```bash
docker compose up -d
```

**Servicios:**
- `api` → NestJS en puerto 3001 (host) → 3000 (contenedor)
- `database` → PostgreSQL 14 (puerto 5432)
- `redis` → Redis 7 (puerto 6379)
- `test-database` → PostgreSQL 14 para tests (puerto 5433)

### Docker (Desarrollo)

```bash
docker compose -f docker-compose.dev.yml up -d
```

Incluye solo PostgreSQL, Redis y pgAdmin (puerto 8080).

### Dockerfile (Multi-stage)

1. **Builder:** Node 20 Alpine + instala dependencias + genera Prisma + build
2. **Runner:** Node 20 Alpine + copia dist, node_modules, prisma

### Inicio Manual

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run start:dev      # API + WebSocket + Cron
npm run start:worker   # Worker de colas (proceso separado)
```

---

## 13. Testing

### Comandos

```bash
npm test                # Tests unitarios (Jest)
npm run test:cov        # Cobertura
npm run test:e2e        # Tests end-to-end
npm run test:ai-player  # AI Player (test funcional/stress)
```

### Cobertura Actual

| Módulo | Tests | Cobertura |
|--------|-------|-----------|
| AuthService | 5 | register, validateUser, login, verifyAccount |
| ColoniesService | 3 | createColonyForUser, addEggToColony |
| ResourcesService | 2 | getAllResources |
| ConstructionService | 10 | costes, requisitos, recursos, finish, maxLevel |
| ExpeditionService | 8 | validación, creación, actualización, finalización |
| AdminService | 5 | users, summary, constructions, ants, deployments |
| QueenDataConsumer | 8 | ciclo completo + pausa (4 escenarios) |
| AntConsumptionProcessor | 5 | consumo multi-anthill |
| AnthillConfig | 9 | validación de balance |
| SuggestionEngine | 12 | todos los códigos de error |
| AppController | 7 | endpoints principales |
| E2E (app) | 6 | hello, protección, register, login, resources, mission |
| E2E (auth) | 3 | registro exitoso, duplicado, login inválido |

---

## Comandos Rápidos

```bash
# Desarrollo
npm run start:dev              # API con hot-reload
npm run start:worker           # Worker de colas
npm run seed                   # Poblar base de datos

# Testing
npm test                       # Tests unitarios
npm run test:cov               # Con cobertura
npm run test:ai-player         # Bot de prueba

# Build & Producción
npm run build                  # Compilar TypeScript
npm start                      # Iniciar producción

# Lint & Format
npm run lint                   # ESLint
npm run format                 # Prettier

# Docker
docker compose up -d           # Producción
docker compose -f docker-compose.dev.yml up -d  # Desarrollo
```
