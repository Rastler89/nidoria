import { resolveBattle, type CombatSide, type CombatUnit } from './battle.engine';

function unit(overrides: Partial<CombatUnit> = {}): CombatUnit {
  return {
    key: 'soldier',
    name: 'Soldado',
    attack: 10,
    defense: 5,
    speed: 1,
    hp: 50,
    quantity: 10,
    ...overrides,
  };
}

function side(units: CombatUnit[], overrides: Partial<CombatSide> = {}): CombatSide {
  return { units, ...overrides };
}

describe('resolveBattle', () => {
  it('gana el bando con mucha más fuerza', () => {
    const outcome = resolveBattle(
      side([unit({ attack: 50, hp: 100, quantity: 20 })]),
      side([unit({ key: 'grub', attack: 5, defense: 1, hp: 20, quantity: 5 })]),
      'seed-fuerte',
    );

    expect(outcome.result).toBe('WIN');
    expect(outcome.survivorsDefender.grub).toBe(0);
    expect(outcome.rounds.length).toBeGreaterThan(0);
  });

  it('es determinista: la misma semilla produce el mismo reporte', () => {
    const attacker = side([unit({ attack: 20, quantity: 12 })]);
    const defender = side([unit({ key: 'monster', attack: 18, hp: 400, quantity: 1 })]);

    const first = resolveBattle(attacker, defender, 'semilla-fija');
    const second = resolveBattle(attacker, defender, 'semilla-fija');

    expect(second).toEqual(first);
  });

  it('nunca pierde más unidades de las enviadas', () => {
    const attacker = side([unit({ quantity: 7 })]);
    const defender = side([unit({ key: 'monster', attack: 999, hp: 100000, quantity: 1 })]);

    const outcome = resolveBattle(attacker, defender, 'masacre');

    expect(outcome.lossesAttacker.soldier ?? 0).toBeLessThanOrEqual(7);
    expect(outcome.survivorsAttacker.soldier).toBeGreaterThanOrEqual(0);
    expect((outcome.lossesAttacker.soldier ?? 0) + outcome.survivorsAttacker.soldier).toBe(7);
  });

  it('devuelve LOSS si el atacante no lleva unidades', () => {
    const outcome = resolveBattle(side([]), side([unit({ key: 'monster' })]), 'vacio');

    expect(outcome.result).toBe('LOSS');
    expect(outcome.rounds).toHaveLength(0);
  });

  it('devuelve WIN si el defensor no tiene unidades', () => {
    const outcome = resolveBattle(side([unit()]), side([]), 'vacio');

    expect(outcome.result).toBe('WIN');
    expect(outcome.rounds).toHaveLength(0);
  });

  it('desgasta la vida del monstruo entre rondas en vez de perder el daño parcial', () => {
    const monster = side([
      unit({ key: 'monster', attack: 1, defense: 0, speed: 1, hp: 5000, quantity: 1 }),
    ]);
    const attacker = side([unit({ attack: 100, defense: 1000, quantity: 5 })]);

    const outcome = resolveBattle(attacker, monster, 'desgaste');

    // Con 5000 de vida el primer golpe no lo mata, pero la vida baja.
    expect(outcome.hpRemainingDefender.monster).toBeLessThan(5000);
    expect(outcome.hpRemainingDefender.monster).toBeGreaterThanOrEqual(0);
    expect(outcome.result).toBe('WIN');
  });

  it('termina en DRAW si ambos bandos se anulan y no muere nadie', () => {
    const a = side([unit({ attack: 0, defense: 100000, quantity: 1 })]);
    const d = side([unit({ attack: 0, defense: 100000, quantity: 1 })]);

    const outcome = resolveBattle(a, d, 'empate', 3);

    expect(outcome.result).toBe('DRAW');
    expect(outcome.rounds).toHaveLength(3);
  });
});
