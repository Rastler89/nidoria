import { PveService } from './pve.service';
import { PVE_CONFIG } from './pve.constants';
import type { BattleOutcome } from '../combat/battle.engine';

/**
 * Tests de las reglas de balance del PvE. No tocan Prisma ni Redis: se llama a
 * los helpers privados del servicio con dobles vacíos.
 */
function buildService(): any {
  return new PveService({} as any, {} as any, {} as any, {} as any);
}

describe('PveService (balance)', () => {
  const service = buildService();

  it('el viaje nunca baja del mínimo ni supera el máximo', () => {
    expect(service.travelSeconds(0)).toBe(PVE_CONFIG.TRAVEL.MIN_SECONDS);
    expect(service.travelSeconds(100000)).toBe(PVE_CONFIG.TRAVEL.MAX_SECONDS);
  });

  it('el viaje crece con la distancia', () => {
    const near = service.travelSeconds(100);
    const far = service.travelSeconds(200);

    expect(far).toBeGreaterThan(near);
  });

  it('escala vida, ataque y defensa por nivel', () => {
    const monster = { hp: 1000, attack: 100, defense: 50 } as any;

    const level1 = service.scaleMonster(monster, 1);
    const level3 = service.scaleMonster(monster, 3);

    expect(level1).toEqual({ hp: 1000, attack: 100, defense: 50 });
    expect(level3.hp).toBeGreaterThan(level1.hp);
    expect(level3.attack).toBeGreaterThan(level1.attack);
    expect(level3.defense).toBeGreaterThan(level1.defense);
  });

  it('el nivel y el tier de la aparición están acotados', () => {
    expect(service.spawnLevel(0)).toBe(1);
    expect(service.spawnLevel(10_000_000)).toBe(PVE_CONFIG.SPAWNS.MAX_LEVEL);
    expect(service.spawnTier(0)).toBe(1);
    expect(service.spawnTier(10_000_000)).toBe(PVE_CONFIG.SPAWNS.MAX_TIER);
  });

  it('no entrega botín si no se gana', () => {
    const outcome = { result: 'LOSS', survivorsAttacker: {} } as BattleOutcome;
    const units = [{ quantity: 10 }] as any;

    expect(service.computeLoot({ FOOD: 1000 }, 1, units, outcome)).toEqual({});
  });

  it('entrega al menos el botín mínimo aunque muera todo el ejército', () => {
    const outcome = {
      result: 'WIN',
      survivorsAttacker: { soldier: 0 },
    } as unknown as BattleOutcome;
    const units = [{ quantity: 10 }] as any;

    const loot = service.computeLoot({ FOOD: 1000 }, 1, units, outcome);

    expect(loot.FOOD).toBe(Math.floor(1000 * PVE_CONFIG.LOOT.MIN_RATIO));
  });

  it('entrega todo el botín si sobrevive todo el ejército', () => {
    const outcome = {
      result: 'WIN',
      survivorsAttacker: { soldier: 10 },
    } as unknown as BattleOutcome;
    const units = [{ quantity: 10 }] as any;

    const loot = service.computeLoot({ FOOD: 1000 }, 2, units, outcome);

    expect(loot.FOOD).toBe(2000);
  });
});
