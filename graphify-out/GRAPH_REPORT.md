# Graph Report - api  (2026-05-08)

## Corpus Check
- 106 files · ~42,303 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 616 nodes · 1007 edges · 29 communities (17 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04f00da9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]

## God Nodes (most connected - your core abstractions)
1. `AdminService` - 48 edges
2. `AdminController` - 47 edges
3. `PrismaService` - 29 edges
4. `AIPlayer` - 28 edges
5. `AppController` - 21 edges
6. `AIPlayer` - 21 edges
7. `ColoniesService` - 18 edges
8. `UsersService` - 16 edges
9. `AuthService` - 14 edges
10. `ResourcesService` - 14 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `seedResources()`  [EXTRACTED]
  prisma/seed.ts → prisma/seeders/resources.seeder.ts
- `main()` --calls--> `seedAnts()`  [EXTRACTED]
  prisma/seed.ts → prisma/seeders/ants.seeder.ts
- `main()` --calls--> `seedStructures()`  [EXTRACTED]
  prisma/seed.ts → prisma/seeders/structures.seeder.ts
- `main()` --calls--> `seedInvestigations()`  [EXTRACTED]
  prisma/seed.ts → prisma/seeders/investigation.seeder.ts
- `main()` --calls--> `seedRequirements()`  [EXTRACTED]
  prisma/seed.ts → prisma/seeders/requirements.seeder.ts

## Communities (29 total, 12 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (40): data, mockHelpService, mockPrisma, mockQueue, anthill, foodResource, leafResource, mockPrismaService (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (24): AdminModule, ArmyModule, AuthModule, jwtConstants, JwtStrategy, ColoniesModule, ConstructionModule, ConstructionConsumer (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (11): mockAdminService, res, AiManagerController, AiManagerGateway, AiManagerModule, AiManagerService, ArmyController, ArmyService (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (17): ExpeditionService, LocalAuthGuard, InvestigationService, mockAppService, mockArmyService, mockAuthGuard, mockAuthService, mockColoniesService (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (11): createdUser, existingUser, mockColoniesService, mockJwtService, mockMailerService, mockUsersService, user, userDto (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (8): ColoniesService, QueenDataConsumer, eightDaysAgo, job, mockAnthillGateway, mockColoniesService, mockPrisma, mockQueue

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (5): ActionRecord, AIPlayer, COLORS, Goal, main()

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (11): ANTS, INVESTIGATIONS, requirements, STRUCTURES, main(), prisma, seedAnts(), seedInvestigations() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.1
Nodes (20): Cobertura por Módulo, code:bash (# Todas las pruebas unitarias), code:typescript (const mockPrisma = {), code:typescript (const mockQueue = { add: jest.fn(), getJobs: jest.fn() };), code:typescript (mockPrisma.$transaction.mockImplementation(async (cb) => {), code:typescript (// Acceso via bracket notation), ✅ Configuración y Utilidades, ✅ Consumers (Unitarios) (+12 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (15): 1. Versión Web (Recomendado), 2. Versión Terminal, 🔍 Análisis de Errores, 🚀 Cómo empezar, 🛠️ Cómo implementar nuevas funciones, code:bash (# Ejecutar con valores por defecto), code:typescript (async buildStructure() {), code:typescript (// Dentro del bucle for en run()) (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (12): 1. El Centro de Mando: `anthill.config.ts`, 2. Cómo añadir una nueva Limitación, 3. Mejores Prácticas, code:prisma (leadersMax Int @default(1) @map("leaders_max")), code:typescript (LIMITS: {), code:typescript (let leadersMax = 0;), code:typescript (if (currentLeaders + 1 > anthill.leadersMax) {), Manual de Gestión: Limitaciones del Hormiguero (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.23
Nodes (9): ActionRecord, Goal, KnowledgeItem, Personality, RealPersonality, AI State Machine, getDetailedErrorExplanation(), getSuggestion() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.27
Nodes (3): RankingController, RankingModule, RankingService

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (6): AntConsumptionProcessor, anthills, food, mockJob, mockPrisma, mockUpdate

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (5): Database Migration Enforcement, Gemini CLI Project Configuration, God Nodes, Graphify, Usage

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (5): Como empezar, 📚 Documentación, 🐜 Nidoria, 📅 Próximas funciones, 🚀 Tecnologías usadas

### Community 25 - "Community 25"
Cohesion: 0.4
Nodes (4): Flujo de Sincronización, Motor de Juego (Game Engine) - Nidoria API, Responsabilidades, Tipos Principales

## Knowledge Gaps
- **119 isolated node(s):** `prisma`, `prisma`, `{ PrismaClient }`, `prisma`, `mockAppService` (+114 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminController` connect `Community 3` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `AdminService` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `AIPlayer` connect `Community 7` to `Community 16`, `Community 2`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `prisma`, `prisma`, `{ PrismaClient }` to the rest of the system?**
  _119 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._