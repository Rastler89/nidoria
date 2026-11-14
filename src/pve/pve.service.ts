import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  BattleResult,
  Monster,
  Prisma,
  ResourceType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AnthillGateway } from '../gateway/anthill.gateway';
import { ReportsService } from '../reports/reports.service';
import {
  BattleOutcome,
  CombatUnit,
  resolveBattle,
  unitHpFromDefense,
} from '../combat/battle.engine';
import {
  capResourceStock,
  resolveResourceCapacity,
} from '../resources/resource-capacity';
import { ANTHILL_CONFIG } from '../config/anthill.config';
import { PVE_CONFIG } from './pve.constants';

/** Unidad enviada al combate, con los datos que necesitamos al resolver. */
interface PveUnitSnapshot extends CombatUnit {
  antId: number;
  /** Puntos de ranking que aporta la unidad (para descontarlos al morir). */
  points: number;
}

export interface AttackUnitInput {
  antId: number;
  quantity: number;
}

@Injectable()
export class PveService {
  private readonly logger = new Logger(PveService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('pve') private readonly pveQueue: Queue,
    private readonly anthillGateway: AnthillGateway,
    private readonly reports: ReportsService,
  ) {}

  // ---------------------------------------------------------------- lectura

  /** Apariciones activas del mundo del jugador + su ejército disponible. */
  async getSpawns(userId: number) {
    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: userId },
      include: { antsTotal: { include: { ant: true } } },
    });

    if (!anthill) {
      throw new NotFoundException('Hormiguero no encontrado');
    }

    const spawns = await this.prisma.monsterSpawn.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
        ...(anthill.worldId != null ? { worldId: anthill.worldId } : {}),
      },
      include: { monster: true },
      orderBy: { expiresAt: 'asc' },
    });

    return {
      army: anthill.antsTotal.map((row) => ({
        antId: row.antId,
        code: row.ant.code,
        name: row.ant.name,
        type: row.ant.type,
        total: row.total,
        busy: row.busy,
        available: Math.max(0, row.total - row.busy),
        attack: row.ant.attack,
        defense: row.ant.defense,
        speed: row.ant.speed_attack,
        hp: unitHpFromDefense(row.ant.defense),
      })),
      spawns: spawns.map((spawn) => {
        const scaled = this.scaleMonster(spawn.monster, spawn.level);
        const distance = this.distance(
          anthill.positionX,
          anthill.positionY,
          spawn.positionX,
          spawn.positionY,
        );

        return {
          id: spawn.id,
          monster: {
            code: spawn.monster.code,
            name: spawn.monster.name,
            description: spawn.monster.description,
            tier: spawn.monster.tier,
          },
          level: spawn.level,
          hpRemaining: spawn.hpRemaining,
          hpMax: scaled.hp,
          attack: scaled.attack,
          defense: scaled.defense,
          speed: spawn.monster.speed,
          loot: spawn.monster.loot,
          position: { x: spawn.positionX, y: spawn.positionY },
          distance,
          travelSeconds: this.travelSeconds(distance),
          spawnedAt: spawn.spawnedAt,
          expiresAt: spawn.expiresAt,
        };
      }),
    };
  }

  /** Batallas del jugador (pendientes y resueltas) para la pantalla de caza. */
  async getBattles(userId: number) {
    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!anthill) {
      throw new NotFoundException('Hormiguero no encontrado');
    }

    const battles = await this.prisma.battle.findMany({
      where: { attackerId: anthill.id, type: 'PVE' },
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: { spawn: { include: { monster: true } } },
    });

    return battles.map((battle) => ({
      id: battle.id,
      result: battle.result,
      pending: battle.resolvedAt == null,
      travelSeconds: battle.travelSeconds,
      startedAt: battle.startedAt,
      resolvedAt: battle.resolvedAt,
      arrivesAt: new Date(battle.startedAt.getTime() + battle.travelSeconds * 1000),
      monster: battle.spawn
        ? {
            code: battle.spawn.monster.code,
            name: battle.spawn.monster.name,
            level: battle.spawn.level,
          }
        : null,
      loot: battle.loot,
    }));
  }

  // ---------------------------------------------------------------- ataque

  async attackSpawn(userId: number, spawnId: number, units: AttackUnitInput[]) {
    const normalized = this.normalizeUnits(units);

    const anthill = await this.prisma.anthill.findFirst({
      where: { ownerId: userId },
      include: { antsTotal: { include: { ant: true } } },
    });

    if (!anthill) {
      throw new NotFoundException('Hormiguero no encontrado');
    }

    const spawn = await this.prisma.monsterSpawn.findUnique({
      where: { id: spawnId },
      include: { monster: true },
    });

    if (!spawn || spawn.status !== 'ACTIVE' || spawn.hpRemaining <= 0) {
      throw new NotFoundException('La presa ya no está disponible.');
    }

    if (spawn.expiresAt <= new Date()) {
      throw new BadRequestException('La presa ha escapado.');
    }

    if (spawn.worldId != null && anthill.worldId != null && spawn.worldId !== anthill.worldId) {
      throw new BadRequestException('La presa está en otro mundo.');
    }

    const snapshots: PveUnitSnapshot[] = [];

    for (const request of normalized) {
      const row = anthill.antsTotal.find((item) => item.antId === request.antId);

      if (!row) {
        throw new BadRequestException('No tienes esa unidad en el ejército.');
      }

      const available = Math.max(0, row.total - row.busy);

      if (request.quantity > available) {
        throw new BadRequestException(
          `No hay suficientes ${row.ant.name} disponibles (${available}).`,
        );
      }

      snapshots.push({
        antId: row.antId,
        key: row.ant.code,
        name: row.ant.name,
        attack: row.ant.attack,
        defense: row.ant.defense,
        speed: row.ant.speed_attack,
        hp: unitHpFromDefense(row.ant.defense),
        quantity: request.quantity,
        points: row.ant.points,
      });
    }

    const distance = this.distance(
      anthill.positionX,
      anthill.positionY,
      spawn.positionX,
      spawn.positionY,
    );
    const travelSeconds = this.travelSeconds(distance);

    const scaled = this.scaleMonster(spawn.monster, spawn.level);
    const defenderUnits: CombatUnit[] = [
      {
        key: spawn.monster.code,
        name: spawn.monster.name,
        attack: scaled.attack,
        defense: scaled.defense,
        speed: spawn.monster.speed,
        hp: Math.max(1, spawn.hpRemaining),
        quantity: 1,
      },
    ];

    // Reservar unidades y crear la batalla en una sola transacción: si algo
    // falla no quedan hormigas marcadas como ocupadas para siempre.
    const battle = await this.prisma.$transaction(async (tx) => {
      for (const snapshot of snapshots) {
        const row = await tx.antsAnthill.findUnique({
          where: {
            antId_anthillId: {
              antId: snapshot.antId,
              anthillId: anthill.id,
            },
          },
        });

        if (!row || row.total - row.busy < snapshot.quantity) {
          throw new BadRequestException(
            `Las ${snapshot.name} ya no están disponibles.`,
          );
        }

        await tx.antsAnthill.update({
          where: {
            antId_anthillId: {
              antId: snapshot.antId,
              anthillId: anthill.id,
            },
          },
          data: { busy: { increment: snapshot.quantity } },
        });
      }

      return tx.battle.create({
        data: {
          type: 'PVE',
          attackerId: anthill.id,
          spawnId: spawn.id,
          seed: randomUUID(),
          attackerUnits: snapshots as unknown as Prisma.InputJsonValue,
          defenderUnits: defenderUnits as unknown as Prisma.InputJsonValue,
          travelSeconds,
        },
      });
    });

    await this.pveQueue.add(
      'pve_attack',
      { battleId: battle.id },
      {
        delay: travelSeconds * 1000,
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: { type: 'fixed', delay: 5000 },
      },
    );

    return {
      battleId: battle.id,
      travelSeconds,
      arrivesAt: new Date(Date.now() + travelSeconds * 1000),
      monster: {
        code: spawn.monster.code,
        name: spawn.monster.name,
        level: spawn.level,
      },
      units: snapshots.map((unit) => ({
        code: unit.key,
        name: unit.name,
        quantity: unit.quantity,
      })),
    };
  }

  // -------------------------------------------------------------- resolución

  /**
   * Resuelve una batalla PvE. La llama el consumidor de la cola `pve` cuando
   * termina el viaje. Es idempotente: si ya está resuelta no hace nada.
   */
  async resolveBattle(battleId: number): Promise<void> {
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        attacker: true,
        spawn: { include: { monster: true } },
      },
    });

    if (!battle || battle.resolvedAt || battle.type !== 'PVE' || !battle.spawn) {
      return;
    }

    const attackerUnits = (battle.attackerUnits as unknown as PveUnitSnapshot[]) ?? [];

    if (attackerUnits.length === 0) {
      this.logger.warn(`Batalla ${battleId} sin unidades: se ignora.`);
      return;
    }

    const spawn = battle.spawn;
    const monster = spawn.monster;
    const now = new Date();

    const escaped =
      spawn.status !== 'ACTIVE' || spawn.expiresAt <= now || spawn.hpRemaining <= 0;

    if (escaped) {
      await this.prisma.$transaction(async (tx) => {
        await this.releaseReservedUnits(tx, battle.attackerId, attackerUnits);
        await tx.battle.update({
          where: { id: battle.id },
          data: { result: 'DRAW', rounds: [], resolvedAt: now },
        });
      });

      const report = await this.reports.create({
        ownerId: battle.attacker.ownerId,
        type: 'BATTLE',
        battleId: battle.id,
        title: 'La presa escapó',
        body: {
          battleId: battle.id,
          battleType: 'PVE',
          result: 'DRAW',
          reason: 'gone',
          monster: { code: monster.code, name: monster.name, level: spawn.level },
          loot: {},
          rounds: [],
          lossesAttacker: {},
          lossesDefender: {},
          travelSeconds: battle.travelSeconds,
        } as unknown as Prisma.InputJsonValue,
      });

      await this.notify(battle.attacker.ownerId, report.id);
      return;
    }

    const scaled = this.scaleMonster(monster, spawn.level);
    const defenderUnits: CombatUnit[] = [
      {
        key: monster.code,
        name: monster.name,
        attack: scaled.attack,
        defense: scaled.defense,
        speed: monster.speed,
        hp: Math.max(1, spawn.hpRemaining),
        quantity: 1,
      },
    ];

    const outcome = resolveBattle(
      { units: attackerUnits },
      { units: defenderUnits },
      battle.seed,
    );

    const loot = this.computeLoot(monster.loot, spawn.level, attackerUnits, outcome);

    const applied = await this.prisma.$transaction(async (tx) => {
      await this.releaseReservedUnits(
        tx,
        battle.attackerId,
        attackerUnits,
        outcome.lossesAttacker,
      );

      await this.applyPowerLoss(tx, battle.attackerId, attackerUnits, outcome);

      const appliedLoot = await this.applyLoot(tx, battle.attacker, loot);

      const hpRemaining = Math.max(
        0,
        Math.floor(outcome.hpRemainingDefender[monster.code] ?? 0),
      );

      await tx.monsterSpawn.update({
        where: { id: spawn.id },
        data: {
          hpRemaining,
          status: hpRemaining <= 0 ? 'DEFEATED' : 'ACTIVE',
        },
      });

      await tx.battle.update({
        where: { id: battle.id },
        data: {
          result: outcome.result,
          rounds: outcome.rounds as unknown as Prisma.InputJsonValue,
          defenderUnits: defenderUnits as unknown as Prisma.InputJsonValue,
          loot: appliedLoot as unknown as Prisma.InputJsonValue,
          lossesAttacker: outcome.lossesAttacker as unknown as Prisma.InputJsonValue,
          lossesDefender: outcome.lossesDefender as unknown as Prisma.InputJsonValue,
          resolvedAt: now,
        },
      });

      return { appliedLoot, hpRemaining };
    });

    const report = await this.reports.create({
      ownerId: battle.attacker.ownerId,
      type: 'BATTLE',
      battleId: battle.id,
      title: this.reportTitle(monster.name, outcome.result),
      body: {
        battleId: battle.id,
        battleType: 'PVE',
        result: outcome.result,
        monster: {
          code: monster.code,
          name: monster.name,
          level: spawn.level,
          hpRemaining: applied.hpRemaining,
        },
        travelSeconds: battle.travelSeconds,
        loot: applied.appliedLoot,
        lossesAttacker: outcome.lossesAttacker,
        lossesDefender: outcome.lossesDefender,
        survivorsAttacker: outcome.survivorsAttacker,
        rounds: outcome.rounds,
        units: { attacker: attackerUnits, defender: defenderUnits },
      } as unknown as Prisma.InputJsonValue,
    });

    await this.notify(battle.attacker.ownerId, report.id);
  }

  // ----------------------------------------------------------- apariciones

  /**
   * Caduca las apariciones viejas y rellena cada mundo hasta el máximo.
   * La llama el cron (API) y el arranque, nunca el cliente.
   */
  async ensureSpawns(): Promise<{ created: number; expired: number }> {
    const now = new Date();

    const expired = await this.prisma.monsterSpawn.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      data: { status: 'EXPIRED' },
    });

    const monsters = await this.prisma.monster.findMany({ where: { active: true } });

    if (monsters.length === 0) {
      this.logger.warn('No hay monstruos activos: revisa `npm run seed monsters`.');
      return { created: 0, expired: expired.count };
    }

    const worlds = await this.prisma.world.findMany({ select: { id: true } });
    const targets: Array<number | null> = worlds.length > 0 ? worlds.map((w) => w.id) : [null];

    let created = 0;

    for (const worldId of targets) {
      const active = await this.prisma.monsterSpawn.count({
        where: {
          status: 'ACTIVE',
          expiresAt: { gt: now },
          worldId,
        },
      });

      const missing = PVE_CONFIG.SPAWNS.MAX_ACTIVE_PER_WORLD - active;

      if (missing <= 0) continue;

      const averagePower = await this.averagePower(worldId);
      const level = this.spawnLevel(averagePower);
      const maxTier = this.spawnTier(averagePower);
      const eligible = monsters.filter((monster) => monster.tier <= maxTier);
      const pool = eligible.length > 0 ? eligible : monsters;

      for (let i = 0; i < missing; i++) {
        const monster = pool[Math.floor(Math.random() * pool.length)];
        const scaled = this.scaleMonster(monster, level);

        await this.prisma.monsterSpawn.create({
          data: {
            monsterId: monster.id,
            worldId,
            level,
            hpRemaining: scaled.hp,
            positionX: Math.floor(Math.random() * ANTHILL_CONFIG.WORLD.MAP_SIZE),
            positionY: Math.floor(Math.random() * ANTHILL_CONFIG.WORLD.MAP_SIZE),
            expiresAt: new Date(
              now.getTime() + PVE_CONFIG.SPAWNS.TTL_MINUTES * 60 * 1000,
            ),
          },
        });

        created++;
      }
    }

    if (created > 0) {
      this.logger.log(`Apariciones de PvE: ${created} nuevas, ${expired.count} caducadas.`);
    }

    return { created, expired: expired.count };
  }

  // --------------------------------------------------------------- helpers

  private normalizeUnits(units: AttackUnitInput[]): AttackUnitInput[] {
    if (!Array.isArray(units) || units.length === 0) {
      throw new BadRequestException('Envía al menos una unidad.');
    }

    const merged = new Map<number, number>();

    for (const unit of units) {
      const antId = Number(unit?.antId);
      const quantity = Number(unit?.quantity);

      if (!Number.isInteger(antId) || antId <= 0) {
        throw new BadRequestException('Unidad inválida.');
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > PVE_CONFIG.ATTACK.MAX_QUANTITY_PER_UNIT
      ) {
        throw new BadRequestException(
          `Cantidad inválida (máximo ${PVE_CONFIG.ATTACK.MAX_QUANTITY_PER_UNIT} por unidad).`,
        );
      }

      merged.set(antId, (merged.get(antId) ?? 0) + quantity);
    }

    if (merged.size > PVE_CONFIG.ATTACK.MAX_UNIT_TYPES) {
      throw new BadRequestException(
        `Como máximo ${PVE_CONFIG.ATTACK.MAX_UNIT_TYPES} tipos de unidad por ataque.`,
      );
    }

    return Array.from(merged, ([antId, quantity]) => ({ antId, quantity }));
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.round(Math.hypot(x2 - x1, y2 - y1));
  }

  private travelSeconds(distance: number): number {
    const raw = Math.round(distance * PVE_CONFIG.TRAVEL.SECONDS_PER_TILE);

    return Math.min(
      PVE_CONFIG.TRAVEL.MAX_SECONDS,
      Math.max(PVE_CONFIG.TRAVEL.MIN_SECONDS, raw),
    );
  }

  private scaleMonster(monster: Monster, level: number) {
    const steps = Math.max(0, level - 1);
    const scaling = PVE_CONFIG.LEVEL_SCALING;

    return {
      hp: Math.round(monster.hp * Math.pow(scaling.HP_FACTOR, steps)),
      attack: Math.round(monster.attack * Math.pow(scaling.ATTACK_FACTOR, steps)),
      defense: Math.round(monster.defense * Math.pow(scaling.DEFENSE_FACTOR, steps)),
    };
  }

  private spawnLevel(averagePower: number): number {
    return Math.min(
      PVE_CONFIG.SPAWNS.MAX_LEVEL,
      Math.max(1, 1 + Math.floor(averagePower / PVE_CONFIG.SPAWNS.POWER_PER_LEVEL)),
    );
  }

  private spawnTier(averagePower: number): number {
    return Math.min(
      PVE_CONFIG.SPAWNS.MAX_TIER,
      Math.max(1, 1 + Math.floor(averagePower / PVE_CONFIG.SPAWNS.TIER_POWER_STEP)),
    );
  }

  private async averagePower(worldId: number | null): Promise<number> {
    const aggregate = await this.prisma.anthill.aggregate({
      where: worldId != null ? { worldId } : {},
      _avg: { powerTotal: true },
    });

    return aggregate._avg.powerTotal ?? 0;
  }

  private computeLoot(
    monsterLoot: Prisma.JsonValue,
    level: number,
    units: PveUnitSnapshot[],
    outcome: BattleOutcome,
  ): Record<string, number> {
    if (outcome.result !== 'WIN') {
      return {};
    }

    const base = (monsterLoot ?? {}) as Record<string, unknown>;
    const sent = units.reduce((total, unit) => total + unit.quantity, 0);
    const survivors = Object.values(outcome.survivorsAttacker).reduce(
      (total, value) => total + value,
      0,
    );
    const survivorRatio = sent > 0 ? Math.min(1, survivors / sent) : 0;
    const ratio =
      PVE_CONFIG.LOOT.MIN_RATIO + (1 - PVE_CONFIG.LOOT.MIN_RATIO) * survivorRatio;

    const loot: Record<string, number> = {};

    for (const [type, value] of Object.entries(base)) {
      const amount = Math.floor(Number(value) * level * ratio);
      if (Number.isFinite(amount) && amount > 0) {
        loot[type] = amount;
      }
    }

    return loot;
  }

  /** Libera las unidades reservadas y descuenta las que murieron. */
  private async releaseReservedUnits(
    tx: Prisma.TransactionClient,
    anthillId: number,
    units: PveUnitSnapshot[],
    losses: Record<string, number> = {},
  ): Promise<void> {
    for (const unit of units) {
      const key = {
        antId_anthillId: { antId: unit.antId, anthillId },
      };
      const row = await tx.antsAnthill.findUnique({ where: key });

      if (!row) continue;

      const dead = Math.max(0, losses[unit.key] ?? 0);

      await tx.antsAnthill.update({
        where: key,
        data: {
          busy: Math.max(0, row.busy - unit.quantity),
          total: Math.max(0, row.total - dead),
        },
      });
    }
  }

  private async applyPowerLoss(
    tx: Prisma.TransactionClient,
    anthillId: number,
    units: PveUnitSnapshot[],
    outcome: BattleOutcome,
  ): Promise<void> {
    const lost = units.reduce(
      (total, unit) => total + (outcome.lossesAttacker[unit.key] ?? 0) * unit.points,
      0,
    );

    if (lost <= 0) return;

    const anthill = await tx.anthill.findUnique({
      where: { id: anthillId },
      select: { powerMilitary: true, powerTotal: true },
    });

    if (!anthill) return;

    await tx.anthill.update({
      where: { id: anthillId },
      data: {
        powerMilitary: Math.max(0, anthill.powerMilitary - lost),
        powerTotal: Math.max(0, anthill.powerTotal - lost),
      },
    });
  }

  /** Suma el botín sin superar nunca la capacidad del almacén. */
  private async applyLoot(
    tx: Prisma.TransactionClient,
    anthill: { id: number; capacities: Prisma.JsonValue },
    loot: Record<string, number>,
  ): Promise<Record<string, number>> {
    const capacities = (anthill.capacities ?? {}) as Record<string, unknown>;
    const applied: Record<string, number> = {};

    for (const [type, amount] of Object.entries(loot)) {
      if (!Number.isFinite(amount) || amount <= 0) continue;

      const resource = await tx.resource.findFirst({
        where: { type: type as ResourceType },
      });

      if (!resource) continue;

      const key = {
        anthillId_resourceId: { anthillId: anthill.id, resourceId: resource.id },
      };
      const existing = await tx.resourceAnthill.findUnique({ where: key });
      const capacity = resolveResourceCapacity(capacities, type);
      const current = existing?.stock ?? 0;
      const next = capResourceStock(current + amount, capacity);
      const gained = Math.max(0, next - current);

      if (existing) {
        await tx.resourceAnthill.update({ where: key, data: { stock: next } });
      } else {
        await tx.resourceAnthill.create({
          data: { anthillId: anthill.id, resourceId: resource.id, stock: next },
        });
      }

      applied[type] = gained;
    }

    return applied;
  }

  private reportTitle(monsterName: string, result: BattleResult): string {
    switch (result) {
      case 'WIN':
        return `Victoria contra ${monsterName}`;
      case 'LOSS':
        return `Derrota contra ${monsterName}`;
      default:
        return `Empate contra ${monsterName}`;
    }
  }

  private async notify(ownerId: number, reportId: number): Promise<void> {
    try {
      await this.anthillGateway.sendUpdate(String(ownerId));
      await this.anthillGateway.notifyReport(String(ownerId), reportId);
    } catch (error) {
      // El reporte ya está guardado: un fallo de socket no debe tumbar el job.
      this.logger.warn(`No se pudo notificar al usuario ${ownerId}: ${error}`);
    }
  }
}
