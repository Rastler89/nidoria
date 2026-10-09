# 🎮 Nidoria - Beta Verification Checklist

## Fase 1: Infraestructura
- [ ] 1.1 Docker levantado (PostgreSQL + Redis + API)
- [ ] 1.2 Migraciones de Prisma ejecutadas
- [ ] 1.3 Seed ejecutado (recursos, hormigas, construcciones, investigación, requisitos)
- [ ] 1.4 Worker de Bull separado activo (`npm run start:worker`)
- [ ] 1.5 Health check (`GET /`) responde 200

## Fase 2: Autenticación
- [ ] 2.1 Pre-registro (`POST /pre-register`)
- [ ] 2.2 Registro nuevo usuario (`POST /auth/register`)
- [ ] 2.3 Verificación de email (`GET /verifyAccount/:id/:token`)
- [ ] 2.4 Login (`POST /auth/login`) → devuelve access_token + refresh_token
- [ ] 2.5 Refresh token (`POST /auth/refresh`)
- [ ] 2.6 Logout (`POST /auth/logout`)
- [ ] 2.7 Registro duplicado rechazado
- [ ] 2.8 Token expirado rechaza acceso

## Fase 3: Colonia y Ciclo de la Reina
- [ ] 3.1 Al verificar email se crea colonia con recursos iniciales (1000 FOOD, 500 WOOD, 200 LEAD)
- [ ] 3.2 Queen Chamber se crea automáticamente
- [ ] 3.3 Ciclo de cria: huevo → larva → hormiga funciona con delays correctos
- [ ] 3.4 Se descuentan 40 FOOD por huevo
- [ ] 3.5 Colony se pausa si no hay comida (7 días inactividad)

## Fase 4: Recursos
- [ ] 4.1 `GET /resources` retorna recursos de la colonia
- [ ] 4.2 Consumo de comida cada 10 min (1 civil, 2 militar)
- [ ] 4.3 Límites de almacenamiento se actualizan al construir

## Fase 5: Construcciones
- [ ] 5.1 `GET /constructions` lista opciones (NUEVO/MEJORAR)
- [ ] 5.2 Costos exponenciales calculados correctamente
- [ ] 5.3 `POST /constructions` inicia construcción (descuenta recursos)
- [ ] 5.4 Requisitos previos validados
- [ ] 5.5 Construcción se completa tras el delay (Bull job)
- [ ] 5.6 Puntos de ranking se suman al completar
- [ ] 5.7 Límites de colonia se recalculan (pop, almacenamiento)

## Fase 6: Investigación
- [ ] 6.1 `GET /investigations` lista opciones disponibles
- [ ] 6.2 `POST /investigations` inicia investigación
- [ ] 6.3 Investigación se completa tras delay
- [ ] 6.4 Puntos de ranking se suman
- [ ] 6.5 Desbloquea construcciones/unidades según árbol tech

## Fase 7: Ejército
- [ ] 7.1 `GET /units` lista unidades disponibles
- [ ] 7.2 `POST /units` recluta unidades
- [ ] 7.3 Capacidad militar respetada
- [ ] 7.4 Requisitos previos validados
- [ ] 7.5 Puntos militares se suman al reclutar

## Fase 8: Expediciones
- [ ] 8.1 `POST /mission` inicia expedición
- [ ] 8.2 Recursos se recolectan tras delay (3-7 min)
- [ ] 8.3 Capacidad de almacenamiento respetada
- [ ] 8.4 Expedición se reinicia automáticamente
- [ ] 8.5 WebSocket notifica al jugador al completar

## Fase 9: WebSockets
- [ ] 9.1 Conexión con JWT válido
- [ ] 9.2 Se une a room privado `anthill_{userId}`
- [ ] 9.3 Evento `anthill_update` envía delta de estado
- [ ] 9.4 Reconexión reanuda ciclo de reina
- [ ] 9.5 Token expirado envía `auth_error`

## Fase 10: Rankings
- [ ] 10.1 `GET /ranking` retorna Top 10 + posición del usuario
- [ ] 10.2 4 categorías funcionan (general, construcción, investigación, militar)

## Fase 11: Panel Admin
- [ ] 11.1 Login como admin (`admin@nidoria.com` / `Admin1234!`)
- [ ] 11.2 `GET /antmaster/api/summary` retorna dashboard
- [ ] 11.3 CRUD usuarios (listar, cambiar rol, eliminar)
- [ ] 11.4 CRUD anthills (listar, editar, ver detalles)
- [ ] 11.5 CRUD construcciones/investigaciones/hormigas/recursos
- [ ] 11.6 `GET /antmaster/api/analysis/health` retorna métricas
- [ ] 11.7 Bull Board accesible en `/queues`

## Fase 12: Seguridad
- [ ] 12.1 Rate limiting activo (100 req/60s)
- [ ] 12.2 Rutas protegidas rechazan sin token
- [ ] 12.3 Admin endpoints rechazan usuario normal
- [ ] 12.4 Validación de DTOs (campos requeridos, tipos)
- [ ] 12.5 CORS configurado correctamente

## Fase 13: IA (Opcional para beta)
- [ ] 13.1 `POST /ai/start` crea jugador IA
- [ ] 13.2 IA ejecuta acciones autónomas
- [ ] 13.3 `POST /ai/stop/:username` detiene IA

## Fase 14: Email
- [ ] 14.1 Email de verificación se envía al registrar
- [ ] 14.2 Template HTML renderiza correctamente

## Fase 15: Tests
- [ ] 15.1 Unit tests pasan (`npm run test`)
- [ ] 15.2 E2E tests pasan (`npm run test:e2e`)

---

## ⚠️ Pendiente de implementar
- [ ] Combate/ataques (cola `ataques` sin procesador)
- [ ] Hormigas especiales (enum `SPECIAL` sin unidades)
- [ ] Efectos de investigación (campos `effects` vacíos en seed)
- [ ] Daño/reparación de construcciones (estados sin lógica)

---

## 📝 Notas
> Fecha inicio: __ / __ / ____
> Fecha prevista release: __ / __ / ____
> Responsable: ________________

### Bugs encontrados
| # | Fase | Descripción | Severidad | Estado |
|---|------|-------------|-----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
