import { ANTHILL_CONFIG } from './anthill.config';

describe('ANTHILL_CONFIG', () => {
  it('should have all required sections', () => {
    expect(ANTHILL_CONFIG).toHaveProperty('LIMITS');
    expect(ANTHILL_CONFIG).toHaveProperty('INITIAL_RESOURCES');
    expect(ANTHILL_CONFIG).toHaveProperty('WORLD');
    expect(ANTHILL_CONFIG).toHaveProperty('BIOLOGY');
  });

  describe('LIMITS', () => {
    it('should have positive base population', () => {
      expect(ANTHILL_CONFIG.LIMITS.BASE_POPULATION).toBeGreaterThan(0);
    });
    it('should have base resource capacity >= initial resources', () => {
      expect(ANTHILL_CONFIG.LIMITS.BASE_RESOURCE_CAPACITY).toBeGreaterThanOrEqual(
        ANTHILL_CONFIG.INITIAL_RESOURCES.FOOD,
      );
    });
    it('should have non-negative military population', () => {
      expect(ANTHILL_CONFIG.LIMITS.BASE_MILITARY_POPULATION).toBeGreaterThanOrEqual(0);
    });
  });

  describe('INITIAL_RESOURCES', () => {
    it('should have all three resource types', () => {
      expect(ANTHILL_CONFIG.INITIAL_RESOURCES).toHaveProperty('FOOD');
      expect(ANTHILL_CONFIG.INITIAL_RESOURCES).toHaveProperty('WOOD');
      expect(ANTHILL_CONFIG.INITIAL_RESOURCES).toHaveProperty('LEAD');
    });
    it('should have positive values', () => {
      expect(ANTHILL_CONFIG.INITIAL_RESOURCES.FOOD).toBeGreaterThan(0);
      expect(ANTHILL_CONFIG.INITIAL_RESOURCES.WOOD).toBeGreaterThan(0);
      expect(ANTHILL_CONFIG.INITIAL_RESOURCES.LEAD).toBeGreaterThan(0);
    });
  });

  describe('WORLD', () => {
    it('should have positive map size', () => {
      expect(ANTHILL_CONFIG.WORLD.MAP_SIZE).toBeGreaterThan(0);
    });
    it('should have min distance less than map size', () => {
      expect(ANTHILL_CONFIG.WORLD.MIN_DISTANCE_BETWEEN_COLONIES).toBeLessThan(
        ANTHILL_CONFIG.WORLD.MAP_SIZE,
      );
    });
  });

  describe('BIOLOGY', () => {
    it('should have positive egg cost', () => {
      expect(ANTHILL_CONFIG.BIOLOGY.EGG_COST_FOOD).toBeGreaterThan(0);
    });
    it('egg cost should be affordable with initial food', () => {
      expect(ANTHILL_CONFIG.INITIAL_RESOURCES.FOOD).toBeGreaterThan(
        ANTHILL_CONFIG.BIOLOGY.EGG_COST_FOOD,
      );
    });
    it('should have positive egg time', () => {
      expect(ANTHILL_CONFIG.BIOLOGY.EGG_TIME_BASE).toBeGreaterThan(0);
    });
  });
});
