# 🧪 Guía de Pruebas — Nidoria

Este documento describe la estrategia de testing del proyecto.

## Visión General

El proyecto utiliza [Jest](https://jestjs.io/) como framework de pruebas. Las pruebas están organizadas en:

| Tipo | Ubicación | Comando |
|------|-----------|---------|
| **Unitarias** | `src/**/*.spec.ts` | `npm test` |
| **E2E** | `test/*.e2e-spec.ts` | `npm run test:e2e` |
| **AI Player** | `test/ai-player.ts` | `npm run test:ai-player` |
| **Cobertura** | — | `npm run test:cov` |

---

## Ejecutar Pruebas

```bash
# Todas las pruebas unitarias
npm test

# Con cobertura
npm run test:cov

# Solo un archivo
npx jest src/construction/construction.service.spec.ts

# E2E (requiere DB de test activa)
npm run test:e2e

# AI Player (test funcional/stress)
npm run test:ai-player
```

---

## Cobertura por Módulo

### ✅ Servicios Core (Unitarios)

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `auth.service.spec.ts` | 5 tests | register, validateUser, login, verifyAccount |
| `colonies.service.spec.ts` | 3 tests | createColonyForUser, addEggToColony (éxito + fallo) |
| `resources.service.spec.ts` | 2 tests | getAllResources, error handling |
| `construction.service.spec.ts` | 10 tests | getUserConstructions, calculateCosts, checkRequirements, checkResources, finishConstruction, maxLevel |
| `expedition.service.spec.ts` | 8 tests | addExpedition (validación, creación, actualización), finishExpedition, initExpedition (Math.floor) |
| `admin.service.spec.ts` | 5 tests | getUsers, getSummary, getConstructions, createAnt, getDeployments |

### ✅ Consumers (Unitarios)

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `queen-data.consumer.spec.ts` | 8 tests | Ciclo completo (egg→larva→ant), pausa de colonia (4 escenarios), WebSocket notification |
| `ant-consumption.processor.spec.ts` | 5 tests | Consumo multi-anthill, suficiente/insuficiente, militar 2x, sin recurso |

### ✅ Configuración y Utilidades

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `anthill.config.spec.ts` | 9 tests | Validación de balance: límites, recursos iniciales, mundo, biología |
| `suggestion-engine.spec.ts` | 12 tests | Todos los códigos de error, sugerencias contextuales |

### ✅ Controller (Unitario)

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `app.controller.spec.ts` | 7 tests | login, register, refresh, verify, profile, resources, mission |

### ✅ E2E

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `app.e2e-spec.ts` | 6 tests | Hello World, protección de endpoints (register, login, resources, mission, construction) |
| `auth.e2e-spec.ts` | 3 tests | Registro exitoso, registro duplicado, login inválido |

---

## Patrones de Testing

### Mocking de PrismaService

```typescript
const mockPrisma = {
  anthill: { findFirst: jest.fn(), update: jest.fn() },
  resource: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};

// En el módulo:
{ provide: PrismaService, useValue: mockPrisma }
```

### Mocking de Bull Queues

```typescript
const mockQueue = { add: jest.fn(), getJobs: jest.fn() };

// En el módulo:
{ provide: getQueueToken('nombre_cola'), useValue: mockQueue }
```

### Testing de transacciones atómicas

```typescript
mockPrisma.$transaction.mockImplementation(async (cb) => {
  return cb({
    resourceAnthill: {
      findFirst: jest.fn().mockResolvedValue({ stock: 500 }),
      update: jest.fn(),
    },
  });
});
```

### Testing de métodos privados

```typescript
// Acceso via bracket notation
const costs = (service as any).calculateCosts(construction, level);
```

---

## Requisitos para E2E

1. Base de datos de test en Docker: `docker compose up test-database`
2. Variable de entorno: `DATABASETEST_URL=postgres://test-username:test-password@localhost:5433/test-databasename`
3. Migrar: `npm run test:prepare`
4. Ejecutar: `npm run test:e2e`