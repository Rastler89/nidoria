import { ANTHILL_CONFIG } from '../config/anthill.config';
import { capResourceStock, resolveResourceCapacity } from './resource-capacity';

describe('resource-capacity', () => {
  const baseCapacity = ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY;

  describe('resolveResourceCapacity', () => {
    it('returns the capacity defined for the resource type', () => {
      expect(resolveResourceCapacity({ FOOD: 1200, WOOD: 800 }, 'FOOD')).toBe(1200);
      expect(resolveResourceCapacity({ FOOD: 1200, WOOD: 800 }, 'WOOD')).toBe(800);
    });

    it('falls back to the base capacity when the value is missing', () => {
      expect(resolveResourceCapacity({}, 'LEAD')).toBe(baseCapacity);
      expect(resolveResourceCapacity(null, 'FOOD')).toBe(baseCapacity);
    });

    it('falls back to the base capacity when the value is invalid', () => {
      expect(resolveResourceCapacity({ FOOD: -1 }, 'FOOD')).toBe(baseCapacity);
      expect(resolveResourceCapacity({ FOOD: 'abc' }, 'FOOD')).toBe(baseCapacity);
      expect(resolveResourceCapacity({ FOOD: NaN }, 'FOOD')).toBe(baseCapacity);
    });

    it('accepts zero as a valid capacity', () => {
      expect(resolveResourceCapacity({ FOOD: 0 }, 'FOOD')).toBe(0);
    });
  });

  describe('capResourceStock', () => {
    it('never exceeds the capacity', () => {
      expect(capResourceStock(1200, 1000)).toBe(1000);
      expect(capResourceStock(6800, 500)).toBe(500);
    });

    it('never returns a negative stock', () => {
      expect(capResourceStock(-10, 1000)).toBe(0);
    });

    it('keeps stock below the capacity untouched', () => {
      expect(capResourceStock(400, 1000)).toBe(400);
    });

    it('rounds decimals down to whole units', () => {
      expect(capResourceStock(400.9, 1000)).toBe(400);
    });
  });
});
