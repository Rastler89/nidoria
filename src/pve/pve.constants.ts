/**
 * Balance del PvE. Todo lo que un jugador podría intentar "ajustar" desde el
 * cliente vive aquí: el frontend solo recibe el resultado ya calculado.
 */
export const PVE_CONFIG = {
  /** Tiempo de viaje (todo ataque tarda, también contra monstruos). */
  TRAVEL: {
    SECONDS_PER_TILE: 1.2,
    MIN_SECONDS: 45,
    MAX_SECONDS: 20 * 60,
  },

  /** Apariciones aleatorias en el mapa. */
  SPAWNS: {
    MAX_ACTIVE_PER_WORLD: 8,
    TTL_MINUTES: 120,
    /** Poder medio que suma un nivel de monstruo. */
    POWER_PER_LEVEL: 2500,
    MAX_LEVEL: 5,
    /** Poder medio que desbloquea cada tier. */
    TIER_POWER_STEP: 5000,
    MAX_TIER: 3,
  },

  /** Escalado del monstruo según el nivel de la aparición. */
  LEVEL_SCALING: {
    HP_FACTOR: 1.35,
    ATTACK_FACTOR: 1.25,
    DEFENSE_FACTOR: 1.2,
  },

  /** Recompensas. */
  LOOT: {
    /** Con todas las unidades muertas aún se lleva esta fracción. */
    MIN_RATIO: 0.35,
  },

  /** Límites de la petición de ataque (anti-abuso). */
  ATTACK: {
    MAX_UNIT_TYPES: 6,
    MAX_QUANTITY_PER_UNIT: 5000,
  },
} as const;

/** Cron de apariciones: cada 5 minutos. */
export const PVE_SPAWN_CRON = '*/5 * * * *';
