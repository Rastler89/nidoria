# Graph Report - c:\Users\Rastl\Desktop\nidoria\api  (2026-05-08)

## Corpus Check
- Corpus is ~42,043 words - fits in a single context window. You may not need a graph.

## Summary
- 547 nodes · 942 edges · 20 communities (11 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Deep Analysis Community 0|Deep Analysis Community 0]]
- [[_COMMUNITY_Deep Analysis Community 1|Deep Analysis Community 1]]
- [[_COMMUNITY_Deep Analysis Community 2|Deep Analysis Community 2]]
- [[_COMMUNITY_Deep Analysis Community 3|Deep Analysis Community 3]]
- [[_COMMUNITY_Deep Analysis Community 4|Deep Analysis Community 4]]
- [[_COMMUNITY_Deep Analysis Community 5|Deep Analysis Community 5]]
- [[_COMMUNITY_Deep Analysis Community 6|Deep Analysis Community 6]]
- [[_COMMUNITY_Deep Analysis Community 7|Deep Analysis Community 7]]
- [[_COMMUNITY_Deep Analysis Community 8|Deep Analysis Community 8]]
- [[_COMMUNITY_Deep Analysis Community 9|Deep Analysis Community 9]]
- [[_COMMUNITY_Deep Analysis Community 10|Deep Analysis Community 10]]
- [[_COMMUNITY_Deep Analysis Community 11|Deep Analysis Community 11]]
- [[_COMMUNITY_Deep Analysis Community 12|Deep Analysis Community 12]]
- [[_COMMUNITY_Deep Analysis Community 13|Deep Analysis Community 13]]
- [[_COMMUNITY_Deep Analysis Community 14|Deep Analysis Community 14]]
- [[_COMMUNITY_Deep Analysis Community 15|Deep Analysis Community 15]]
- [[_COMMUNITY_Deep Analysis Community 16|Deep Analysis Community 16]]
- [[_COMMUNITY_Deep Analysis Community 17|Deep Analysis Community 17]]
- [[_COMMUNITY_Deep Analysis Community 18|Deep Analysis Community 18]]
- [[_COMMUNITY_Deep Analysis Community 19|Deep Analysis Community 19]]

## God Nodes (most connected - your core abstractions)
1. `AdminService` - 48 edges
2. `AdminController` - 47 edges
3. `AIPlayer` - 28 edges
4. `PrismaService` - 27 edges
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

## Communities (20 total, 9 thin omitted)

### Community 0 - "Deep Analysis Community 0"
Cohesion: 0.05
Nodes (37): data, mockHelpService, mockPrisma, mockQueue, anthill, foodResource, leafResource, mockPrismaService (+29 more)

### Community 1 - "Deep Analysis Community 1"
Cohesion: 0.07
Nodes (20): AdminModule, AntConsumptionModule, AntConsumptionService, ArmyModule, AuthModule, jwtConstants, JwtStrategy, ColoniesModule (+12 more)

### Community 4 - "Deep Analysis Community 4"
Cohesion: 0.07
Nodes (17): ArmyService, LocalAuthGuard, InvestigationService, mockAppService, mockArmyService, mockAuthGuard, mockAuthService, mockColoniesService (+9 more)

### Community 5 - "Deep Analysis Community 5"
Cohesion: 0.07
Nodes (13): AiManagerController, AiManagerGateway, AiManagerModule, AiManagerService, ActionRecord, Goal, KnowledgeItem, Personality (+5 more)

### Community 6 - "Deep Analysis Community 6"
Cohesion: 0.07
Nodes (11): createdUser, existingUser, mockColoniesService, mockJwtService, mockMailerService, mockUsersService, user, userDto (+3 more)

### Community 7 - "Deep Analysis Community 7"
Cohesion: 0.09
Nodes (9): ConstructionModule, ArmyProcessor, ConstructionConsumer, ConsumerModule, ExplorationConsumer, InvestigationConsumer, ExpeditionModule, ExpeditionService (+1 more)

### Community 9 - "Deep Analysis Community 9"
Cohesion: 0.08
Nodes (8): ColoniesService, QueenDataConsumer, eightDaysAgo, job, mockAnthillGateway, mockColoniesService, mockPrisma, mockQueue

### Community 10 - "Deep Analysis Community 10"
Cohesion: 0.11
Nodes (8): mockAdminService, res, ArmyController, JwtAuthGuard, Roles(), RolesGuard, RankingController, RankingService

### Community 11 - "Deep Analysis Community 11"
Cohesion: 0.18
Nodes (5): ActionRecord, AIPlayer, COLORS, Goal, main()

### Community 12 - "Deep Analysis Community 12"
Cohesion: 0.13
Nodes (10): GameEngineService, AnthillStats, ArmyState, BuildingState, ExplorationState, GameState, ItemEffects, ResourceState (+2 more)

### Community 13 - "Deep Analysis Community 13"
Cohesion: 0.16
Nodes (11): ANTS, INVESTIGATIONS, requirements, STRUCTURES, main(), prisma, seedAnts(), seedInvestigations() (+3 more)

## Knowledge Gaps
- **82 isolated node(s):** `prisma`, `prisma`, `{ PrismaClient }`, `prisma`, `mockAppService` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminController` connect `Deep Analysis Community 2` to `Deep Analysis Community 1`, `Deep Analysis Community 10`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `AdminService` connect `Deep Analysis Community 3` to `Deep Analysis Community 0`, `Deep Analysis Community 1`, `Deep Analysis Community 10`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `AIPlayer` connect `Deep Analysis Community 8` to `Deep Analysis Community 5`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `prisma`, `prisma`, `{ PrismaClient }` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Deep Analysis Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Deep Analysis Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Deep Analysis Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._