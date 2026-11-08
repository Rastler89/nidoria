import { ANTHILL_CONFIG } from '../config/anthill.config';

/**
 * Devuelve la capacidad de almacenamiento de un recurso para un hormiguero.
 * Si el hormiguero no tiene una capacidad válida definida, usa la base global.
 */
export function resolveResourceCapacity(
  capacities: unknown,
  resourceType: string,
): number {
  const parsed = (capacities ?? {}) as Record<string, unknown>;
  const raw = parsed[resourceType];
  const value = typeof raw === 'number' ? raw : Number(raw);

  if (!Number.isFinite(value) || value < 0) {
    return ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY;
  }

  return Math.floor(value);
}

/**
 * Aplica el límite de almacenamiento: el stock nunca puede ser negativo ni
 * superar la capacidad del hormiguero.
 */
export function capResourceStock(stock: number, capacity: number): number {
  const safeStock = Number.isFinite(stock) ? Math.floor(stock) : 0;
  const safeCapacity = Number.isFinite(capacity) ? Math.max(0, Math.floor(capacity)) : 0;

  return Math.min(Math.max(safeStock, 0), safeCapacity);
}
