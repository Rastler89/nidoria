import { Prisma } from '@prisma/client';

/**
 * Catálogo de monstruos del PvE.
 *
 * El balance se ajusta aquí (backend), nunca en el cliente. Los valores están
 * calibrados contra las hormigas de `ants.data.ts`, cuya vida por unidad es
 * `defense * 10` (ver `unitHpFromDefense` en el motor de combate).
 *
 * `loot` es la recompensa base por nivel de aparición; el servicio la escala
 * por nivel y por daño infligido, y siempre la recorta a la capacidad del
 * almacén del jugador.
 */
export interface MonsterSeed {
  code: string;
  name: string;
  description: string;
  tier: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  points: number;
  loot: Prisma.InputJsonValue;
}

export const MONSTERS: MonsterSeed[] = [
  // --- Tier 1: primeras cacerías ---
  {
    code: 'larva_gigante',
    name: 'Larva Gigante',
    description: 'Una larva descomunal que devora raíces. Lenta, pero con mucha carne.',
    tier: 1,
    hp: 300,
    attack: 8,
    defense: 2,
    speed: 1,
    points: 10,
    loot: { FOOD: 150, WOOD: 40, LEAD: 0 },
  },
  {
    code: 'escarabajo_carronero',
    name: 'Escarabajo Carroñero',
    description: 'Se alimenta de restos y defiende su carroña con el caparazón.',
    tier: 1,
    hp: 500,
    attack: 14,
    defense: 8,
    speed: 1,
    points: 20,
    loot: { FOOD: 220, WOOD: 120, LEAD: 0 },
  },
  {
    code: 'termita_soldado',
    name: 'Termita Soldado',
    description: 'Monta guardia en los túneles secos. Rápida y agresiva.',
    tier: 1,
    hp: 420,
    attack: 20,
    defense: 5,
    speed: 2,
    points: 25,
    loot: { FOOD: 180, WOOD: 200, LEAD: 10 },
  },

  // --- Tier 2: requieren ejército consolidado ---
  {
    code: 'arana_tejedora',
    name: 'Araña Tejedora',
    description: 'Teje trampas entre las raíces y espera a que caiga la colonia.',
    tier: 2,
    hp: 1400,
    attack: 45,
    defense: 20,
    speed: 2,
    points: 80,
    loot: { FOOD: 900, WOOD: 500, LEAD: 120 },
  },
  {
    code: 'avispa_cazadora',
    name: 'Avispa Cazadora',
    description: 'Ataca desde el aire con aguijones rápidos. Poca defensa, mucho daño.',
    tier: 2,
    hp: 1100,
    attack: 70,
    defense: 12,
    speed: 4,
    points: 90,
    loot: { FOOD: 700, WOOD: 200, LEAD: 300 },
  },
  {
    code: 'ciempies_ceniza',
    name: 'Ciempiés de Ceniza',
    description: 'Su cuerpo blindado avanza sin detenerse entre las brasas.',
    tier: 2,
    hp: 1800,
    attack: 40,
    defense: 30,
    speed: 2,
    points: 110,
    loot: { FOOD: 600, WOOD: 900, LEAD: 150 },
  },

  // --- Tier 3: amenazas mayores ---
  {
    code: 'escorpion_obsidiana',
    name: 'Escorpión de Obsidiana',
    description: 'El veneno de su aguijón funde la quitina. Una presa codiciada.',
    tier: 3,
    hp: 4500,
    attack: 120,
    defense: 60,
    speed: 2,
    points: 300,
    loot: { FOOD: 2500, WOOD: 1500, LEAD: 1200 },
  },
  {
    code: 'gusano_profundidades',
    name: 'Gusano de las Profundidades',
    description: 'Excava galerías bajo el hormiguero y devora lo que encuentra.',
    tier: 3,
    hp: 7000,
    attack: 100,
    defense: 90,
    speed: 1,
    points: 400,
    loot: { FOOD: 4000, WOOD: 2500, LEAD: 2000 },
  },
  {
    code: 'mantis_reina',
    name: 'Mantis Reina',
    description: 'Depredadora suprema de la superficie. Su guardia no perdona.',
    tier: 3,
    hp: 5500,
    attack: 180,
    defense: 50,
    speed: 3,
    points: 500,
    loot: { FOOD: 3000, WOOD: 2000, LEAD: 2500 },
  },
];
