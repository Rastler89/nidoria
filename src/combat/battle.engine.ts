/**
 * Motor de combate de Nidoria.
 *
 * Es lógica pura: no toca Prisma, ni colas, ni sockets. Recibe dos bandos con
 * stats ya resueltos y devuelve el resultado ronda a ronda. Eso permite:
 *
 *  - usar el mismo motor para PvE (monstruo) y PvP (otro hormiguero);
 *  - testear el balance sin base de datos;
 *  - repetir un reporte a partir de la semilla guardada en `Battle.seed`.
 *
 * Cada unidad conserva su "pool" de vida entre rondas: el daño parcial no se
 * pierde, así un monstruo con mucha vida muere por acumulación y no de un
 * golpe. La cantidad viva se deriva del pool (`ceil(pool / hpPorUnidad)`).
 */

export const MAX_BATTLE_ROUNDS = 20;

/** El daño se reduce con `1000 / (1000 + defensa total)`. */
const DEFENSE_MITIGATION_SCALE = 1000;

/** La velocidad aporta daño: `1 + speed / 20` (speed 10 → +50 %). */
const SPEED_DAMAGE_DIVISOR = 20;

/**
 * Vida por unidad de una hormiga. No hay columna `hp` en el catálogo: se
 * deriva de la defensa para que ambas cosas no se desincronicen.
 */
export function unitHpFromDefense(defense: number): number {
  const value = Number(defense);
  if (!Number.isFinite(value) || value <= 0) return 10;
  return Math.max(10, Math.round(value * 10));
}

export type BattleSideResult = 'WIN' | 'LOSS' | 'DRAW';

export interface CombatUnit {
  /** Identificador estable dentro del bando (código de hormiga o de monstruo). */
  key: string;
  name: string;
  attack: number;
  defense: number;
  speed: number;
  /** Vida por unidad. */
  hp: number;
  quantity: number;
}

export interface CombatSide {
  units: CombatUnit[];
  /** Porcentaje sobre el daño. 100 = sin cambios. */
  attackBonus?: number;
  /** Porcentaje sobre la defensa. 100 = sin cambios. */
  defenseBonus?: number;
}

export interface BattleRound {
  round: number;
  /** Daño que el atacante hizo al defensor en esta ronda. */
  attackerDamage: number;
  /** Daño que el defensor hizo al atacante en esta ronda. */
  defenderDamage: number;
  attackerLosses: number;
  defenderLosses: number;
  attackerRemaining: number;
  defenderRemaining: number;
}

export interface BattleOutcome {
  result: BattleSideResult;
  rounds: BattleRound[];
  lossesAttacker: Record<string, number>;
  lossesDefender: Record<string, number>;
  survivorsAttacker: Record<string, number>;
  survivorsDefender: Record<string, number>;
  /** Vida restante por unidad (útil para actualizar la vida del monstruo). */
  hpRemainingDefender: Record<string, number>;
  totalDamageAttacker: number;
  totalDamageDefender: number;
}

interface UnitState {
  unit: CombatUnit;
  hpPool: number;
}

function toState(unit: CombatUnit): UnitState {
  const quantity = Math.max(0, Math.floor(Number(unit.quantity) || 0));
  const hp = Math.max(1, Math.floor(Number(unit.hp) || 1));

  return { unit: { ...unit, quantity, hp }, hpPool: quantity * hp };
}

function aliveCount(units: UnitState[]): number {
  return units.reduce((total, state) => {
    if (state.hpPool <= 0) return total;
    return total + Math.ceil(state.hpPool / state.unit.hp);
  }, 0);
}

function totalHp(units: UnitState[]): number {
  return units.reduce((total, state) => total + Math.max(0, state.hpPool), 0);
}

function sideDamage(units: UnitState[], bonus = 100): number {
  const factor = Math.max(0, bonus) / 100;
  return units.reduce((total, state) => {
    if (state.hpPool <= 0) return total;
    const alive = Math.ceil(state.hpPool / state.unit.hp);
    const speedFactor = 1 + Math.max(0, state.unit.speed) / SPEED_DAMAGE_DIVISOR;
    return total + alive * state.unit.attack * speedFactor * factor;
  }, 0);
}

function sideDefense(units: UnitState[], bonus = 100): number {
  const factor = Math.max(0, bonus) / 100;
  return units.reduce((total, state) => {
    if (state.hpPool <= 0) return total;
    const alive = Math.ceil(state.hpPool / state.unit.hp);
    return total + alive * state.unit.defense * factor;
  }, 0);
}

/**
 * Reparte el daño entre las unidades según su vida restante y devuelve cuántas
 * murieron en esta ronda. El daño sobrante se queda en el pool de las que
 * sobreviven.
 */
function applyDamage(
  units: UnitState[],
  damage: number,
  losses: Record<string, number>,
): number {
  const pool = totalHp(units);
  if (pool <= 0 || damage <= 0) return 0;

  let killed = 0;

  for (const state of units) {
    if (state.hpPool <= 0) continue;

    const share = damage * (state.hpPool / pool);
    const before = Math.ceil(state.hpPool / state.unit.hp);

    state.hpPool = Math.max(0, state.hpPool - share);

    const after = state.hpPool <= 0 ? 0 : Math.ceil(state.hpPool / state.unit.hp);
    const dead = Math.max(0, before - after);

    if (dead > 0) {
      losses[state.unit.key] = (losses[state.unit.key] ?? 0) + dead;
      killed += dead;
    }
  }

  return killed;
}

function survivors(units: UnitState[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const state of units) {
    const alive = state.hpPool <= 0 ? 0 : Math.ceil(state.hpPool / state.unit.hp);
    result[state.unit.key] = (result[state.unit.key] ?? 0) + alive;
  }
  return result;
}

function hpRemaining(units: UnitState[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const state of units) {
    const remaining = Math.max(0, Math.floor(state.hpPool));
    result[state.unit.key] = (result[state.unit.key] ?? 0) + remaining;
  }
  return result;
}

/** FNV-1a: semilla estable a partir del texto guardado en `Battle.seed`. */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** PRNG determinista: misma semilla → misma secuencia de números. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function resolveBattle(
  attacker: CombatSide,
  defender: CombatSide,
  seed: string,
  maxRounds: number = MAX_BATTLE_ROUNDS,
): BattleOutcome {
  const atk = attacker.units.map(toState);
  const def = defender.units.map(toState);

  const initialAtkHp = totalHp(atk);
  const initialDefHp = totalHp(def);

  const rounds: BattleRound[] = [];
  const lossesAttacker: Record<string, number> = {};
  const lossesDefender: Record<string, number> = {};

  const outcome = (result: BattleSideResult, totalDamageAttacker = 0, totalDamageDefender = 0): BattleOutcome => ({
    result,
    rounds,
    lossesAttacker,
    lossesDefender,
    survivorsAttacker: survivors(atk),
    survivorsDefender: survivors(def),
    hpRemainingDefender: hpRemaining(def),
    totalDamageAttacker,
    totalDamageDefender,
  });

  // Un bando vacío no llega a combatir: evita reportes sin rondas raras.
  if (initialAtkHp <= 0 && initialDefHp <= 0) return outcome('DRAW');
  if (initialAtkHp <= 0) return outcome('LOSS');
  if (initialDefHp <= 0) return outcome('WIN');

  let totalDamageAttacker = 0;
  let totalDamageDefender = 0;

  for (let round = 1; round <= Math.max(1, maxRounds); round++) {
    if (aliveCount(atk) === 0 || aliveCount(def) === 0) break;

    const rng = mulberry32(hashSeed(`${seed}:${round}`));
    const attackerVariance = 0.9 + rng() * 0.2;
    const defenderVariance = 0.9 + rng() * 0.2;

    const attackerMitigation =
      DEFENSE_MITIGATION_SCALE /
      (DEFENSE_MITIGATION_SCALE + sideDefense(def, defender.defenseBonus));
    const defenderMitigation =
      DEFENSE_MITIGATION_SCALE /
      (DEFENSE_MITIGATION_SCALE + sideDefense(atk, attacker.defenseBonus));

    const damageToDefender =
      sideDamage(atk, attacker.attackBonus) * attackerMitigation * attackerVariance;
    const damageToAttacker =
      sideDamage(def, defender.attackBonus) * defenderMitigation * defenderVariance;

    totalDamageAttacker += damageToDefender;
    totalDamageDefender += damageToAttacker;

    const defenderLosses = applyDamage(def, damageToDefender, lossesDefender);
    const attackerLosses = applyDamage(atk, damageToAttacker, lossesAttacker);

    rounds.push({
      round,
      attackerDamage: Math.round(damageToDefender),
      defenderDamage: Math.round(damageToAttacker),
      attackerLosses,
      defenderLosses,
      attackerRemaining: aliveCount(atk),
      defenderRemaining: aliveCount(def),
    });
  }

  const attackerAlive = aliveCount(atk);
  const defenderAlive = aliveCount(def);

  let result: BattleSideResult;

  if (attackerAlive === 0 && defenderAlive === 0) {
    result = 'DRAW';
  } else if (defenderAlive === 0) {
    result = 'WIN';
  } else if (attackerAlive === 0) {
    result = 'LOSS';
  } else {
    // Se agotaron las rondas: gana quien conservó más vida proporcional.
    const attackerRatio = totalHp(atk) / initialAtkHp;
    const defenderRatio = totalHp(def) / initialDefHp;

    if (Math.abs(attackerRatio - defenderRatio) < 1e-9) {
      result = 'DRAW';
    } else {
      result = attackerRatio > defenderRatio ? 'WIN' : 'LOSS';
    }
  }

  return outcome(result, totalDamageAttacker, totalDamageDefender);
}
